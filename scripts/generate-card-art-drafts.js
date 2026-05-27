// Genera borradores de ilustraciones para las feature cards del landing + ícono claqueta
// Uso: node generate-card-art-drafts.js <api_key>
const fs   = require('fs');
const https = require('https');
const path  = require('path');

const apiKey = process.argv[2];
if (!apiKey) { console.error('Falta API key'); process.exit(1); }

const IMAGES = [
  {
    id: 'card-skins',
    prompt: `Promotional feature card illustration for a cartoon browser tank game. Shows 4 colorful cartoon tanks arranged in a dynamic diagonal showcase, each with a distinct epic skin: one deep red-orange with fire and lava crack decals, one vivid cyan-blue crystalline with aurora glow effects, one dark purple-black with void particle swirls, one silver chrome with neon cyan trim and metallic sheen. Cartoon cel-shaded style, bold black outlines 4-5px thick, highly saturated vibrant colors, chunky proportions. Slight 3/4 elevated view for dramatic effect. Sparkle and star accent effects between tanks. Dark transparent background — each tank stands isolated with a soft drop shadow beneath it. No text, no UI elements. Art quality similar to Brawl Stars or Clash Royale character reveal art.`
  },
  {
    id: 'card-bullets',
    prompt: `Promotional feature card illustration for a cartoon browser tank game, showcasing the tactical bullet bounce mechanic. A cartoon bullet projectile shown bouncing multiple times off two chunky gray cartoon wall blocks. The bullet leaves a glowing energy trail that changes color with each bounce: first segment bright white-yellow with intense glow, second segment golden-yellow energy, third segment orange, final segment red with heat distortion. The trajectory forms a satisfying Z or W shaped path. The bullet itself is an oval projectile with a bright white core and colored glow. Walls are chunky solid blocks with bold black cartoon outlines and a crack detail. Dynamic action lines emphasize speed. Cel-shaded cartoon style, bold outlines, neon energy effects, dramatic dark transparent background. No text.`
  },
  {
    id: 'card-pickups',
    prompt: `Promotional feature card illustration for a cartoon browser tank game, showcasing power-up items. Shows 3 floating cartoon power-up collectibles arranged in a dynamic triangular cluster with magical energy: a glowing golden ammo crate with a bullet icon and yellow sparkle rays, a chunky stone wall block pickup with green glowing runes, a blue energy shield orb with concentric ring pulses and white sparkles. Each item floats with a swirling magical aura in its color. Star and sparkle accent particles scattered around. Cartoon cel-shaded style, bold black outlines 4px, highly saturated vibrant colors — gold, green, blue. The items look enticing and powerful. Transparent dark background with subtle soft light beams. No text. Art quality similar to Clash Royale chest reveal art.`
  },
  {
    id: 'card-arena',
    prompt: `Promotional feature card illustration for a cartoon browser tank game, showcasing online multiplayer combat. Top-down bird's eye view showing 5 cartoon tanks in intense battle on a dark charcoal arena floor with subtle grid lines. Tanks in distinct bright colors: orange player tank, cyan player tank, purple player tank, red player tank, and yellow player tank. Multiple white-yellow cartoon bullet projectiles crisscrossing between tanks. Two small cartoon explosion bursts — star-shaped orange-yellow blasts. Each tank has a bold black cartoon outline, cel-shaded coloring, chunky proportions, visible top-surface with cannon detail. Dynamic composition with tanks spread across the frame. Vibrant saturated colors, high contrast. No text. Style similar to Brawl Stars top-down brawl promotional art.`
  },
  {
    id: 'icon-claqueta',
    prompt: `A single cartoon-style film clapperboard icon (movie slate / claqueta de cine) for use as a game UI icon. Clean bold design with thick black outlines 5px. The clapperboard body is bright white or cream with black diagonal stripe pattern on the hinged clapper arm at the top. The main board area is clean and bright. Vivid cel-shaded cartoon style — polished and glossy. Very simple iconic composition, immediately recognizable as a clapperboard at sizes as small as 32x32px. Slight 3/4 angle perspective for depth. No text on the board. Bright transparent background. The icon has strong contrast and cartoon polish similar to iOS emoji or Clash Royale UI icon quality.`
  }
];

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', '08-assets', 'review');

function callOpenAI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'low',
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
      timeout: 120000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          const b64 = parsed.data[0].b64_json;
          if (!b64) return reject(new Error('No b64_json in response: ' + data.slice(0, 200)));
          resolve(b64);
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(body);
    req.end();
  });
}

async function main() {
  for (const img of IMAGES) {
    console.log(`\n[${img.id}] Generando...`);
    try {
      const b64 = await callOpenAI(img.prompt);
      const outPath = path.join(OUTPUT_DIR, `${img.id}-draft.png`);
      fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
      console.log(`[${img.id}] Guardado: ${outPath}`);
    } catch (e) {
      console.error(`[${img.id}] ERROR:`, e.message);
    }
  }
  console.log('\nDone.');
}

main();
