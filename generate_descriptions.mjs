import fs from 'fs';

const INPUT = 'vision_catalog.json';
const OUTPUT = 'vision_catalog_with_desc.json';
const CHECKPOINT = '.descriptions_cache.json';
const CONCURRENCY = 6;
const MODEL = 'gemini-2.5-flash';

const env = fs.readFileSync('.env.local', 'utf8');
const apiKey = (env.match(/VITE_API_KEY=(.+)/) || [])[1]?.trim();
if (!apiKey) throw new Error('VITE_API_KEY ausente em .env.local');

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

const products = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
const cache = fs.existsSync(CHECKPOINT)
  ? JSON.parse(fs.readFileSync(CHECKPOINT, 'utf8'))
  : {};

const buildPrompt = (p) => `Você é redator de uma loja de perfumes árabes premium chamada Vision Perfumes.
Escreva a descrição do produto abaixo em português brasileiro.

Produto: ${p.name}
Gênero: ${p.gender || p.category || 'Unissex'}

Formato OBRIGATÓRIO da resposta (sem títulos, sem markdown, sem aspas):

[Parágrafo de marketing com 2 a 3 frases vendendo a fragrância — sensorial, elegante, evocativo. Sem clichês como "uma explosão de" ou "irresistível".]

Notas de Topo: [3 a 5 notas separadas por vírgula]
Notas de Coração: [3 a 5 notas separadas por vírgula]
Notas de Fundo: [3 a 5 notas separadas por vírgula]
Família Olfativa: [ex: Amadeirado Especiado, Floral Frutal, Oriental Âmbar]
Ocasião: [ex: Noite, Dia a dia, Eventos formais]
Fixação: [Curta / Média / Longa / Muito longa]
Projeção: [Discreta / Moderada / Forte / Muito forte]

Se você não conhecer este perfume específico com certeza, INFIRA notas plausíveis a partir do nome e da marca, mas mantenha o formato. Não escreva "não conheço" nem invente avisos.`;

async function callGemini(prompt) {
  const ctrl = AbortSignal.timeout(45000);
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, thinkingConfig: { thinkingBudget: 0 } },
    }),
    signal: ctrl,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('resposta vazia: ' + JSON.stringify(json).slice(0, 200));
  return text;
}

async function generateWithRetry(product, attempt = 0) {
  try {
    const text = await callGemini(buildPrompt(product));
    cache[product.id] = text;
    return text;
  } catch (err) {
    if (attempt >= 3) {
      console.error(`✗ ${product.name}: ${err.message}`);
      return '';
    }
    await new Promise(r => setTimeout(r, 1500 * Math.pow(2, attempt)));
    return generateWithRetry(product, attempt + 1);
  }
}

const total = products.length;
let done = Object.keys(cache).length;
console.log(`Total: ${total}. Já em cache: ${done}.`);

let cursor = 0;
let saveCounter = 0;

async function worker() {
  while (cursor < products.length) {
    const idx = cursor++;
    const p = products[idx];
    if (cache[p.id]) continue;
    await generateWithRetry(p);
    done++;
    if (++saveCounter % 20 === 0) fs.writeFileSync(CHECKPOINT, JSON.stringify(cache));
    if (done % 10 === 0 || done === total) console.log(`  ${done}/${total}`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
fs.writeFileSync(CHECKPOINT, JSON.stringify(cache));

const enriched = products.map(p => ({ ...p, description: cache[p.id] || '' }));
fs.writeFileSync(OUTPUT, JSON.stringify(enriched, null, 2));

const missing = enriched.filter(p => !p.description).length;
console.log(`\n✅ Salvo em ${OUTPUT}`);
console.log(`Com descrição: ${enriched.length - missing}/${enriched.length}`);
if (missing) console.log(`Sem descrição (rode novamente para reprocessar): ${missing}`);
