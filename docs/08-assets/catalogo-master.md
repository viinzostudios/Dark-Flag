# Catálogo Master de Assets — Arena Siege Tanks

> Fuente única de verdad para todos los assets visuales.
> Orden de producción: de mayor a menor prioridad.
> Estado: ⬜ pendiente | 🔄 en revisión | ✅ aprobado | 🎮 integrado

---

## Cómo se generan

- **Herramienta**: API `gpt-image-1` (OpenAI), calidad `low` para borradores, `high` para aprobados
- **Fondo transparente**: parámetro `background: "transparent"` — nativo en gpt-image-1
- **Tamaño de generación**: siempre `1024x1024` → post-proceso escala al tamaño de juego
- **Sprite sheets**: se generan frame por frame y se ensamblan con `scripts/assemble-spritesheet.js`
- **Borradores**: `docs/08-assets/review/{id}-draft.png`
- **Aprobados**: `frontend/public/assets/{categoria}/{id}.png`

---

## PRIORIDAD 1 — Estilo base (5 imágenes)
> Aprobar estas antes de continuar. Definen el look visual de TODO el juego.

---

### `tank-default-body`
**Descripción**: Cuerpo del tanque del jugador. Vista cenital. Sin cañón.
**Archivo**: `frontend/public/assets/tanks/tank-default-body.png`
**Dimensiones juego**: 128×128 px | **Generación**: 1024×1024, fondo transparente
**Estado**: ⬜

```typescript
// Preload (GameScene)
this.load.image('tank-default-body', 'assets/tanks/tank-default-body.png');

// Create (PlayerTank.ts)
this.body = this.scene.add.image(x, y, 'tank-default-body');
this.body.setOrigin(0.5, 0.5);
this.body.setDisplaySize(128, 128);
this.body.setDepth(10);
```

---

### `tank-default-cannon`
**Descripción**: Cañón del tanque. Apunta hacia la DERECHA (+X). Se rota independientemente del cuerpo.
**Archivo**: `frontend/public/assets/tanks/tank-default-cannon.png`
**Dimensiones juego**: 64×64 px | **Generación**: 1024×1024, fondo transparente
**Estado**: ⬜

```typescript
// Preload
this.load.image('tank-default-cannon', 'assets/tanks/tank-default-cannon.png');

// Create (PlayerTank.ts) — pivot en extremo izquierdo para girar desde la base
this.cannon = this.scene.add.image(x, y, 'tank-default-cannon');
this.cannon.setOrigin(0.15, 0.5); // pivot: ~15% desde la izquierda = base del cañón
this.cannon.setDisplaySize(64, 64);
this.cannon.setDepth(11);

// Update — rotar hacia el cursor
this.cannon.setRotation(aimAngle);
this.cannon.setPosition(this.body.x, this.body.y);
```

---

### `bullet-bounce3`
**Descripción**: Bala con 3 rebotes restantes (estado inicial). Esfera blanca brillante.
**Archivo**: `frontend/public/assets/projectiles/bullet-bounce3.png`
**Dimensiones juego**: 32×32 px | **Generación**: 1024×1024, fondo transparente
**Estado**: ⬜

```typescript
// Preload
this.load.image('bullet-bounce3', 'assets/projectiles/bullet-bounce3.png');
this.load.image('bullet-bounce2', 'assets/projectiles/bullet-bounce2.png');
this.load.image('bullet-bounce1', 'assets/projectiles/bullet-bounce1.png');
this.load.image('bullet-bounce0', 'assets/projectiles/bullet-bounce0.png');

// Create (Projectile.ts)
this.sprite = this.scene.add.image(x, y, `bullet-bounce${bouncesLeft}`);
this.sprite.setDisplaySize(32, 32);
this.sprite.setBlendMode(Phaser.BlendModes.ADD);
this.sprite.setDepth(15);

// Update — cambiar textura según rebotes restantes
this.sprite.setTexture(`bullet-bounce${this.bouncesLeft}`);
```

---

### `wall-h-hp3`
**Descripción**: Muro horizontal intacto (HP 3/3). Franja de luz azul.
**Archivo**: `frontend/public/assets/walls/wall-h-hp3.png`
**Dimensiones juego**: 128×32 px | **Generación**: 1024×1024, fondo transparente
**Estado**: ⬜

