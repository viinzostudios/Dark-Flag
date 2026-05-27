/**
 * Recorta los drafts existentes con crop inteligente (sin llamar a OpenAI).
 * Lee batch1-draft.png y batch2-draft.png desde docs/08-assets/review/avatars/
 * y genera los PNGs individuales en frontend/public/assets/avatars/
 */

const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const REVIEW_DIR = path.join(__dirname, '../docs/08-assets/review/avatars');
const OUT_DIR    = path.join(__dirname, '../frontend/public/assets/avatars');
const OUT_SIZE   = 128;
const GRID_COLS  = 2;
const GRID_ROWS  = 5;

const BATCHES = [
  {
    id: 'batch1',
    slugs: [
      'avatar-01','avatar-02','avatar-03','avatar-04',
      'avatar-05','avatar-06','avatar-07','avatar-08',
      'avatar-09','avatar-10',
    ],
  },
  {
    id: 'batch2',
    slugs: [
      'avatar-11','avatar-12','avatar-13','avatar-14',
      'avatar-15','avatar-16','avatar-17','avatar-18',
      'avatar-19','avatar-20',
    ],
  },
];

async function smartCropCell(pngBuffer, col, row, imgW, imgH) {
  const cellW = Math.floor(imgW / GRID_COLS);
  const cellH = Math.floor(imgH / GRID_ROWS);

  const left = col * cellW;
  const top  = row * cellH;

  const cellBuf = await sharp(pngBuffer)
    .extract({ left, top, width: cellW, height: cellH })
    .toBuffer();

  let trimmedBuf;
  try {
    trimmedBuf = await sharp(cellBuf)
      .trim({ background: { r:0, g:0, b:0, alpha:0 }, threshold: 10 })
      .toBuffer();
  } catch {
    trimmedBuf = cellBuf;
  }

  const trimMeta = await sharp(trimmedBuf).metadata();
  const tw = trimMeta.width  ?? cellW;
  const th = trimMeta.height ?? cellH;

  const maxContent = Math.floor(OUT_SIZE * 0.85);
  const scale = Math.min(maxContent / tw, maxContent / th, 1);
  const scaledW = Math.round(tw * scale);
  const scaledH = Math.round(th * scale);

  const padLeft = Math.floor((OUT_SIZE - scaledW) / 2);
  const padTop  = Math.floor((OUT_SIZE - scaledH) / 2);

  return sharp(trimmedBuf)
    .resize(scaledW, scaledH, { fit: 'fill' })
    .extend({
      left: padLeft,
      right: OUT_SIZE - scaledW - padLeft,
      top: padTop,
      bottom: OUT_SIZE - scaledH - padTop,
      background: { r:0, g:0, b:0, alpha:0 },
    })
    .png()
    .toBuffer();
}

async function cropGrid(pngBuffer, slugs) {
  const meta = await sharp(pngBuffer).metadata();
  const imgW = meta.width;
  const imgH = meta.height;

  for (let i = 0; i < slugs.length; i++) {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const avatarBuf = await smartCropCell(pngBuffer, col, row, imgW, imgH);
    const outPath = path.join(OUT_DIR, `${slugs[i]}.png`);
    await sharp(avatarBuf).toFile(outPath);
    console.log(`  ✓ ${slugs[i]}.png`);
  }
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const batch of BATCHES) {
    const draftPath = path.join(REVIEW_DIR, `${batch.id}-draft.png`);
    if (!fs.existsSync(draftPath)) {
      console.warn(`  ⚠ No existe ${draftPath} — saltando`);
      continue;
    }
    console.log(`\n⟳ Recortando ${batch.id}…`);
    const pngBuffer = fs.readFileSync(draftPath);
    await cropGrid(pngBuffer, batch.slugs);
  }

  console.log('\n✅ Re-crop completo.');
}

main().catch(err => { console.error(err); process.exit(1); });
