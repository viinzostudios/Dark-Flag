// Genera versiones finales (quality: high) de las card arts y las redimensiona con Sharp
// Uso: node generate-card-art-final.js <api_key>
const fs    = require('fs');
const https = require('https');
const path  = require('path');
const sharp = require('sharp');

const apiKey = process.argv[2];
if (!apiKey) { console.error('Falta API key'); process.exit(1); }

const IMAGES = [
  {
    id: 'card-skins',
    size: 256,
    prompt: `Promotional feature card illustration for a cartoon browser tank game. Shows 4 colorful cartoon tanks arranged in a dynamic diagonal showcase, each with a distinct epic skin: one deep red-orange with fire and lava crack decals, one vivid cyan-blue crystalline with aurora glow effects, one dark purple-black with void particle swirls, one silver chrome with neon cyan trim and metallic sheen. Cartoon cel-shaded style, bold black outlines 4-5px thick, highly saturated vibrant colors, chunky proportions. Slight 3/4 elevated view for dramatic effect. Sparkle and star accent effects between tanks. Dark transparent background — each tank stands isolated with a soft drop shadow beneath it. No text, no UI elements. Art quality similar to Brawl Stars or Clash Royale character reveal art.`
  },
  {
    id: 'card-bullets',
    size: 256,
    prompt: `Promotional feature card illustration for a cartoon browser tank game, showcasing the tactical bullet bounce mechanic. A cartoon bullet projectile shown bouncing multiple times off two chunky gray cartoon wall blocks. The bullet leaves a glowing energy trail that changes color with each bounce: first segment bright white-yellow with intense glow, second segment golden-yellow energy, third segment orange, final segment red with heat distortion. The trajectory forms a satisfying Z or W shaped path. The bullet itself is an oval projectile with a bright white core and colored glow. Walls are chunky solid blocks with bold black cartoon outlines and a crack detail. Dynamic action lines emphasize speed. Cel-shaded cartoon style, bold outlines, neon energy effects, dramatic dark transparent background. No text.`
  },
  {
    id: 'card-pickups',
    size: 256,
    prompt: `Promotional feature card illustration for a cartoon browser tank game, showcasing power-up items. Shows 3 floating cartoon power-up collectibles arranged in a dynamic triangular cluster with magical energy: a glowing golden ammo crate with a bullet icon and yellow sparkle rays, a chunky stone wall block pickup with green glowing runes, a blue energy shield orb with concentric ring pulses and white sparkles. Each item floats with a swirling magical aura in its color. Star and sparkle accent particles scattered around. Cartoon cel-shaded style, bold black outlines 4px, highly saturated vibrant colors — gold, green, blue. The items look enticing and powerful. Transparent dark background with subtle soft light beams. No text. Art quality similar to Clash Royale chest reveal art.`
  },
  {
    id: 'card-arena',
    size: 256,
    prompt: `Promotional feature card illustration for a cartoon browser tank game, showcasing online multiplayer combat. Top-down bird eye view of 5 colorful cartoon tanks in battle, all fully visible and well-centered within the frame with generous padding on all sides — no element touches or bleeds off any edge. The tanks are arranged in a loose circular formation around the center of the image, with plenty of empty space between them and the borders. Tanks in distinct bright cartoon colors: orange, cyan, purple, red, yellow — each with bold black outlines cel-shaded style chunky proportions visible top-surface cannon detail. A few white-yellow bullet projectiles cross between tanks. Two small star-burst cartoon explosion effects near the center. Dark charcoal arena floor tile with subtle grid lines fills the background. All elements float comfortably inside the composition with clear breathing room. Vibrant saturated colors high contrast cartoon cel-shaded art style similar to Brawl Stars. No text.`
  },
  {
    id: 'icon-claqueta',
    size: 48,
    prompt: `A single cartoon-style film clapperboard icon (movie slate / claqueta de cine) for use as a game UI icon. Clean bold design with thick black outlines 5px. The clapperboard body is bright white or cream with black diagonal stripe pattern on the hinged clapper arm at the top. The main board area is clean and bright. Vivid cel-shaded cartoon style — polished and glossy. Very simple iconic composition, immediately recognizable as a clapperboard at sizes as small as 32x32px. Slight 3/4 angle perspective for depth. No text on the board. Bright transparent background. The icon has strong contrast and cartoon polish similar to iOS emoji or Clash Royale UI icon quality.`
  }
];

const REVIEW_DIR = path.join(__dirname, '..', 'docs', '08-assets', 'review');
const OUTPUT_DIR = path.join(__dirname, '..', 'frontend', 'public', 'assets', 'ui');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function callOpenAI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
      background: 'transparent',
      output_format: 'png'
    });
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 180000
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          const b64 = parsed.data[0].b64_json;
          if (!b64) return reject(new Error('No b64_json: ' + data.slice(0, 200)));
          resolve(b64);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

async function main() {
  for (const img of IMAGES) {
    console.log(`\n[${img.id}] Generando quality:high...`);
    try {
      const b64 = await callOpenAI(img.prompt);
      const rawBuf = Buffer.from(b64, 'base64');

      // Guardar original en review como referencia
      fs.writeFileSync(path.join(REVIEW_DIR, `${img.id}-final-raw.png`), rawBuf);

      // Resize con Sharp y guardar en assets/ui
      const outPath = path.join(OUTPUT_DIR, `${img.id}.png`);
      await sharp(rawBuf)
        .resize(img.size, img.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toFile(outPath);

      console.log(`[${img.id}] → ${outPath} (${img.size}x${img.size})`);
    } catch (e) {
      console.error(`[${img.id}] ERROR:`, e.message);
    }
  }
  console.log('\nDone.');
}

main();