```typescript
// Preload
this.load.image('wall-h-hp3', 'assets/walls/wall-h-hp3.png');
this.load.image('wall-h-hp2', 'assets/walls/wall-h-hp2.png');
this.load.image('wall-h-hp1', 'assets/walls/wall-h-hp1.png');

// Create (Wall.ts) — width=80, height=20 según GDD
this.sprite = this.scene.add.image(x, y, `wall-h-hp${wall.hp}`);
this.sprite.setDisplaySize(wall.width, wall.height); // 80×20 o 20×80
this.sprite.setDepth(8);
// Para muro vertical: setRotation(Math.PI / 2)

// Update — cambiar textura al recibir daño
this.sprite.setTexture(`wall-h-hp${this.hp}`);
```

---

### `bg-floor-tile`
**Descripción**: Tile seamless del suelo de la arena. Metal oscuro con desgaste.
**Archivo**: `frontend/public/assets/environment/bg-floor-tile.png`
**Dimensiones juego**: 512×512 px (tile) | **Generación**: 1024×1024, fondo opaco
**Estado**: ⬜

```typescript
// Preload
this.load.image('bg-floor-tile', 'assets/environment/bg-floor-tile.png');

// Create (GameScene.ts) — TileSprite cubre todo el mapa
this.floor = this.add.tileSprite(0, 0, MAP_WIDTH, MAP_HEIGHT, 'bg-floor-tile');
this.floor.setOrigin(0, 0);
this.floor.setDepth(0);
```

---

## PRIORIDAD 2 — Gameplay visual completo (~28 imágenes)
> Con estos el juego se ve "real". Arrancar solo después de aprobar Prioridad 1.

---

### `bullet-bounce2`, `bullet-bounce1`, `bullet-bounce0`
**Descripción**: Estados de la bala al rebotar. Amarillo → Naranja → Rojo.
**Archivos**: `assets/projectiles/bullet-bounce{2,1,0}.png`
**Dimensiones juego**: 32×32 px cada uno | **Generación**: 3 imágenes individuales
**Estado**: ⬜ | **Uso**: ver `bullet-bounce3` arriba — misma lógica, `setTexture` dinámico

---

### `wall-h-hp2`, `wall-h-hp1` + variantes verticales
**Descripción**: Muros con daño. HP2 = grieta + luz amarilla. HP1 = grietas severas + luz roja.
**Archivos**: `assets/walls/wall-h-hp{2,1}.png` y `wall-v-hp{3,2,1}.png`
**Dimensiones juego**: 128×32 (H) / 32×128 (V) | **Generación**: 5 imágenes
**Estado**: ⬜ | **Uso**: ver `wall-h-hp3` arriba

---

### `vfx-muzzle-flash` *(spritesheet: 3 frames)*
**Descripción**: Destello en la boca del cañón al disparar. Dura ~150ms.
**Archivo**: `assets/effects/vfx-muzzle-flash.png` → spritesheet 288×96 (3 frames × 96×96)
**Generación**: 3 imágenes individuales 1024×1024 → script ensambla
**Estado**: ⬜

```typescript
// Preload
this.load.spritesheet('vfx-muzzle-flash', 'assets/effects/vfx-muzzle-flash.png',
  { frameWidth: 96, frameHeight: 96 });

// Crear animación (una vez en GameScene)
this.anims.create({
  key: 'muzzle-flash',
  frames: this.anims.generateFrameNumbers('vfx-muzzle-flash', { start: 0, end: 2 }),
  frameRate: 20,
  repeat: 0,
});

// Usar en PlayerTank al disparar
const flash = this.scene.add.sprite(cannonTipX, cannonTipY, 'vfx-muzzle-flash');
flash.setRotation(this.cannon.rotation);
flash.setBlendMode(Phaser.BlendModes.ADD);
flash.setDepth(25);
flash.play('muzzle-flash');
flash.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => flash.destroy());
```

---

### `vfx-impact-wall` *(spritesheet: 3 frames)*
**Descripción**: Chispas metálicas cuando una bala golpea un muro.
**Archivo**: `assets/effects/vfx-impact-wall.png` → spritesheet 288×96 (3 frames × 96×96)
**Generación**: 3 imágenes individuales → script ensambla | **Estado**: ⬜

