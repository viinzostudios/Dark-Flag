# Esquemas de Base de Datos — Dark Flag

> Base de datos: PostgreSQL 16  
> Nombre de la base: `dark_flag`  
> Todas las tablas usan UUID como primary key.  
> Timestamps en UTC con zona horaria (TIMESTAMPTZ).

---

## Extensiones requeridas

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- búsqueda de texto
```

---

## Tablas

### users
Cuentas de usuario. Una fila por cuenta.

```sql
CREATE TABLE users (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email          VARCHAR(255) UNIQUE NOT NULL,
  username       VARCHAR(50)  UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_login     TIMESTAMPTZ
);

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

---

### user_profiles
Perfil de juego de cada usuario. Relación 1:1 con `users`.  
`active_character_id` puede ser NULL si el jugador aún no tiene personaje equipado.

```sql
CREATE TABLE user_profiles (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  active_character_id  UUID,       -- FK a characters.id, nullable
  coins                INT         NOT NULL DEFAULT 0,
  gems                 INT         NOT NULL DEFAULT 0,
  total_xp             INT         NOT NULL DEFAULT 0,
  level                INT         NOT NULL DEFAULT 1,
  preferred_lang       VARCHAR(10) NOT NULL DEFAULT 'es',

  CONSTRAINT chk_coins    CHECK (coins >= 0),
  CONSTRAINT chk_gems     CHECK (gems >= 0),
  CONSTRAINT chk_total_xp CHECK (total_xp >= 0),
  CONSTRAINT chk_level    CHECK (level >= 1)
);

-- FK diferida para evitar dependencia circular con characters
ALTER TABLE user_profiles
  ADD CONSTRAINT fk_active_character
  FOREIGN KEY (active_character_id) REFERENCES characters(id) ON DELETE SET NULL;
```

> `preferred_lang`: código BCP-47 de 2–5 chars (ej. 'es', 'en', 'pt-BR').

---

### refresh_tokens
Tokens de refresco JWT. Un usuario puede tener múltiples tokens activos (multi-dispositivo).

```sql
CREATE TABLE refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 del token
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user       ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires    ON refresh_tokens(expires_at);
```

---

### characters
Catálogo de personajes/skins disponibles en el juego.  
`matches_unlock`: número de partidas necesarias para desbloquear gratis (NULL = no disponible gratis).

```sql
CREATE TYPE character_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');

CREATE TABLE characters (
  id               UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             VARCHAR(50)       NOT NULL UNIQUE,
  name             VARCHAR(100)      NOT NULL,
  body_color       VARCHAR(7)        NOT NULL,  -- hex color, ej. '#FF5733'
  rarity           character_rarity  NOT NULL DEFAULT 'common',
  price_coins      INT,              -- NULL = no comprable con coins
  gem_price        INT,              -- NULL = no comprable con gems
  matches_unlock   INT,              -- NULL = no desbloqueable por partidas
  is_default       BOOLEAN           NOT NULL DEFAULT FALSE,
  sort_order       INT               NOT NULL DEFAULT 0,

  CONSTRAINT chk_price_coins    CHECK (price_coins IS NULL OR price_coins > 0),
  CONSTRAINT chk_gem_price      CHECK (gem_price IS NULL OR gem_price > 0),
  CONSTRAINT chk_matches_unlock CHECK (matches_unlock IS NULL OR matches_unlock > 0)
);

CREATE INDEX idx_characters_rarity ON characters(rarity);
CREATE INDEX idx_characters_sort   ON characters(sort_order);
```

---

### user_characters
Personajes que posee cada usuario.

```sql
CREATE TABLE user_characters (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id  UUID        NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  equipped_at   TIMESTAMPTZ,          -- NULL si no está actualmente equipado
  unlocked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, character_id)
);

CREATE INDEX idx_user_characters_user ON user_characters(user_id);
```

---

### avatars
Catálogo de avatares de perfil disponibles.

```sql
CREATE TABLE avatars (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       VARCHAR(50)  NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  image_url  TEXT         NOT NULL
);
```

---

### user_avatars
Avatares desbloqueados por cada usuario.

```sql
CREATE TABLE user_avatars (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avatar_id    UUID        NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, avatar_id)
);

CREATE INDEX idx_user_avatars_user ON user_avatars(user_id);
```

---

### arenas
Catálogo de arenas/mapas disponibles.

