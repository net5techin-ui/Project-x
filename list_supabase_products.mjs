import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listProducts() {
  console.log("📑 Listing products in Supabase...");
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error("❌ Error fetching products:", error.message);
    } else {
      console.log(`✅ Found ${data.length} products.`);
      if (data.length > 0) {
        console.log("COLUMNS:", Object.keys(data[0]).join(', '));
        console.log("VALUES:", JSON.stringify(data[0]));
      }
    }
  } catch (err) {
    console.error("💥 Unexpected error:", err);
  }
}

listProducts();