```typescript
this.load.spritesheet('vfx-impact-wall', 'assets/effects/vfx-impact-wall.png',
  { frameWidth: 96, frameHeight: 96 });
this.anims.create({ key: 'impact-wall', frames: ..., frameRate: 20, repeat: 0 });

// Usar en GameScene al detectar colisión bala-muro
const impact = this.scene.add.sprite(bulletX, bulletY, 'vfx-impact-wall');
impact.setBlendMode(Phaser.BlendModes.ADD);
impact.setDepth(20);
impact.play('impact-wall');
impact.on('animationcomplete', () => impact.destroy());
```

---

### `vfx-tank-explosion` *(spritesheet: 5 frames)*
**Descripción**: Explosión grande al morir un tanque. El VFX más importante del juego.
**Archivo**: `assets/effects/vfx-tank-explosion.png` → spritesheet 1280×256 (5 frames × 256×256)
**Generación**: 5 imágenes individuales → script ensambla | **Estado**: ⬜

```typescript
this.load.spritesheet('vfx-tank-explosion', 'assets/effects/vfx-tank-explosion.png',
  { frameWidth: 256, frameHeight: 256 });
this.anims.create({ key: 'tank-explosion', frames: ..., frameRate: 14, repeat: 0 });

// Usar en GameScene al recibir evento player_dead
const explosion = this.scene.add.sprite(tankX, tankY, 'vfx-tank-explosion');
explosion.setDepth(30);
explosion.play('tank-explosion');
explosion.on('animationcomplete', () => explosion.destroy());
```

---

### `particle-smoke`, `particle-spark`, `particle-dot`
**Descripción**: Texturas para Phaser ParticleEmitter. Un sprite pequeño por tipo.
**Archivos**: `assets/effects/particle-{smoke,spark,dot}.png`
**Dimensiones**: 32×32 / 8×8 / 12×12 | **Generación**: 3 imágenes | **Estado**: ⬜

```typescript
// Preload
this.load.image('particle-smoke', 'assets/effects/particle-smoke.png');
this.load.image('particle-spark', 'assets/effects/particle-spark.png');
this.load.image('particle-dot',   'assets/effects/particle-dot.png');

// Humo de escape del tanque (PlayerTank.ts)
this.exhaustEmitter = this.scene.add.particles(x, y, 'particle-smoke', {
  x: { random: [-8, 8] }, lifespan: 800,
  scale: { start: 0.15, end: 0.5 }, alpha: { start: 0.5, end: 0 },
  speed: { random: [20, 40] }, angle: { random: [200, 340] },
  frequency: 400, depth: 9,
});

// Trail de bala (Projectile.ts)
this.trailEmitter = this.scene.add.particles(x, y, 'particle-dot', {
  lifespan: 120, scale: { start: 0.3, end: 0 },
  alpha: { start: 0.8, end: 0 }, speed: 0, frequency: 16,
  tint: bulletTintColor, blendMode: Phaser.BlendModes.ADD, depth: 14,
});
```

---

### `pickup-ammo3`, `pickup-wall2`
**Descripción**: Pickups más comunes. Verde para balas, azul para muros.
**Archivos**: `assets/pickups/pickup-ammo3.png`, `assets/pickups/pickup-wall2.png`
**Dimensiones juego**: 48×48 | **Generación**: 2 imágenes | **Estado**: ⬜

```typescript
this.load.image('pickup-ammo3', 'assets/pickups/pickup-ammo3.png');
this.load.image('pickup-wall2', 'assets/pickups/pickup-wall2.png');

// Crear pickup con animación bob (Pickup.ts)
this.sprite = this.scene.add.image(x, y, `pickup-${type.toLowerCase()}`);
this.sprite.setDisplaySize(48, 48);
this.sprite.setDepth(6);
this.scene.tweens.add({
  targets: this.sprite, y: y - 5,
  duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
});
```

---

## PRIORIDAD 3 — Pulido visual (~22 imágenes)
> Mejoran mucho la experiencia pero el juego funciona sin ellos.

---

### `vfx-respawn` *(spritesheet: 3 frames)*
**Archivo**: `assets/effects/vfx-respawn.png` → 576×192 (3 frames × 192×192) | **Estado**: ⬜

```typescript
this.load.spritesheet('vfx-respawn', 'assets/effects/vfx-respawn.png',
  { frameWidth: 192, frameHeight: 192 });
this.anims.create({ key: 'respawn', frames: ..., frameRate: 10, repeat: 0 });
// Reproducir en la posición de spawn antes de mostrar el tanque
```

---