```sql
CREATE TABLE arenas (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         VARCHAR(50)  NOT NULL UNIQUE,
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  price_coins  INT,         -- NULL = no comprable con coins
  is_default   BOOLEAN      NOT NULL DEFAULT FALSE,
  sort_order   INT          NOT NULL DEFAULT 0,

  CONSTRAINT chk_arena_price CHECK (price_coins IS NULL OR price_coins > 0)
);

CREATE INDEX idx_arenas_sort ON arenas(sort_order);
```

---

### user_arenas
Arenas desbloqueadas por cada usuario.

```sql
CREATE TABLE user_arenas (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  arena_id     UUID        NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, arena_id)
);

CREATE INDEX idx_user_arenas_user ON user_arenas(user_id);
```

---

### player_stats
Estadísticas históricas acumuladas de cada jugador. Una fila por usuario.

```sql
CREATE TABLE player_stats (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  flag_captures       INT     NOT NULL DEFAULT 0,   -- entregas completadas
  flag_pickups        INT     NOT NULL DEFAULT 0,   -- veces que recogió la bandera
  maces_landed        INT     NOT NULL DEFAULT 0,   -- mazos conectados
  maces_received      INT     NOT NULL DEFAULT 0,   -- veces stunned por mazo
  level_15_reached    BOOLEAN NOT NULL DEFAULT FALSE,
  best_score_session  INT     NOT NULL DEFAULT 0,   -- mejor puntuación en una partida
  best_level_reached  INT     NOT NULL DEFAULT 1,   -- mayor nivel de stack alcanzado
  traps_triggered     INT     NOT NULL DEFAULT 0,
  play_seconds        INT     NOT NULL DEFAULT 0,
  games_played        INT     NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### match_history
Resultado individual de cada partida por jugador.

```sql
CREATE TABLE match_history (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score             INT         NOT NULL DEFAULT 0,
  flag_captures     INT         NOT NULL DEFAULT 0,
  maces_landed      INT         NOT NULL DEFAULT 0,
  best_level        INT         NOT NULL DEFAULT 1,
  duration_seconds  INT         NOT NULL DEFAULT 0,
  played_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_match_history_user   ON match_history(user_id);
CREATE INDEX idx_match_history_played ON match_history(played_at DESC);
```

---

### missions
Catálogo de misiones del juego.

```sql
CREATE TYPE mission_requirement_type AS ENUM (
  'flag_captures',
  'maces_landed',
  'score_total',
  'powerups_collected',
  'level_reached'
);

CREATE TABLE missions (
  id                 UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               VARCHAR(100)             NOT NULL UNIQUE,
  name               VARCHAR(150)             NOT NULL,
  description        TEXT,
  requirement_type   mission_requirement_type NOT NULL,
  requirement_value  INT                      NOT NULL,
  reward_coins       INT                      NOT NULL DEFAULT 0,
  is_repeatable      BOOLEAN                  NOT NULL DEFAULT FALSE,

  CONSTRAINT chk_requirement_value CHECK (requirement_value > 0),
  CONSTRAINT chk_reward_coins      CHECK (reward_coins >= 0)
);
```

---

### player_missions
Estado de progreso de misiones por usuario.

```sql
CREATE TABLE player_missions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id    UUID        NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  progress      INT         NOT NULL DEFAULT 0,
  completed     BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,

  UNIQUE(user_id, mission_id),
  CONSTRAINT chk_progress CHECK (progress >= 0)
);

CREATE INDEX idx_player_missions_user ON player_missions(user_id);
```

---

### transactions
Log de todas las transacciones económicas (coins y gems).

```sql
CREATE TYPE transaction_type AS ENUM ('purchase', 'reward', 'daily', 'mission');

