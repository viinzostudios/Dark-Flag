/**
 * Genera el primer lote de 20 avatares gratuitos (avatar-01 a avatar-20).
 * Usa GPT Image (gpt-image-1) con grids de 2×5 en 1024×1024.
 *
 * CROP INTELIGENTE: en lugar de usar cortes fijos de grid, extrae cada celda
 * con un pequeño margen, luego usa Sharp trim() para detectar los bordes reales
 * del elemento, y finalmente lo centra y pad a 128×128 con fondo transparente.
 * Esto maneja imprecisiones del modelo donde los avatares no están perfectamente
 * centrados en su celda.
 *
 * Uso: node scripts/generate-avatars-batch1.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) { console.error('Falta OPENAI_API_KEY'); process.exit(1); }

const REVIEW_DIR = path.join(__dirname, '../docs/08-assets/review/avatars');
const OUT_DIR    = path.join(__dirname, '../frontend/public/assets/avatars');
const OUT_SIZE   = 128;  // tamaño final fijo de cada avatar
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
    prompt: `A 2-column by 5-row grid of 10 cute cartoon sticker avatars on a pure transparent background.
All avatars have thick black outlines (4px), vibrant saturated colors, chunky proportions, cel-shaded style. No text, no borders between cells, no background.
Grid layout (left-to-right, top-to-bottom):
Row 1: [1] happy golden lion face, [2] chubby blue whale
Row 2: [3] cute red fox face, [4] fluffy white rabbit
Row 3: [5] fierce purple dragon baby, [6] happy brown bear face
Row 4: [7] bright green frog, [8] orange cat with sunglasses
Row 5: [9] giant smiling pizza slice, [10] colorful sushi roll
Each avatar fills its cell centered, cartoon illustration style, consistent size.`,
  },
  {
    id: 'batch2',
    slugs: [
      'avatar-11','avatar-12','avatar-13','avatar-14',
      'avatar-15','avatar-16','avatar-17','avatar-18',
      'avatar-19','avatar-20',
    ],
    prompt: `A 2-column by 5-row grid of 10 cute cartoon sticker avatars on a pure transparent background.
All avatars have thick black outlines (4px), vibrant saturated colors, chunky proportions, cel-shaded style. No text, no borders between cells, no background.
Grid layout (left-to-right, top-to-bottom):
Row 1: [1] smiling rainbow donut, [2] cute steaming ramen bowl
Row 2: [3] happy watermelon slice, [4] cute ice cream cone
Row 3: [5] bright yellow lightning bolt symbol, [6] red flaming heart
Row 4: [7] golden star burst, [8] cool blue snowflake
Row 5: [9] green four-leaf clover, [10] purple cosmic diamond gem
Each avatar fills its cell centered, cartoon illustration style, consistent size.`,
  },
];

async function callOpenAI(prompt) {
  const body = JSON.stringify({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'low',
    output_format: 'png',
    background: 'transparent',
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`OpenAI error ${res.statusCode}: ${data}`));
        } else {
          const json = JSON.parse(data);
          resolve(json.data[0].b64_json);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Crop inteligente: extrae una celda del grid con margen, hace trim del contenido
 * real, y lo centra en un canvas de OUT_SIZE×OUT_SIZE con fondo transparente.
 */
async function smartCropCell(pngBuffer, col, row, imgW, imgH) {
  const cellW = Math.floor(imgW / GRID_COLS);
  const cellH = Math.floor(imgH / GRID_ROWS);

  // Extraer la celda completa (sin overlap — la IA ya separa los elementos)
  const left = col * cellW;
  const top  = row * cellH;

  // Extraer celda cruda
  const cellBuf = await sharp(pngBuffer)
    .extract({ left, top, width: cellW, height: cellH })
    .toBuffer();

  // Obtener metadata de la celda para verificar si tiene contenido
  const cellMeta = await sharp(cellBuf).metadata();

  // Trim automático: detecta los bordes del contenido no-transparente
  let trimmedBuf;
  try {
    trimmedBuf = await sharp(cellBuf)
      .trim({ background: { r:0, g:0, b:0, alpha:0 }, threshold: 10 })
      .toBuffer();
  } catch {
    // Si trim falla (imagen completamente transparente), usar la celda completa
    trimmedBuf = cellBuf;
  }

  const trimMeta = await sharp(trimmedBuf).metadata();
  const tw = trimMeta.width  ?? cellW;
  const th = trimMeta.height ?? cellH;

  // Calcular escala para que el contenido quepa en el 85% del tamaño final (con margen)
  const maxContent = Math.floor(OUT_SIZE * 0.85);
  const scale = Math.min(maxContent / tw, maxContent / th, 1);
  const scaledW = Math.round(tw * scale);
  const scaledH = Math.round(th * scale);

  // Centrar en canvas OUT_SIZE × OUT_SIZE
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
  for (const batch of BATCHES) {
    console.log(`\n⟳ Generando ${batch.id} (${batch.slugs.length} avatares)…`);

    const b64 = await callOpenAI(batch.prompt);
    const pngBuffer = Buffer.from(b64, 'base64');

    const draftPath = path.join(REVIEW_DIR, `${batch.id}-draft.png`);
    fs.writeFileSync(draftPath, pngBuffer);
    console.log(`  Draft guardado: ${draftPath}`);

    console.log(`  Recortando con crop inteligente…`);
    await cropGrid(pngBuffer, batch.slugs);
  }

  console.log('\n✅ Listo. Avatares en frontend/public/assets/avatars/');
}

main().catch(err => { console.error(err); process.exit(1); });