### `vfx-wall-destroy` *(spritesheet: 3 frames)*
**Archivo**: `assets/effects/vfx-wall-destroy.png` → 384×128 (3 frames × 128×128) | **Estado**: ⬜

```typescript
this.load.spritesheet('vfx-wall-destroy', 'assets/effects/vfx-wall-destroy.png',
  { frameWidth: 128, frameHeight: 128 });
// Reproducir cuando wall.hp llega a 0
```

---

### `vfx-pickup-collect` *(spritesheet: 2 frames)*
**Archivo**: `assets/effects/vfx-pickup-collect.png` → 160×80 (2 frames × 80×80)
**Nota**: sprite en blanco — se tinta con `setTint(0x39FF14)` para ammo o `0x00E5FF` para muros | **Estado**: ⬜

```typescript
this.load.spritesheet('vfx-pickup-collect', 'assets/effects/vfx-pickup-collect.png',
  { frameWidth: 80, frameHeight: 80 });

const burst = this.scene.add.sprite(x, y, 'vfx-pickup-collect');
burst.setTint(type.startsWith('AMMO') ? 0x39FF14 : 0x00E5FF);
burst.setBlendMode(Phaser.BlendModes.ADD);
burst.play('pickup-collect');
burst.on('animationcomplete', () => burst.destroy());
```

---

### `vfx-invincibility-shield`
**Descripción**: Hexágono de energía cian sobre el tanque. Parpadeo por Phaser tween.
**Archivo**: `assets/effects/vfx-invincibility-shield.png` → 160×160 | **Estado**: ⬜

```typescript
this.load.image('vfx-invincibility-shield', 'assets/effects/vfx-invincibility-shield.png');

// PlayerTank.ts — activar al respawnear
this.shield = this.scene.add.image(this.body.x, this.body.y, 'vfx-invincibility-shield');
this.shield.setBlendMode(Phaser.BlendModes.ADD);
this.shield.setDepth(12);
this.shieldTween = this.scene.tweens.add({
  targets: this.shield,
  alpha: { from: 0.8, to: 0.1 },
  duration: 180, yoyo: true, repeat: -1,
});
this.scene.time.delayedCall(INVINCIBILITY_MS, () => {
  this.shieldTween.stop();
  this.shield.destroy();
});
```

---

### `vfx-bounce-flash`
**Archivo**: `assets/effects/vfx-bounce-flash.png` → 48×48 | **Estado**: ⬜

```typescript
this.load.image('vfx-bounce-flash', 'assets/effects/vfx-bounce-flash.png');

// Projectile.ts — al rebotar
const flash = this.scene.add.image(bounceX, bounceY, 'vfx-bounce-flash');
flash.setTint(bulletTintColor); // mismo tint que el estado de la bala
flash.setBlendMode(Phaser.BlendModes.ADD);
flash.setDepth(18);
this.scene.tweens.add({
  targets: flash, alpha: 0, duration: 80,
  onComplete: () => flash.destroy()
});
```

---

### `vfx-powerstack-aura-low`, `vfx-powerstack-aura-max`, `vfx-leader-crown-aura`
**Archivos**: `assets/effects/vfx-powerstack-aura-{low,max}.png` (160×160), `vfx-leader-crown-aura.png` (192×192) | **Estado**: ⬜

```typescript
// PlayerTank.ts — mostrar/ocultar según powerStack
updateAura(stack: number, isLeader: boolean): void {
  const key = isLeader ? 'vfx-leader-crown-aura'
    : stack >= 8 ? 'vfx-powerstack-aura-max'
    : stack >= 1 ? 'vfx-powerstack-aura-low'
    : null;
  if (!key) { this.aura?.setVisible(false); return; }
  this.aura.setTexture(key).setVisible(true);
}
// Alpha pulse del aura: tweens.add en init, cambia según tier
```

---

### `indicator-crown`
**Descripción**: Corona dorada flotante sobre el tanque del Líder. | **Dimensiones**: 32×32 | **Estado**: ⬜

```typescript
this.load.image('indicator-crown', 'assets/ui/indicator-crown.png');

// Aparece sobre el tanque líder, con tween de bob
this.crown = this.scene.add.image(tank.x, tank.y - 48, 'indicator-crown');
this.scene.tweens.add({ targets: this.crown, y: tank.y - 52, duration: 800, yoyo: true, repeat: -1 });
```

---

