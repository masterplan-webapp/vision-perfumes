import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const apiKey = env.match(/VITE_API_KEY=(.+)/)[1].trim();
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const products = JSON.parse(fs.readFileSync('/tmp/sample_products.json', 'utf8'));

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

for (const p of products) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(p) }] }],
      generationConfig: { temperature: 0.7, thinkingConfig: { thinkingBudget: 0 } },
    }),
    signal: AbortSignal.timeout(45000),
  });
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '(sem texto)';
  console.log('========', p.name, '========');
  console.log(text);
  console.log();
}
