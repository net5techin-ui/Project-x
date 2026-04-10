const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

async function sync() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('🔗 Connected to Supabase...');

  const rawData = fs.readFileSync('products.json', 'utf8');
  const jsonData = JSON.parse(rawData);
  
  // Transform snake_case to camelCase for the database to match UI expectations
  // WAIT: Actually, it's better to keep the columns as snake_case in the DB if that's standard,
  // but let's make sure our UI handles both.
  // BUT the user said "full flow", I'll just make the DB match the UI directly to be safe.
  
  const products = jsonData.products.map(p => {
    return {
      name: p.name,
      brand: p.brand,
      category: p.category.toLowerCase(),
      price: p.price,
      originalPrice: p.original_price, // map snake to camel
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

  console.log(`📦 Found ${products.length} products. Inserting...`);
  
  const { data: inserted, error } = await supabase.from('products').upsert(products).select();
  
  if (error) {
    if (error.code === '42703') {
       console.error('❌ Insert failed: One or more columns do not exist in the database table.');
       console.error('Missing column details:', error.message);
    } else if (error.code === 'PGRST204' || error.code === 'PGRST116') {
       console.error('❌ Insert failed: Table "products" was not found in the schema cache.');
       console.error('💡 TIP: If you just created the table, you might need to wait or check your Supabase Dashbard SQL Editor.');
    } else {
       console.dir(error, { depth: null });
    }
  } else {
    console.log(`✅ Successfully synced ${inserted ? inserted.length : 'unknown number of'} products!`);
    if (inserted && inserted[0]) console.log('Sample:', inserted[0]);
  }
}

sync();