CREATE TABLE transactions (
  id             UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type           transaction_type NOT NULL,
  amount         INT              NOT NULL,   -- positivo = ingreso, negativo = gasto
  balance_after  INT              NOT NULL,   -- saldo de coins tras la transacción
  description    TEXT,
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user    ON transactions(user_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
```

---

### daily_rewards
Registro del daily reward reclamado por cada usuario.

```sql
CREATE TABLE daily_rewards (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rewarded_at   DATE        NOT NULL DEFAULT CURRENT_DATE,
  coins_amount  INT         NOT NULL DEFAULT 0,

  UNIQUE(user_id, rewarded_at),
  CONSTRAINT chk_coins_amount CHECK (coins_amount >= 0)
);

CREATE INDEX idx_daily_rewards_user ON daily_rewards(user_id);
```

---

## Diagrama de relaciones

```
users (1) ──── (1) user_profiles ────> characters (FK nullable)
users (1) ──── (1) player_stats
users (1) ──── (N) refresh_tokens
users (1) ──── (N) user_characters ──── (N) characters
users (1) ──── (N) user_avatars     ──── (N) avatars
users (1) ──── (N) user_arenas      ──── (N) arenas
users (1) ──── (N) match_history
users (1) ──── (N) player_missions  ──── (N) missions
users (1) ──── (N) transactions
users (1) ──── (N) daily_rewards
```

---

## Migraciones

Gestionadas con TypeORM en `backend/api/src/database/migrations/`.

Orden de creación obligatorio (por dependencias de FK):

1. `CreateUsers`
2. `CreateCharacters`
3. `CreateAvatars`
4. `CreateArenas`
5. `CreateUserProfiles`        ← depende de users + characters
6. `CreateRefreshTokens`
7. `CreateUserCharacters`
8. `CreateUserAvatars`
9. `CreateUserArenas`
10. `CreatePlayerStats`
11. `CreateMatchHistory`
12. `CreateMissions`
13. `CreatePlayerMissions`
14. `CreateTransactions`
15. `CreateDailyRewards`

---

## Seeders necesarios

### characters (obligatorio antes de abrir el juego)
```sql
INSERT INTO characters (slug, name, body_color, rarity, price_coins, gem_price, matches_unlock, is_default, sort_order)
VALUES
  ('default-blue',   'Blue Runner',   '#3B82F6', 'common',    NULL, NULL, NULL, TRUE,  0),
  ('red-striker',    'Red Striker',   '#EF4444', 'common',     500, NULL,   10, FALSE, 1),
  ('green-ghost',    'Green Ghost',   '#22C55E', 'rare',      1500, NULL,   25, FALSE, 2),
  ('gold-knight',    'Gold Knight',   '#F59E0B', 'epic',      3000,   15, NULL, FALSE, 3),
  ('shadow-phantom', 'Shadow Phantom','#1E1B4B', 'legendary',  NULL,   50, NULL, FALSE, 4);
```

### avatars (obligatorio antes de abrir el juego)
```sql
INSERT INTO avatars (slug, name, image_url) VALUES
  ('avatar-01', 'Rookie',    '/assets/avatars/avatar-01.png'),
  ('avatar-02', 'Scout',     '/assets/avatars/avatar-02.png'),
  ('avatar-03', 'Hunter',    '/assets/avatars/avatar-03.png'),
  ('avatar-04', 'Stalker',   '/assets/avatars/avatar-04.png'),
  ('avatar-05', 'Phantom',   '/assets/avatars/avatar-05.png'),
  ('avatar-06', 'Warden',    '/assets/avatars/avatar-06.png'),
  ('avatar-07', 'Specter',   '/assets/avatars/avatar-07.png'),
  ('avatar-08', 'Vanguard',  '/assets/avatars/avatar-08.png'),
  ('avatar-09', 'Reaper',    '/assets/avatars/avatar-09.png'),
  ('avatar-10', 'Champion',  '/assets/avatars/avatar-10.png');
```

### arenas (obligatorio antes de abrir el juego)
```sql
INSERT INTO arenas (slug, name, description, price_coins, is_default, sort_order)
VALUES
  ('dark-cave',    'Dark Cave',    'La arena original. Sin piedad.',  NULL,  TRUE, 0),
  ('neon-ruins',   'Neon Ruins',   'Ruinas industriales con neón.',   2000, FALSE, 1),
  ('frozen-vault', 'Frozen Vault', 'Cripta helada. Trampas dobles.',  3500, FALSE, 2);
```

### missions (catálogo inicial)
```sql
INSERT INTO missions (slug, name, description, requirement_type, requirement_value, reward_coins, is_repeatable)
VALUES
  ('first-blood',    'First Blood',      'Mazea a un enemigo por primera vez.',  'maces_landed',       1,   100, FALSE),
  ('flag-runner',    'Flag Runner',      'Entrega la bandera 1 vez.',            'flag_captures',      1,   150, FALSE),
  ('power-hungry',   'Power Hungry',     'Recoge 5 power-ups.',                  'powerups_collected', 5,   200, FALSE),
  ('top-of-stack',   'Top of the Stack', 'Alcanza el nivel 10 en una partida.',  'level_reached',     10,   500, FALSE),
  ('dark-master',    'Dark Master',      'Alcanza el nivel 15.',                 'level_reached',     15,  1000, FALSE),
  ('serial-macer',   'Serial Macer',     'Mazea 50 veces en total.',             'maces_landed',      50,   300,  TRUE),
  ('flag-deliverer', 'Flag Deliverer',   'Entrega la bandera 10 veces.',         'flag_captures',     10,   400,  TRUE);
```
