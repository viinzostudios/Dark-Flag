'use strict';

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DRAFTS = path.resolve(__dirname, '../docs/08-assets/review');
const OUT    = path.resolve(__dirname, '../frontend/public/assets');

// ─── Manifest ────────────────────────────────────────────────────────────────

const GROUPS = [
  // Tank groups — 1536×1024, body = left half, cannon = right half
  {
    src: 'tank-default-group-draft.png',
    outputs: [
      { file: 'tanks/tank-default-body.png',   crop: { left:0,   top:0, width:768, height:1024 }, size: { w:128, h:128 } },
      { file: 'tanks/tank-default-cannon.png',  crop: { left:768, top:0, width:768, height:1024 }, size: { w:64,  h:64  } },
    ],
  },
  {
    src: 'tank-bot-group-draft.png',
    outputs: [
      { file: 'tanks/tank-bot-body.png',   crop: { left:0,   top:0, width:768, height:1024 }, size: { w:128, h:128 } },
      { file: 'tanks/tank-bot-cannon.png',  crop: { left:768, top:0, width:768, height:1024 }, size: { w:64,  h:64  } },
    ],
  },
  {
    src: 'tank-inferno-group-draft.png',
    outputs: [
      { file: 'tanks/skins/tank-inferno-body.png',   crop: { left:0,   top:0, width:768, height:1024 }, size: { w:128, h:128 } },
      { file: 'tanks/skins/tank-inferno-cannon.png',  crop: { left:768, top:0, width:768, height:1024 }, size: { w:64,  h:64  } },
    ],
  },
  {
    src: 'tank-aurora-group-draft.png',
    outputs: [
      { file: 'tanks/skins/tank-aurora-body.png',   crop: { left:0,   top:0, width:768, height:1024 }, size: { w:128, h:128 } },
      { file: 'tanks/skins/tank-aurora-cannon.png',  crop: { left:768, top:0, width:768, height:1024 }, size: { w:64,  h:64  } },
    ],
  },
  {
    src: 'tank-void-group-draft.png',
    outputs: [
      { file: 'tanks/skins/tank-void-body.png',   crop: { left:0,   top:0, width:768, height:1024 }, size: { w:128, h:128 } },
      { file: 'tanks/skins/tank-void-cannon.png',  crop: { left:768, top:0, width:768, height:1024 }, size: { w:64,  h:64  } },
    ],
  },
  {
    src: 'tank-chrome-group-draft.png',
    outputs: [
      { file: 'tanks/skins/tank-chrome-body.png',   crop: { left:0,   top:0, width:768, height:1024 }, size: { w:128, h:128 } },
      { file: 'tanks/skins/tank-chrome-cannon.png',  crop: { left:768, top:0, width:768, height:1024 }, size: { w:64,  h:64  } },
    ],
  },
  // Bullets grid — 1024×1024, 2×2 (cells 512×512)
  {
    src: 'bullets-grid-draft.png',
    outputs: [
      { file: 'projectiles/bullet-bounce3.png', crop: { left:0,   top:0,   width:512, height:512 }, size: { w:32, h:32 } },
      { file: 'projectiles/bullet-bounce2.png', crop: { left:512, top:0,   width:512, height:512 }, size: { w:32, h:32 } },
      { file: 'projectiles/bullet-bounce1.png', crop: { left:0,   top:512, width:512, height:512 }, size: { w:32, h:32 } },
      { file: 'projectiles/bullet-bounce0.png', crop: { left:512, top:512, width:512, height:512 }, size: { w:32, h:32 } },
    ],
  },
  // Wall-h states — 1536×1024, 3 columns (each 512×1024)
  {
    src: 'wall-h-states-draft.png',
    outputs: [
      { file: 'walls/wall-h-hp3.png', crop: { left:0,    top:0, width:512, height:1024 }, size: { w:128, h:32 } },
      { file: 'walls/wall-h-hp2.png', crop: { left:512,  top:0, width:512, height:1024 }, size: { w:128, h:32 } },
      { file: 'walls/wall-h-hp1.png', crop: { left:1024, top:0, width:512, height:1024 }, size: { w:128, h:32 } },
    ],
  },
  // Pickups grid — 1024×1024, 2×2 (cells 512×512)
  // Layout: TL=ammo3, TR=ammo10, BL=wall2, BR=wall5
  {
    src: 'pickups-grid-draft.png',
    outputs: [
      { file: 'pickups/pickup-ammo3.png',  crop: { left:0,   top:0,   width:512, height:512 }, size: { w:48, h:48 } },
      { file: 'pickups/pickup-ammo10.png', crop: { left:512, top:0,   width:512, height:512 }, size: { w:64, h:64 } },
      { file: 'pickups/pickup-wall2.png',  crop: { left:0,   top:512, width:512, height:512 }, size: { w:48, h:48 } },
      { file: 'pickups/pickup-wall5.png',  crop: { left:512, top:512, width:512, height:512 }, size: { w:64, h:64 } },
    ],
  },
  // UI icons grid — 1024×1024, TL/TR/BL (BR empty)
  {
    src: 'ui-icons-grid-draft.png',
    outputs: [
      { file: 'ui/ui-bullet-icon.png',      crop: { left:0,   top:0,   width:512, height:512 }, size: { w:24, h:24 } },
      { file: 'ui/ui-wall-charge-icon.png', crop: { left:512, top:0,   width:512, height:512 }, size: { w:24, h:24 } },
      { file: 'ui/ui-coin-icon.png',        crop: { left:0,   top:512, width:512, height:512 }, size: { w:24, h:24 } },
    ],
  },
];

