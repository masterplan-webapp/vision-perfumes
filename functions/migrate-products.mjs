import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(__dirname, '..', 'vision_catalog_with_desc.json');
const COLLECTION = 'products';
const BATCH_SIZE = 500;

const DEFAULT_DIMS = { width: 10, height: 15, depth: 10 };
const DEFAULT_WEIGHT = 0.5;

const MULTI_WORD_BRANDS = [
  'Maison Alhambra',
  'Al Haramain',
  'Al Wataniah',
  'Ard Al Zaafaran',
  'French Avenue',
  'Le Chameau',
  'Paris Corner',
  'Oleo Concentrado',
];

function extractBrand(name) {
  const lower = name.toLowerCase();
  for (const b of MULTI_WORD_BRANDS) {
    if (lower.startsWith(b.toLowerCase())) return b;
  }
  const tokens = name.trim().split(/\s+/);
  if (tokens[0] === 'z' && tokens[1] === 'Body' && tokens[2] === 'Splash') {
    return 'Ameerati';
  }
  if (tokens[0] === 'Kit' && tokens[1]) {
    return tokens[1];
  }
  if (tokens[0] === 'AL') return 'Al Haramain';
  if (tokens[0] === 'Frenche') return 'French Avenue';
  return tokens[0];
}

function toCategory(gender) {
  if (gender === 'Masculino' || gender === 'Feminino' || gender === 'Unissex') return gender;
  return 'Unissex';
}

function mapProduct(p) {
  return {
    id: p.id,
    name: p.name,
    brand: extractBrand(p.name),
    price: p.price,
    image: p.imageUrl,
    category: toCategory(p.gender),
    description: p.description || '',
    rating: 4.5,
    reviews: 0,
    weight: DEFAULT_WEIGHT,
    dimensions: DEFAULT_DIMS,
  };
}

async function deleteAll(db) {
  const col = db.collection(COLLECTION);
  let deleted = 0;
  while (true) {
    const snap = await col.limit(BATCH_SIZE).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.size;
    log(`  deleted ${deleted}`);
    if (snap.size < BATCH_SIZE) break;
  }
  return deleted;
}

async function uploadAll(db, products) {
  const col = db.collection(COLLECTION);
  let written = 0;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const slice = products.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const p of slice) {
      const { id, ...data } = p;
      batch.set(col.doc(id), data);
    }
    await batch.commit();
    written += slice.length;
    log(`  uploaded ${written}/${products.length}`);
  }
  return written;
}

const LOG_FILE = '/tmp/migrate-products.log';
fs.writeFileSync(LOG_FILE, '');
function log(msg) {
  const line = msg + '\n';
  fs.appendFileSync(LOG_FILE, line);
  process.stdout.write(line);
}

async function main() {
  log('Starting migration...');
  initializeApp({
    credential: applicationDefault(),
    projectId: 'vision-perfumes',
  });
  log('Firebase Admin initialized.');
  const db = getFirestore();

  const raw = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  log(`Source: ${raw.length} products from ${path.basename(SOURCE)}`);

  const mapped = raw.map(mapProduct);
  const brandCounts = mapped.reduce((acc, p) => {
    acc[p.brand] = (acc[p.brand] || 0) + 1;
    return acc;
  }, {});
  log('Brand distribution:');
  Object.entries(brandCounts).sort((a, b) => b[1] - a[1]).forEach(([b, c]) => {
    log(`  ${String(c).padStart(4)}  ${b}`);
  });

  log('\n[1/2] Deleting existing products...');
  const deleted = await deleteAll(db);
  log(`Deleted ${deleted} docs.`);

  log('\n[2/2] Uploading new catalog...');
  const written = await uploadAll(db, mapped);
  log(`Uploaded ${written} docs.`);

  const finalSnap = await db.collection(COLLECTION).count().get();
  log(`\nFinal count in Firestore: ${finalSnap.data().count}`);
}

main().then(() => {
  log('DONE');
  process.exit(0);
}).catch(err => {
  log('FAILED: ' + (err && err.stack ? err.stack : String(err)));
  process.exit(1);
});
