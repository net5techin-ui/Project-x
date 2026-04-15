
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
    console.log("🚀 Starting Node Sync...");
    
    const rawData = fs.readFileSync('products.json', 'utf8');
    const jsonData = JSON.parse(rawData);
    
    const products = jsonData.products.map(p => ({
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
        isHot: p.is_hot || false
    }));

    console.log(`📦 Syncing ${products.length} products...`);
    
    const { data, error } = await supabase
        .from('products')
        .upsert(products)
        .select();

    if (error) {
        console.error("❌ Sync Error:", error);
    } else {
        console.log(`✅ Success! ${data.length} products synced to Cloud.`);
    }
}

sync();
