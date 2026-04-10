import * as backend from './supabase-config.js';
import fs from 'fs';

async function sync() {
  console.log('🔗 Connecting to backend to sync products...');

  const rawData = fs.readFileSync('products.json', 'utf8');
  const jsonData = JSON.parse(rawData);
  
  const products = jsonData.products.map(p => {
    return {
      name: p.name,
      brand: p.brand,
      category: p.category.toLowerCase(),
      price: p.price,
      originalPrice: p.original_price,
      stock: p.stock,
      fabric: p.fabric,
      image: p.image,
      sizes: p.sizes,
      colors: p.colors,
      description: p.description,
      isNew: p.is_new || false,
      isSale: p.is_sale || false,
      isHot: p.is_hot || false,
      rating: p.rating || 4.5,
      reviews: p.reviews || 0
    };
  });

  console.log(`📦 Found ${products.length} products. Inserting one-by-one to handle missing columns...`);
  
  let successCount = 0;
  for (const p of products) {
    try {
      await backend.saveProduct(p);
      successCount++;
    } catch (err) {
      console.error(`Failed to insert product: ${p.name}`, err);
    }
  }

  console.log(`✅ Successfully synced ${successCount} out of ${products.length} products!`);
}

sync();
