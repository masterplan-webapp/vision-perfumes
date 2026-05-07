import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  console.log('Iniciando navegador...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to a desktop size
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Acessando https://meucatalogo.app/emiratesperfumes...');
  await page.goto('https://meucatalogo.app/emiratesperfumes', { waitUntil: 'networkidle2' });

  // Scroll to the bottom to load all products
  console.log('Rolando a página para carregar todos os produtos...');
  await autoScroll(page);

  // Extract basic product links/details from the main page
  console.log('Extraindo links dos produtos...');
  const productLinks = await page.evaluate(() => {
    // The selector depends on the app's structure, looking for links that wrap product cards
    const links = Array.from(document.querySelectorAll('a[href^="/emiratesperfumes/"]'));
    return links.map(a => a.href);
  });

  // Remove duplicates
  const uniqueLinks = [...new Set(productLinks)];
  console.log(`Encontrados ${uniqueLinks.length} produtos.`);

  const products = [];

  for (let i = 0; i < uniqueLinks.length; i++) {
    const link = uniqueLinks[i];
    console.log(`[${i+1}/${uniqueLinks.length}] Extraindo: ${link}`);
    try {
      const productPage = await browser.newPage();
      await productPage.goto(link, { waitUntil: 'networkidle2' });

      // Extract details
      const productData = await productPage.evaluate(() => {
        // These selectors are generic guesses, might need adjustment
        const nameEl = document.querySelector('h1') || document.querySelector('h2');
        const name = nameEl ? nameEl.innerText.trim() : 'Produto sem nome';

        // Price extraction (looking for elements containing R$)
        const priceEls = Array.from(document.querySelectorAll('*')).filter(el => 
          el.innerText && el.innerText.includes('R$') && el.children.length === 0
        );
        let rawPrice = 0;
        if (priceEls.length > 0) {
          const priceText = priceEls[0].innerText.replace(/[^0-9,]/g, '').replace(',', '.');
          rawPrice = parseFloat(priceText);
        }

        // Description extraction
        // Assuming description might be in a paragraph or div below the name
        const pEls = Array.from(document.querySelectorAll('p'));
        let description = pEls.map(p => p.innerText.trim()).filter(t => t.length > 20).join('\n\n');
        if (!description) {
           description = 'Descrição detalhada não encontrada.';
        }

        // Image extraction
        const imgEls = Array.from(document.querySelectorAll('img')).filter(img => img.src && !img.src.includes('logo') && !img.src.includes('icon'));
        const images = imgEls.map(img => img.src);
        const image = images.length > 0 ? images[0] : '';

        return { name, rawPrice, description, image, images };
      });

      // Calculate new price (+30%)
      const price = productData.rawPrice ? Math.round((productData.rawPrice * 1.30) * 100) / 100 : 0;

      // Construct Vision Perfumes Product object
      const product = {
        id: 'emr_' + Date.now() + '_' + i,
        name: productData.name,
        brand: 'Emirates', // Default brand
        price: price,
        image: productData.image,
        images: productData.images,
        category: 'Unissex', // Default
        description: productData.description,
        rating: 5.0,
        reviews: Math.floor(Math.random() * 50) + 1,
        weight: 0.5,
        dimensions: { width: 10, height: 15, depth: 10 },
      };

      products.push(product);
      await productPage.close();
    } catch (err) {
      console.error(`Erro ao extrair ${link}:`, err.message);
    }
  }

  await browser.close();

  // Save to file
  const outputPath = 'emirates_products.json';
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
  console.log(`\nExtração concluída! Dados salvos em ${outputPath}`);
})();

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}
