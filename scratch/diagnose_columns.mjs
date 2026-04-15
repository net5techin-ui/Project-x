
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectColumns() {
    console.log("🔍 Checking table columns...");
    
    // Try to insert a full product to see if any column fails
    const testProduct = {
      name: "Test Full Product",
      brand: "Test Brand",
      category: "casual",
      price: 100,
      originalPrice: 200,
      stock: 10,
      image: "test.jpg",
      description: "Test desc",
      sizes: ["M"],
      colors: ["Red"],
      fabric: "Cotton",
      isNew: true,
      isSale: false,
      isHot: false
    };

    const { data, error } = await supabase.from('products').insert([testProduct]).select();

    if (error) {
        console.error("❌ Error adding full product:", error.message, error.details, error.hint);
    } else {
        console.log("✅ Success! All columns are valid.");
        const { error: delError } = await supabase.from('products').delete().eq('id', data[0].id);
    }
}

inspectColumns();
