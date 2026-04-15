
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addProduct() {
    console.log("🚀 Adding E2E Test Product...");
    const product = {
        name: 'E2E Final Test Shirt',
        price: 799,
        originalPrice: 1299,
        description: 'Automated test product for final verification.',
        category: 'casual',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
        stock: 100,
        brand: 'TN28',
        sizes: ['M', 'L'],
        isNew: true
    };

    const { data, error } = await supabase.from('products').insert([product]).select();
    
    if (error) {
        console.error("❌ Error adding product:", error.message);
    } else {
        console.log("✅ Product added successfully:", data[0].id);
    }
}

addProduct();
