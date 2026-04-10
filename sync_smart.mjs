import * as backend from './supabase-config.js';
import fs from 'fs';

async function sync() {
  const rawData = fs.readFileSync('products.json', 'utf8');
  const jsonData = JSON.parse(rawData);
  const products = jsonData.products.map(p => ({
    name: p.name, title: p.name, brand: p.brand, category: p.category.toLowerCase(), price: p.price, originalPrice: p.original_price, stock: p.stock, fabric: p.fabric, image: p.image, sizes: p.sizes, colors: p.colors, description: p.description, isNew: p.is_new || false, isSale: p.is_sale || false, isHot: p.is_hot || false, rating: p.rating || 4.5, reviews: p.reviews || 0
  }));

  let log = "";
  for (const p of products) {
    try {
      await backend.saveProduct(p);
      log += `✅ Inserted: ${p.name}\n`;
    } catch (err) {
      log += `❌ Failed: ${p.name}\n`;
      log += JSON.stringify(err, null, 2) + "\n\n";
    }
  }
  fs.writeFileSync('sync_log.txt', log, 'utf8');
  console.log("Logged to sync_log.txt");
}
sync();