// Particles — vertical thirds of 1024×1024, trim then resize
const PARTICLES = [
  { src: 'particles-group-draft.png', region: { left:0, top:0,   width:1024, height:341 }, file: 'effects/particle-smoke.png', size: { w:32, h:32 } },
  { src: 'particles-group-draft.png', region: { left:0, top:341, width:1024, height:341 }, file: 'effects/particle-dot.png',   size: { w:12, h:12 } },
  { src: 'particles-group-draft.png', region: { left:0, top:682, width:1024, height:342 }, file: 'effects/particle-spark.png', size: { w:8,  h:8  } },
];

// Single images — just resize
const SINGLES = [
  { src: 'bg-floor-tile-draft.png',            file: 'environment/bg-floor-tile.png',              size: { w:512, h:512 } },
  { src: 'bg-grid-overlay-draft.png',          file: 'environment/bg-grid-overlay.png',            size: { w:512, h:512 } },
  { src: 'border-wall-h-draft.png',            file: 'environment/border-wall-h.png',              size: { w:64,  h:32  } },
  { src: 'bullet-trail-draft.png',             file: 'projectiles/bullet-trail.png',               size: { w:64,  h:16  } },
  { src: 'vfx-bounce-flash-draft.png',         file: 'effects/vfx-bounce-flash.png',              size: { w:48,  h:48  } },
  { src: 'vfx-invincibility-shield-draft.png', file: 'effects/vfx-invincibility-shield.png',      size: { w:160, h:160 } },
  { src: 'vfx-powerstack-aura-low-draft.png',  file: 'effects/vfx-powerstack-aura-low.png',       size: { w:160, h:160 } },
  { src: 'vfx-powerstack-aura-max-draft.png',  file: 'effects/vfx-powerstack-aura-max.png',       size: { w:160, h:160 } },
  { src: 'vfx-leader-crown-aura-draft.png',    file: 'effects/vfx-leader-crown-aura.png',         size: { w:192, h:192 } },
  { src: 'indicator-crown-draft.png',          file: 'tanks/indicator-crown.png',                 size: { w:32,  h:32  } },
];

