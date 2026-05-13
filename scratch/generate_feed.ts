
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

async function generateFeed() {
  const productsCol = collection(db, 'products');
  const snapshot = await getDocs(productsCol);
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  let xml = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Vision Perfumes</title>
    <link>https://visionperfumes.com.br</link>
    <description>Perfumes Importados de Luxo</description>`;

  products.forEach((p: any) => {
    const price = p.price.toFixed(2);
    const oldPrice = p.oldPrice ? p.oldPrice.toFixed(2) : null;
    
    xml += `
    <item>
      <g:id>${p.id}</g:id>
      <g:title>${p.brand} ${p.name}</g:title>
      <g:description>${p.description || `Perfume ${p.name} da marca ${p.brand}. Fragrância exclusiva e sofisticada.`}</g:description>
      <g:link>https://visionperfumes.com.br/?product=${p.id}</g:link>
      <g:image_link>${p.image}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${price} BRL</g:price>
      ${oldPrice ? `<g:sale_price>${price} BRL</g:sale_price><g:price>${oldPrice} BRL</g:price>` : `<g:price>${price} BRL</g:price>`}
      <g:brand>${p.brand}</g:brand>
      <g:google_product_category>Health &amp; Beauty &gt; Personal Care &gt; Cosmetics &gt; Perfume &amp; Cologne</g:google_product_category>
      <g:product_type>Perfumes &gt; ${p.category}</g:product_type>
    </item>`;
  });

  xml += `
  </channel>
</rss>`;

  const publicPath = path.join(process.cwd(), 'public', 'google-feed.xml');
  fs.writeFileSync(publicPath, xml);
  console.log('Feed generated at:', publicPath);
}

generateFeed();
