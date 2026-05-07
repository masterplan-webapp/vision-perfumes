import fs from 'fs';

const ENDPOINT = 'https://graph.meucatalogo.app';
const STORE = 'emiratesperfumes';
const PAGE = 100;

const QUERY = `query($storeId:String!,$orderBy:String!,$skip:Int,$first:Int){
  productList(publicStoreId:$storeId,orderBy:$orderBy,skip:$skip,first:$first){
    total
    products { 
      id 
      title 
      description 
      price 
      oldPrice 
      available 
      quantity 
      gallery { 
        images { url } 
      } 
    }
  }
}`;

const all = [];
let total = Infinity;
for (let skip = 0; skip < total; skip += PAGE) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: QUERY,
      variables: { storeId: STORE, orderBy: 'title_ASC', skip, first: PAGE },
    }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  total = json.data.productList.total;
  all.push(...json.data.productList.products);
  console.log(`fetched ${all.length}/${total}`);
}

const rows = all.map(p => {
  const basePrice = p.oldPrice || p.price || 0;
  
  // Acrescentar 30%
  const visionPrice = Math.ceil(basePrice * 1.30); 
  
  // Categoria e Gênero inferidos pelo título
  let title = p.title || '';
  let gender = '';
  if (title.toLowerCase().includes('(fem)')) {
    gender = 'Feminino';
    title = title.replace(/\(fem\)/ig, '').trim();
  } else if (title.toLowerCase().includes('(masc)')) {
    gender = 'Masculino';
    title = title.replace(/\(masc\)/ig, '').trim();
  } else if (title.toLowerCase().includes('(unissex)')) {
    gender = 'Unissex';
    title = title.replace(/\(unissex\)/ig, '').trim();
  }

  return {
    id: p.id,
    name: title,
    description: p.description || '',
    category: gender || 'Perfumes',
    price: visionPrice,
    oldPrice: visionPrice, 
    stock: p.quantity || 0,
    available: p.available,
    imageUrl: (p.gallery && p.gallery.images && p.gallery.images.length > 0) ? p.gallery.images[0].url : '',
    gender: gender
  };
});

fs.writeFileSync('vision_catalog.json', JSON.stringify(rows, null, 2));

const missingImages = rows.filter(r => !r.imageUrl).length;
const missingDescriptions = rows.filter(r => !r.description).length;

console.log(`\n✅ Extração e Processamento concluídos!`);
console.log(`Total de produtos processados: ${rows.length}`);
console.log(`Produtos SEM imagem: ${missingImages}`);
console.log(`Produtos SEM descrição: ${missingDescriptions}`);
console.log(`Catálogo final salvo em: vision_catalog.json`);
