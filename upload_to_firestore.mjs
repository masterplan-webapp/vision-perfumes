import admin from 'firebase-admin';
import fs from 'fs';

const PROJECT_ID = 'vision-perfumes';
const COLLECTION = 'products';
const INPUT = 'vision_catalog_with_desc.json';
const DRY_RUN = process.argv.includes('--dry-run');

admin.initializeApp({
  projectId: PROJECT_ID,
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

const KNOWN_BRANDS = [
  'Maison Alhambra', 'Maison Asrar', 'Maison Mariam',
  'Al Haramain', 'Al Wataniah', 'Al Rehab', 'Al Ansari',
  'French Avenue', 'Aurora Scents', 'Ard Al Zaafaran', 'Ard Al Khaleej',
  'Paris Corner', 'Arabian Oud',
  'Lattafa', 'Afnan', 'Armaf', 'Asdaaf', 'Arqus', 'Hawas', 'Rayhaan',
  'Emper', 'Khadlaj', 'Nabeel', 'Swiss Arabian', 'Rasasi', 'Ajmal',
  'Fragrance World', 'Estiara', 'Riffs', 'Riiffs', 'Orientica',
  'Emirates', 'Khalis',
];

const detectGender = (name) => {
  const n = name.toLowerCase();
  if (/\(fem|pour femme|for women?\b|\bfemme\b|feminin[oa]/i.test(n)) return 'Feminino';
  if (/\(masc|pour homme|for men\b|\bhomme\b|masculin[oa]/i.test(n)) return 'Masculino';
  if (/\(uniss?ex|uniss?ex/i.test(n)) return 'Unissex';
  return null;
};

const detectBrand = (name) => {
  for (const b of KNOWN_BRANDS) {
    if (name.toLowerCase().includes(b.toLowerCase())) return b;
  }
  return null;
};

const cleanName = (name) =>
  name
    .replace(/^z\s+/i, '')
    .replace(/\bDecant\s+/i, '')
    .replace(/\([^)]*\)|\(fem\b|\(masc\b|\(uniss?ex\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const stripSize = (s) => s.replace(/\b\d+\s*ml\b/gi, '').replace(/\s+/g, ' ').trim();
const keyOfName = (s) => stripSize(cleanName(s)).toLowerCase();

const raw = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

// Pass 1: build keyword→brand map from non-decant products
const brandByKeyword = new Map();
for (const p of raw) {
  if (/^z\s+decant/i.test(p.name)) continue;
  const brand = detectBrand(p.name);
  if (!brand) continue;
  const key = keyOfName(p.name);
  if (!brandByKeyword.has(key)) brandByKeyword.set(key, brand);
}

const inferDecantBrand = (name) => {
  const key = keyOfName(name);
  if (brandByKeyword.has(key)) return brandByKeyword.get(key);
  for (const [k, b] of brandByKeyword) {
    if (k.length > 5 && (key.includes(k) || k.includes(key))) return b;
  }
  return null;
};

const products = raw.map(p => {
  const isDecant = /^z\s+decant/i.test(p.name);
  const name = cleanName(p.name) + (isDecant ? ' (Decant 5ml)' : '');

  let category = p.gender && ['Feminino', 'Masculino', 'Unissex'].includes(p.gender) ? p.gender : null;
  if (!category) category = detectGender(p.name);
  if (!category && isDecant) {
    const refKey = keyOfName(p.name);
    const refProduct = raw.find(r => !/^z\s+decant/i.test(r.name) && keyOfName(r.name) === refKey);
    if (refProduct?.gender) category = refProduct.gender;
    else if (refProduct) category = detectGender(refProduct.name);
  }
  if (!category) category = 'Unissex';

  let brand = detectBrand(p.name);
  if (!brand && isDecant) brand = inferDecantBrand(p.name);
  if (!brand) brand = cleanName(p.name).split(/\s+/)[0];

  return {
    id: p.id,
    data: {
      name,
      brand,
      price: p.price,
      oldPrice: p.oldPrice && p.oldPrice !== p.price ? p.oldPrice : undefined,
      image: p.imageUrl || '',
      category,
      description: p.description,
      rating: 5.0,
      reviews: 12,
      weight: 0.5,
      dimensions: { width: 10, height: 15, depth: 10 },
    },
  };
});

console.log(`Produtos prontos: ${products.length}`);
console.log(`Distribuição categoria:`, products.reduce((a, p) => ({ ...a, [p.data.category]: (a[p.data.category] || 0) + 1 }), {}));
console.log(`Top 10 marcas:`, Object.entries(products.reduce((a, p) => ({ ...a, [p.data.brand]: (a[p.data.brand] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 10));

if (DRY_RUN) {
  console.log('\n=== DRY RUN — amostra dos 3 primeiros ===');
  for (const p of products.slice(0, 3)) {
    console.log(JSON.stringify(p, null, 2));
  }
  process.exit(0);
}

console.log(`\nApagando coleção '${COLLECTION}'...`);
const snap = await db.collection(COLLECTION).get();
console.log(`  ${snap.size} documentos encontrados`);
let deleted = 0;
const chunks = [];
for (let i = 0; i < snap.docs.length; i += 500) chunks.push(snap.docs.slice(i, i + 500));
for (const chunk of chunks) {
  const batch = db.batch();
  chunk.forEach(d => batch.delete(d.ref));
  await batch.commit();
  deleted += chunk.length;
  console.log(`  apagados ${deleted}/${snap.size}`);
}

console.log(`\nSubindo ${products.length} produtos em batches de 500...`);
let written = 0;
const writeChunks = [];
for (let i = 0; i < products.length; i += 500) writeChunks.push(products.slice(i, i + 500));
for (const chunk of writeChunks) {
  const batch = db.batch();
  for (const p of chunk) {
    const ref = db.collection(COLLECTION).doc(p.id);
    const cleanData = Object.fromEntries(Object.entries(p.data).filter(([, v]) => v !== undefined));
    batch.set(ref, cleanData);
  }
  await batch.commit();
  written += chunk.length;
  console.log(`  ${written}/${products.length}`);
}

const final = await db.collection(COLLECTION).count().get();
console.log(`\n✅ Coleção '${COLLECTION}' agora tem ${final.data().count} documentos.`);
process.exit(0);
