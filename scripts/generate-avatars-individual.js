/**
 * Genera avatares INDIVIDUALMENTE — 1 imagen por avatar.
 * Sin grid. Crop perfecto: la imagen tiene solo 1 avatar, trim de bordes transparentes,
 * escala a 85% de 128px, centra con padding transparente en 128×128.
 *
 * Uso: node scripts/generate-avatars-individual.js [start] [end]
 *   start: slug número inicio (default 1)
 *   end: slug número fin (default 40)
 *
 * Ejemplo: node scripts/generate-avatars-individual.js 21 40
 */

const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const sharp  = require('sharp');

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) { console.error('Falta OPENAI_API_KEY'); process.exit(1); }

const REVIEW_DIR = path.join(__dirname, '../docs/08-assets/review/avatars/individual');
const OUT_DIR    = path.join(__dirname, '../frontend/public/assets/avatars');
const OUT_SIZE   = 128;

if (!fs.existsSync(REVIEW_DIR)) fs.mkdirSync(REVIEW_DIR, { recursive: true });
if (!fs.existsSync(OUT_DIR))    fs.mkdirSync(OUT_DIR,    { recursive: true });

// ─── Definición de todos los avatares con sus prompts ─────────────────────────

const AVATARS = [
  // ── FREE (01-20) — regenerados individualmente para crop perfecto ──────────
  {
    slug: 'avatar-01',
    prompt: 'A cute cartoon golden lion face sticker with thick black outlines, fluffy mane, fierce but cute expression, big round eyes, vibrant saturated yellow-gold color, cel-shaded style, chunky proportions, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-02',
    prompt: 'A cute cartoon penguin sticker wearing cool blue sunglasses, thick black outlines, white and black feathers, bright orange beak, cel-shaded style, chunky proportions, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-03',
    prompt: 'A cute tiny baby dragon sticker, purple-violet color, big sparkly eyes, small wings, happy friendly expression, thick black outlines, cel-shaded cartoon style, chunky proportions, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-04',
    prompt: 'A cute clever cartoon fox face sticker, bright orange fur with white muzzle, cunning smile, pointy ears, bushy tail tip, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-05',
    prompt: 'A cute tropical cartoon frog face sticker, bright vivid green, big round happy eyes, wide smile, small crown of tropical flowers, thick black outlines, cel-shaded style, chunky proportions, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-06',
    prompt: 'A cute wise cartoon owl sticker wearing round glasses and a small graduation cap, brown feathers, big expressive eyes, warm smile, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-07',
    prompt: 'A fierce cartoon shark face sticker, gray-blue color, sharp triangle teeth showing in a grin, menacing but cartoony eyes, fin visible, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-08',
    prompt: 'A cute cartoon robot cat sticker, metallic silver with cyan neon glowing eyes, cat ears made of metal panels, small antenna, digital expression screen, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-09',
    prompt: 'A magical cute cartoon unicorn head sticker, white fluffy mane in rainbow pastel colors pink blue purple, golden spiral horn, sparkly happy eyes, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-10',
    prompt: 'A cute colorful cartoon octopus sticker with a happy smiling face, multiple bright tentacles in rainbow colors, suction cups visible, big round eyes, thick black outlines, cel-shaded style, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-11',
    prompt: 'A happy cartoon pizza slice sticker, melty cheese dripping, pepperoni, mushrooms, red tomato sauce showing, bright colors, joyful face drawn on the slice, thick black outlines, cel-shaded style, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-12',
    prompt: 'A funny cartoon ice cream cone sticker, triple scoop of pink blue green ice cream, colorful sprinkles, melting sides, cute smiling face, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-13',
    prompt: 'A wild crazy cartoon taco sticker with googly eyes, toppings spilling out dramatically, lettuce tomato cheese, colorful and chaotic, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-14',
    prompt: 'A cheeky cartoon hamburger sticker with melting cheese oozing, sesame bun, colorful layers, winking face, thick black outlines, cel-shaded style, vibrant saturated colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-15',
    prompt: 'A cute chibi cartoon sushi roll sticker with a tiny adorable face, seaweed wrapper, rice visible, salmon on top, pink cheeks, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-16',
    prompt: 'A happy tropical cartoon pineapple sticker wearing cool heart-shaped sunglasses, bright yellow with green crown leaves, smiling face, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-17',
    prompt: 'A fast cartoon rocket sticker with bright orange-red flames shooting from the bottom, shiny metallic body, porthole window, speed lines, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-18',
    prompt: 'A punk cartoon skull sticker with a bright pink mohawk, nose ring, star tattoo, sunglasses, cracked edges, attitude, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-19',
    prompt: 'A shiny golden cartoon crown sticker with colorful gemstones ruby sapphire emerald embedded, glowing sparkles around it, majestic royal design, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-20',
    prompt: 'An epic cartoon warrior shield sticker, round shield with a lightning bolt emblem, battle-worn edges, metallic blue and silver colors, glowing energy effects, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },

  // ── TIER 1 (21-40) — 200 coins — cool and rare themes ────────────────────
  {
    slug: 'avatar-21',
    prompt: 'A cute cartoon panda face wearing a ninja headband with a leaf symbol, black and white fur, intense focused eyes, small shurikens in background, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-22',
    prompt: 'A cool funny cartoon zombie sticker, green decomposed skin, one eye popping out, wide goofy smile, torn hoodie, brain visible through top of skull, but cute and friendly looking, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-23',
    prompt: 'A cute cartoon turtle samurai sticker, green turtle with samurai helmet kabuto with horn ornament, determined expression, tiny katana, shell visible, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-24',
    prompt: 'A cute friendly cartoon UFO flying saucer sticker, shiny metallic silver disc with colorful blinking lights, a tiny cute alien waving from the cockpit window, tractor beam underneath glowing green, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-25',
    prompt: 'A fluffy cute cartoon polar bear face sticker, bright white fur, small round ears, happy smile, wearing a bright blue striped scarf, rosy cheeks, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-26',
    prompt: 'A cool cartoon shark with a punk attitude, gray shark wearing a spiked mohawk on its fin, electric guitar in its jaws, sunglasses, lightning bolt pattern on body, rock star vibe, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-27',
    prompt: 'A funny cute cartoon monkey sticker with a big grin eating a banana, bright brown fur, long tail curling up, cheeky expression, banana peel hat, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-28',
    prompt: 'A cute cartoon elephant head sticker, gray with large floppy ears, big innocent eyes, trunk curled up in a wave, small tusks, colorful flower behind ear, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-29',
    prompt: 'A fierce cartoon crocodile face sticker, bright green scales, enormous toothy grin showing sharp teeth, menacing yellow eyes, but cartoonishly funny, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-30',
    prompt: 'A fast fierce cartoon falcon sticker, golden-brown feathers, intense raptor eyes with speed lines, wings spread in diving attack pose, talons ready, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-31',
    prompt: 'A fancy cartoon donut sticker, pink strawberry glaze, colorful sprinkles rainbow, glazed sheen, happy cute face, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-32',
    prompt: 'A crazy cartoon hot dog sticker with wild eyes, mustard squirt forming a lightning bolt shape, ketchup dripping, hot steam rising, chaotic energy, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-33',
    prompt: 'A glowing neon cartoon jellyfish medusa sticker, translucent pink-purple body with bright neon cyan tentacles flowing, cute little smiley face, bioluminescent glow effects, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-34',
    prompt: 'A cool cartoon avocado sticker wearing heart-shaped golden sunglasses, bright green skin, brown pit in shape of a heart, smiling face, millennial vibe, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-35',
    prompt: 'A giant cheerful cartoon strawberry sticker, bright red with yellow seeds, green leafy crown on top, happy beaming face, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-36',
    prompt: 'A cheerful cartoon watermelon slice sticker, bright red flesh with black seeds, green rind, huge smile, waving tiny arms, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-37',
    prompt: 'A steaming hot cartoon ramen bowl sticker, naruto fish cake slice on top, soft boiled egg, noodles swirling, steam rising dramatically, chopsticks sticking out, cute happy face on the bowl, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-38',
    prompt: 'A cute cartoon cupcake sticker, tall pink swirl frosting, rainbow sprinkles, red cherry on top, heart decoration, adorable smiling face, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-39',
    prompt: 'A cute cartoon astronaut sticker in a white space suit, visor reflecting stars and Earth, thumbs up pose, small rocket pack on back, colorful mission patch on arm, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
  {
    slug: 'avatar-40',
    prompt: 'A bold cartoon pirate sticker with leather eyepatch, tricorn hat with skull, treasure map in one hand, parrot on shoulder, confident grin, gold hoop earring, thick black outlines, cel-shaded style, vibrant colors, centered on pure transparent background, no text, no border, single centered element',
  },
];

// ─── OpenAI image generation ──────────────────────────────────────────────────

async function generateImage(prompt) {
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
          resolve(Buffer.from(json.data[0].b64_json, 'base64'));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Smart crop individual: trim + center en 128×128 ─────────────────────────

async function cropToStandard(pngBuffer) {
  // Trim transparent borders to detect actual content
  let trimmed;
  try {
    trimmed = await sharp(pngBuffer)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 15 })
      .toBuffer();
  } catch {
    trimmed = pngBuffer;
  }

  const { width: tw, height: th } = await sharp(trimmed).metadata();

  // Scale to fit 88% of OUT_SIZE (a bit more than before for less whitespace)
  const maxContent = Math.round(OUT_SIZE * 0.88);
  const scale = Math.min(maxContent / tw, maxContent / th, 1);
  const scaledW = Math.round(tw * scale);
  const scaledH = Math.round(th * scale);

  const padLeft   = Math.floor((OUT_SIZE - scaledW) / 2);
  const padTop    = Math.floor((OUT_SIZE - scaledH) / 2);
  const padRight  = OUT_SIZE - scaledW - padLeft;
  const padBottom = OUT_SIZE - scaledH - padTop;

  return sharp(trimmed)
    .resize(scaledW, scaledH, { fit: 'fill' })
    .extend({ left: padLeft, right: padRight, top: padTop, bottom: padBottom,
              background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const startNum = parseInt(process.argv[2] ?? '1');
  const endNum   = parseInt(process.argv[3] ?? '40');

  const toGenerate = AVATARS.filter(a => {
    const n = parseInt(a.slug.replace('avatar-', ''));
    return n >= startNum && n <= endNum;
  });

  console.log(`\nGenerando ${toGenerate.length} avatares (${toGenerate[0]?.slug} → ${toGenerate[toGenerate.length-1]?.slug})\n`);

  for (const avatar of toGenerate) {
    process.stdout.write(`  ⟳ ${avatar.slug}… `);
    try {
      const pngBuffer = await generateImage(avatar.prompt);

      // Guardar draft
      const draftPath = path.join(REVIEW_DIR, `${avatar.slug}-draft.png`);
      fs.writeFileSync(draftPath, pngBuffer);

      // Crop y guardar final
      const cropped = await cropToStandard(pngBuffer);
      const outPath = path.join(OUT_DIR, `${avatar.slug}.png`);
      await sharp(cropped).toFile(outPath);

      console.log('✓');
    } catch (err) {
      console.log(`✗ ERROR: ${err.message}`);
    }
  }

  console.log('\n✅ Listo. Revisa los drafts en docs/08-assets/review/avatars/individual/');
}

main().catch(err => { console.error(err); process.exit(1); });
