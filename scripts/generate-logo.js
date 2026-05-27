/**
 * Genera el logo de Arena Siege Tanks:
 *  - logo-icon (1024x1024): ícono para favicon + PWA icons
 *  - logo-og-banner (1536x1024): banner para Open Graph / social sharing
 *
 * Uso (draft):  OPENAI_API_KEY=... node scripts/generate-logo.js
 * Uso (final):  OPENAI_API_KEY=... node scripts/generate-logo.js --final
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) { console.error('Falta OPENAI_API_KEY'); process.exit(1); }

const isFinal = process.argv.includes('--final');
const QUALITY = isFinal ? 'high' : 'low';

const REVIEW_DIR = path.join(__dirname, '../docs/08-assets/review');
const ICONS_DIR  = path.join(__dirname, '../frontend/public/icons');
const ASSETS_DIR = path.join(__dirname, '../frontend/public/assets');
const FAVICON_OUT = path.join(__dirname, '../frontend/public/favicon.png');

const iconPrompt = require('../docs/08-assets/prompts/logo-icon.json');
const ogPrompt   = require('../docs/08-assets/prompts/logo-og-banner.json');

const ICON_SIZES = [512, 384, 192, 152, 144, 128, 96, 72];

async function callOpenAI(prompt, size) {
  const body = JSON.stringify({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size,
    quality: QUALITY,
    output_format: 'png',
    background: 'opaque',
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

async function generateIcon(pngBuffer) {
  console.log('  Generando variantes de tamaño...');
  for (const size of ICON_SIZES) {
    const outPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp(pngBuffer)
      .resize(size, size, { fit: 'cover', kernel: 'lanczos3' })
      .png()
      .toFile(outPath);
    console.log(`  ✓ icon-${size}x${size}.png`);
  }

  // favicon.png 32x32
  await sharp(pngBuffer)
    .resize(32, 32, { fit: 'cover', kernel: 'lanczos3' })
    .png()
    .toFile(FAVICON_OUT);
  console.log('  ✓ favicon.png (32x32)');
}

async function main() {
  console.log(`\n⟳ Modo: ${isFinal ? 'FINAL (quality: high)' : 'BORRADOR (quality: low)'}\n`);

  // --- Logo icon ---
  console.log('⟳ Generando logo icon (1024x1024)...');
  const iconB64 = await callOpenAI(iconPrompt.prompt, '1024x1024');
  const iconBuf = Buffer.from(iconB64, 'base64');

  const iconDraft = path.join(REVIEW_DIR, 'logo-icon-draft.png');
  fs.writeFileSync(iconDraft, iconBuf);
  console.log(`  Draft guardado: ${iconDraft}`);

  if (isFinal) {
    await generateIcon(iconBuf);
    console.log('  ✓ Todos los íconos PWA actualizados');
    console.log('  ✓ favicon.png actualizado');
  }

  // --- OG Banner ---
  console.log('\n⟳ Generando OG banner (1536x1024)...');
  const ogB64 = await callOpenAI(ogPrompt.prompt, '1536x1024');
  const ogBuf = Buffer.from(ogB64, 'base64');

  const ogDraft = path.join(REVIEW_DIR, 'logo-og-banner-draft.png');
  fs.writeFileSync(ogDraft, ogBuf);
  console.log(`  Draft guardado: ${ogDraft}`);

  if (isFinal) {
    const ogOut = path.join(ASSETS_DIR, 'og-banner.png');
    fs.writeFileSync(ogOut, ogBuf);
    console.log(`  ✓ OG banner guardado: ${ogOut}`);
  }

  console.log(`\n✅ ${isFinal ? 'Assets finales listos.' : 'Borradores listos para revisión.'}`);
  if (!isFinal) {
    console.log('   Revisa:');
    console.log(`   - ${iconDraft}`);
    console.log(`   - ${ogDraft}`);
    console.log('   Si apruebas: node scripts/generate-logo.js --final');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
