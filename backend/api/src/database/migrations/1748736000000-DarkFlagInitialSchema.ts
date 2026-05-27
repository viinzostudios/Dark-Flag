import { MigrationInterface, QueryRunner } from 'typeorm';

export class DarkFlagInitialSchema1748736000000 implements MigrationInterface {
  name = 'DarkFlagInitialSchema1748736000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── users ─────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"            uuid        NOT NULL DEFAULT gen_random_uuid(),
        "email"         varchar(255) NOT NULL,
        "username"      varchar(50)  NOT NULL,
        "password_hash" varchar      NOT NULL,
        "is_active"     boolean      NOT NULL DEFAULT true,
        "created_at"    timestamptz  NOT NULL DEFAULT now(),
        "updated_at"    timestamptz  NOT NULL DEFAULT now(),
        "last_login"    timestamptz,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_username" UNIQUE ("username")
      )
    `);

    // ── user_profiles ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_profiles" (
        "id"                    uuid        NOT NULL,
        "display_name"          varchar(50),
        "level"                 int         NOT NULL DEFAULT 1,
        "xp"                    int         NOT NULL DEFAULT 0,
        "coins"                 int         NOT NULL DEFAULT 0,
        "premium_coins"         int         NOT NULL DEFAULT 0,
        "active_character_id"   varchar,
        "active_arena_slug"     varchar(64) NOT NULL DEFAULT 'space-station',
        "active_avatar_slug"    varchar(50) NOT NULL DEFAULT 'avatar-01',
        "preferred_lang"        varchar(10) NOT NULL DEFAULT '',
        "updated_at"            timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_profiles_users" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // ── player_stats ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "player_stats" (
        "id"                   uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id"              varchar NOT NULL,
        "games_played"         int NOT NULL DEFAULT 0,
        "flag_captures"        int NOT NULL DEFAULT 0,
        "flag_pickups"         int NOT NULL DEFAULT 0,
        "maces_landed"         int NOT NULL DEFAULT 0,
        "maces_received"       int NOT NULL DEFAULT 0,
        "level_15_reached"     boolean NOT NULL DEFAULT false,
        "best_score_session"   int NOT NULL DEFAULT 0,
        "best_level_reached"   int NOT NULL DEFAULT 1,
        "traps_triggered"      int NOT NULL DEFAULT 0,
        "powerups_collected"   int NOT NULL DEFAULT 0,
        "play_seconds"         int NOT NULL DEFAULT 0,
        "total_score"          int NOT NULL DEFAULT 0,
        "created_at"           timestamptz NOT NULL DEFAULT now(),
        "updated_at"           timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_player_stats" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_player_stats_user_id" ON "player_stats" ("user_id")`);

    // ── game_sessions ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "game_sessions" (
        "id"               uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id"          varchar NOT NULL,
        "score"            int NOT NULL DEFAULT 0,
        "duration_seconds" int NOT NULL DEFAULT 0,
        "flag_captures"    int NOT NULL DEFAULT 0,
        "flag_pickups"     int NOT NULL DEFAULT 0,
        "maces_landed"     int NOT NULL DEFAULT 0,
        "level_15_reached" boolean NOT NULL DEFAULT false,
        "best_level"       int NOT NULL DEFAULT 1,
        "played_at"        timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_game_sessions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_game_sessions_user_id" ON "game_sessions" ("user_id")`);

    // ── characters ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "characters" (
        "id"             uuid        NOT NULL DEFAULT gen_random_uuid(),
        "slug"           varchar(60) NOT NULL,
        "name"           varchar(60) NOT NULL,
        "description"    varchar(200) NOT NULL DEFAULT '',
        "rarity"         varchar     NOT NULL,
        "body_color"     varchar(20) NOT NULL,
        "price_coins"    int         NOT NULL DEFAULT 0,
        "gem_price"      int         NOT NULL DEFAULT 0,
        "matches_unlock" int,
        "is_default"     boolean     NOT NULL DEFAULT false,
        "is_available"   boolean     NOT NULL DEFAULT true,
        "sort_order"     int         NOT NULL DEFAULT 0,
        "created_at"     timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_characters" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_characters_slug" UNIQUE ("slug")
      )
    `);

    // ── user_characters ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_characters" (
        "id"            uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id"       varchar NOT NULL,
        "character_id"  varchar NOT NULL,
        "equipped_at"   timestamptz,
        "unlocked_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_characters" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_characters_user_id" ON "user_characters" ("user_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_characters_user_char" ON "user_characters" ("user_id", "character_id")`);

    // ── arenas ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "arenas" (
        "id"          uuid        NOT NULL DEFAULT gen_random_uuid(),
        "slug"        varchar(64) NOT NULL,
        "name"        varchar(128) NOT NULL,
        "description" varchar(300) NOT NULL DEFAULT '',
        "price_coins" int         NOT NULL DEFAULT 0,
        "is_default"  boolean     NOT NULL DEFAULT false,
        "sort_order"  int         NOT NULL DEFAULT 0,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_arenas" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_arenas_slug" UNIQUE ("slug")
      )
    `);

    // ── user_arenas ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_arenas" (
        "id"          uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id"     varchar NOT NULL,
        "arena_id"    varchar NOT NULL,
        "unlocked_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_arenas" PRIMARY KEY ("id")
      )
    `);

    // ── avatars ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "avatars" (
        "id"          uuid        NOT NULL DEFAULT gen_random_uuid(),
        "slug"        varchar(50) NOT NULL,
        "name"        varchar(100) NOT NULL,
        "category"    varchar(50) NOT NULL,
        "price_coins" int         NOT NULL DEFAULT 0,
        "sort_order"  int         NOT NULL DEFAULT 0,
        "is_active"   boolean     NOT NULL DEFAULT true,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_avatars" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_avatars_slug" UNIQUE ("slug")
      )
    `);

    // ── user_avatars ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_avatars" (
        "id"          uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id"     varchar NOT NULL,
        "avatar_id"   varchar NOT NULL,
        "acquired_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_avatars" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_avatars_user_avatar" UNIQUE ("user_id", "avatar_id")
      )
    `);

    // ── transactions ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transactions" (
        "id"            uuid    NOT NULL DEFAULT gen_random_uuid(),
        "user_id"       varchar NOT NULL,
        "type"          varchar NOT NULL,
        "amount"        int     NOT NULL,
        "balance_after" int     NOT NULL,
        "description"   varchar,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_transactions_user_id" ON "transactions" ("user_id")`);

    // ── missions ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "missions" (
        "id"           uuid        NOT NULL DEFAULT gen_random_uuid(),
        "title"        varchar(100) NOT NULL,
        "description"  varchar(255) NOT NULL,
        "type"         varchar     NOT NULL,
        "target_value" int         NOT NULL,
        "reward_coins" int         NOT NULL DEFAULT 50,
        "reward_xp"    int         NOT NULL DEFAULT 100,
        "is_daily"     boolean     NOT NULL DEFAULT false,
        "is_active"    boolean     NOT NULL DEFAULT true,
        "created_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_missions" PRIMARY KEY ("id")
      )
    `);

    // ── player_missions ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "player_missions" (
        "id"           uuid    NOT NULL DEFAULT gen_random_uuid(),
        "user_id"      varchar NOT NULL,
        "mission_id"   varchar NOT NULL,
        "progress"     int     NOT NULL DEFAULT 0,
        "is_completed" boolean NOT NULL DEFAULT false,
        "is_claimed"   boolean NOT NULL DEFAULT false,
        "assigned_at"  timestamptz NOT NULL,
        "expires_at"   timestamptz,
        "created_at"   timestamptz NOT NULL DEFAULT now(),
        "updated_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_player_missions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_player_missions_user_mission" UNIQUE ("user_id", "mission_id")
      )
    `);

    // ── daily_rewards ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "daily_rewards" (
        "id"             uuid    NOT NULL DEFAULT gen_random_uuid(),
        "user_id"        varchar NOT NULL,
        "last_claimed_at" timestamptz,
        "streak_days"    int     NOT NULL DEFAULT 0,
        "total_claimed"  int     NOT NULL DEFAULT 0,
        CONSTRAINT "PK_daily_rewards" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_daily_rewards_user_id" ON "daily_rewards" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "daily_rewards"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "player_missions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "missions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_avatars"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "avatars"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_arenas"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "arenas"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_characters"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "characters"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "game_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "player_stats"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