### `vfx-impact-border` *(spritesheet: 2 frames)*
**Archivo**: `assets/effects/vfx-impact-border.png` → 192×96 (2 frames × 96×96) | **Estado**: ⬜

```typescript
// Reproducir cuando una bala rebota en el borde de la arena
```

---

### `bg-grid-overlay`
**Descripción**: Overlay de grid de energía cian. Se aplica sobre `bg-floor-tile` con blendMode ADD.
**Archivo**: `assets/environment/bg-grid-overlay.png` → 512×512 tile seamless | **Estado**: ⬜

```typescript
this.load.image('bg-grid-overlay', 'assets/environment/bg-grid-overlay.png');
const grid = this.add.tileSprite(0, 0, MAP_WIDTH, MAP_HEIGHT, 'bg-grid-overlay');
grid.setOrigin(0, 0).setAlpha(0.15).setBlendMode(Phaser.BlendModes.ADD).setDepth(1);
```

---

### `border-wall-h`, `border-wall-v`
**Descripción**: Bordes de la arena. Metálicos, con franjas de peligro.
**Archivos**: `assets/environment/border-wall-{h,v}.png` → 128×48 / 48×128 | **Estado**: ⬜

```typescript
// GameScene.ts — construir los 4 bordes con TileSprite
this.add.tileSprite(0, 0, MAP_WIDTH, 48, 'border-wall-h').setOrigin(0, 0).setDepth(5); // top
this.add.tileSprite(0, MAP_HEIGHT - 48, MAP_WIDTH, 48, 'border-wall-h').setOrigin(0, 0).setDepth(5); // bottom
```

---

### UI Icons: `ui-bullet-icon`, `ui-wall-charge-icon`, `ui-coin-icon`
**Archivos**: `assets/ui/ui-{bullet-icon,wall-charge-icon,coin-icon}.png` → 24×24 | **Estado**: ⬜

```typescript
// HUD.ts — mostrar contadores en la esquina inferior izquierda
for (let i = 0; i < ammo; i++) {
  this.add.image(20 + i * 18, height - 30, 'ui-bullet-icon').setScrollFactor(0).setDepth(100);
}
```

---

### Pickups restantes: `pickup-ammo5`, `pickup-ammo10`, `pickup-wall5`
**Archivos**: `assets/pickups/pickup-{ammo5,ammo10,wall5}.png` → ammo5/wall5: 48×48; ammo10: 64×64 | **Estado**: ⬜

---

## PRIORIDAD 4 — Skins (40 imágenes)
> Solo cuando todo lo anterior esté aprobado e integrado.

| Skin | Rareza | Assets |
|------|--------|--------|
| Camo, Desert, Arctic, Rust, Urban, Olive, Navy, Charcoal | Common ×8 | body + cannon ×8 |
| Cobalt, Chrome, Midnight, Crimson, Ghost, Stealth | Rare ×6 | body + cannon ×6 |
| Void, Gilded, Carbon-X, Plasma | Epic ×4 | body + cannon ×4 |
| Inferno, Aurora | Legendary ×2 | body + cannon ×2 |

```typescript
// Aplicar skin al tanque (PlayerTank.ts)
applySkin(skinId: string): void {
  this.body.setTexture(`tank-${skinId}-body`);
  this.cannon.setTexture(`tank-${skinId}-cannon`);
}
```

---

## PRIORIDAD 5 — Assets secundarios

- `tank-bot-body`, `tank-bot-cannon` — tanque IA (aspecto industrial/robótico)
- `border-corner-tl/tr/bl/br` — esquinas de la arena (64×64 cada una)
- `vfx-powerstack-aura-mid` — aura para stacks 4-7 (entre low y max)

---

## Resumen de imágenes a generar

| Prioridad | Imágenes | Tipo |
|-----------|---------|------|
| P1 — Estilo base | 5 | Estáticas |
| P2 — Gameplay completo | 28 | 14 estáticas + 14 frames VFX |
| P3 — Pulido | 22 | 13 estáticas + 9 frames VFX |
| P4 — Skins | 40 | Estáticas |
| P5 — Secundarios | 8 | Estáticas |
| **Total** | **103** | |

> Costo estimado: ~$1.15 en borradores (low quality) + ~$4.20 en aprobados (high quality) = **~$5.35 total**
> Basado en gpt-image-1: low=$0.011/img, high=$0.042/img, con ~20% de rechazos.
