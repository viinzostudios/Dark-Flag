import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = 'c:/VIINZO/Juego-AI';

const API_KEY = readFileSync('C:/Users/fredy/.claude/openai_key', 'utf8').trim();

async function generateAtlas(jsonPath, outPath) {
  const spec = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const prompt = spec.frames[0].prompt;

  console.log(`\nGenerando: ${spec.name}`);
  console.log(`Size: ${spec.api_size} | Prompt: ${prompt.length} chars`);

  const body = {
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size: spec.api_size,
    quality: 'low',
    output_format: 'png',
    background: 'transparent',
  };

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('API Error:', JSON.stringify(data.error, null, 2));
    process.exit(1);
  }

  const b64 = data.data[0].b64_json;
  const bytes = Buffer.from(b64, 'base64');
  writeFileSync(outPath, bytes);
  console.log(`Guardado: ${outPath} (${Math.round(bytes.length / 1024)} KB)`);
}

const [,, atlas] = process.argv;

if (atlas === 'a') {
  await generateAtlas(
    `${__dir}/docs/08-assets/prompts/spritesheet-atlas-a.json`,
    `${__dir}/docs/08-assets/review/spritesheet-atlas-a-draft.png`
  );
} else if (atlas === 'b') {
  await generateAtlas(
    `${__dir}/docs/08-assets/prompts/spritesheet-atlas-b.json`,
    `${__dir}/docs/08-assets/review/spritesheet-atlas-b-draft.png`
  );
} else {
  console.error('Uso: node generate-atlas.mjs [a|b]');
  process.exit(1);
}
