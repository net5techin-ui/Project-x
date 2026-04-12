
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addProduct() {
  console.log('Adding TN28 Luxury Silk Shirt...');
  const product = {
    title: 'TN28 Luxury Silk Shirt',
    price: 3499,
    description: 'A masterpiece of elegance, crafted from the finest silk for premier occasions.',
    category: 'party',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80',
    stock: 25
  };

  try {
    const { data, error } = await supabase
      .from('products')
      .upsert(product)
      .select();

    if (error) {
       console.error('❌ Error adding product:', error);
    } else {
      console.log('✅ Success! Product added:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

addProduct();