// VFX spritesheets — resize each frame then composite horizontally
const SPRITESHEETS = [
  {
    frames: ['vfx-muzzle-flash-f1-draft.png', 'vfx-muzzle-flash-f2-draft.png', 'vfx-muzzle-flash-f3-draft.png'],
    frameSize: { w:96, h:96 },
    file: 'effects/vfx-muzzle-flash.png',
  },
  {
    frames: ['vfx-impact-wall-f1-draft.png', 'vfx-impact-wall-f2-draft.png', 'vfx-impact-wall-f3-draft.png'],
    frameSize: { w:96, h:96 },
    file: 'effects/vfx-impact-wall.png',
  },
  {
    frames: ['vfx-impact-border-f1-draft.png', 'vfx-impact-border-f2-draft.png'],
    frameSize: { w:96, h:96 },
    file: 'effects/vfx-impact-border.png',
  },
  {
    frames: [
      'vfx-tank-explosion-f1-draft.png', 'vfx-tank-explosion-f2-draft.png',
      'vfx-tank-explosion-f3-draft.png', 'vfx-tank-explosion-f4-draft.png',
      'vfx-tank-explosion-f5-draft.png',
    ],
    frameSize: { w:256, h:256 },
    file: 'effects/vfx-tank-explosion.png',
  },
  {
    frames: ['vfx-respawn-f1-draft.png', 'vfx-respawn-f2-draft.png', 'vfx-respawn-f3-draft.png'],
    frameSize: { w:192, h:192 },
    file: 'effects/vfx-respawn.png',
  },
  {
    frames: ['vfx-wall-destroy-f1-draft.png', 'vfx-wall-destroy-f2-draft.png', 'vfx-wall-destroy-f3-draft.png'],
    frameSize: { w:128, h:128 },
    file: 'effects/vfx-wall-destroy.png',
  },
  {
    frames: ['vfx-pickup-collect-f1-draft.png', 'vfx-pickup-collect-f2-draft.png'],
    frameSize: { w:80, h:80 },
    file: 'effects/vfx-pickup-collect.png',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RESIZE_OPTS = { fit: 'contain', background: { r:0, g:0, b:0, alpha:0 } };

let ok = 0;
let errors = 0;

function outPath(file) {
  return path.join(OUT, file);
}

function ensureDirs() {
  const dirs = [
    'tanks/skins', 'projectiles', 'walls', 'pickups', 'effects', 'environment', 'ui',
  ];
  for (const d of dirs) {
    fs.mkdirSync(path.join(OUT, d), { recursive: true });
  }
}

async function processGroup(group) {
  const srcPath = path.join(DRAFTS, group.src);
  if (!fs.existsSync(srcPath)) {
    console.warn(`  SKIP (no encontrado): ${group.src}`);
    return;
  }
  for (const out of group.outputs) {
    try {
      await sharp(srcPath)
        .extract(out.crop)
        .resize(out.size.w, out.size.h, RESIZE_OPTS)
        .png()
        .toFile(outPath(out.file));
      console.log(`  OK  ${out.file} (${out.size.w}×${out.size.h})`);
      ok++;
    } catch (e) {
      console.error(`  ERR ${out.file}: ${e.message}`);
      errors++;
    }
  }
}

async function processSingle(entry) {
  const srcPath = path.join(DRAFTS, entry.src);
  if (!fs.existsSync(srcPath)) {
    console.warn(`  SKIP (no encontrado): ${entry.src}`);
    return;
  }
  try {
    await sharp(srcPath)
      .resize(entry.size.w, entry.size.h, RESIZE_OPTS)
      .png()
      .toFile(outPath(entry.file));
    console.log(`  OK  ${entry.file} (${entry.size.w}×${entry.size.h})`);
    ok++;
  } catch (e) {
    console.error(`  ERR ${entry.file}: ${e.message}`);
    errors++;
  }
}

async function processParticle(entry) {
  const srcPath = path.join(DRAFTS, entry.src);
  if (!fs.existsSync(srcPath)) {
    console.warn(`  SKIP (no encontrado): ${entry.src}`);
    return;
  }
  try {
    await sharp(srcPath)
      .extract(entry.region)
      .resize(entry.size.w, entry.size.h, RESIZE_OPTS)
      .png()
      .toFile(outPath(entry.file));
    console.log(`  OK  ${entry.file} (${entry.size.w}×${entry.size.h})`);
    ok++;
  } catch (e) {
    console.error(`  ERR ${entry.file}: ${e.message}`);
    errors++;
  }
}

async function processSpritesheet(entry) {
  const { frames, frameSize: { w: fw, h: fh }, file } = entry;
  const buffers = [];
  for (const frameName of frames) {
    const framePath = path.join(DRAFTS, frameName);
    if (!fs.existsSync(framePath)) {
      console.warn(`  SKIP spritesheet frame (no encontrado): ${frameName}`);
      return;
    }
    try {
      const buf = await sharp(framePath)
        .resize(fw, fh, RESIZE_OPTS)
        .png()
        .toBuffer();
      buffers.push(buf);
    } catch (e) {
      console.error(`  ERR frame ${frameName}: ${e.message}`);
      errors++;
      return;
    }
  }

  const totalW = fw * buffers.length;
  try {
    await sharp({
      create: { width: totalW, height: fh, channels: 4, background: { r:0, g:0, b:0, alpha:0 } },
    })
      .composite(buffers.map((input, i) => ({ input, left: i * fw, top: 0 })))
      .png()
      .toFile(outPath(file));
    console.log(`  OK  ${file} (${totalW}×${fh}, ${buffers.length} frames)`);
    ok++;
  } catch (e) {
    console.error(`  ERR spritesheet ${file}: ${e.message}`);
    errors++;
  }
}

async function processWallRotations() {
  const pairs = [
    { src: 'walls/wall-h-hp3.png', dst: 'walls/wall-v-hp3.png' },
    { src: 'walls/wall-h-hp2.png', dst: 'walls/wall-v-hp2.png' },
    { src: 'walls/wall-h-hp1.png', dst: 'walls/wall-v-hp1.png' },
  ];
  for (const { src, dst } of pairs) {
    const srcPath = outPath(src);
    if (!fs.existsSync(srcPath)) {
      console.warn(`  SKIP wall-v (fuente no existe): ${src}`);
      continue;
    }
    try {
      await sharp(srcPath).rotate(90).png().toFile(outPath(dst));
      console.log(`  OK  ${dst} (32×128, rotado 90°)`);
      ok++;
    } catch (e) {
      console.error(`  ERR ${dst}: ${e.message}`);
      errors++;
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== process-asset.js — Arena Siege Tanks ===\n');
  ensureDirs();

  console.log('── Grupos (crop + resize) ──');
  for (const g of GROUPS) await processGroup(g);

  console.log('\n── Rotaciones wall-v ──');
  await processWallRotations();

  console.log('\n── Partículas (trim + resize) ──');
  for (const p of PARTICLES) await processParticle(p);

  console.log('\n── Individuales (resize) ──');
  for (const s of SINGLES) await processSingle(s);

  console.log('\n── Spritesheets VFX ──');
  for (const ss of SPRITESHEETS) await processSpritesheet(ss);

  console.log(`\n=== Resultado: ${ok} OK, ${errors} errores ===`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
