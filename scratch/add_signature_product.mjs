
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addSignatureProduct() {
  console.log('Adding TN28 Signature Denim Jacket...');
  const product = {
    title: 'TN28 Signature Denim Jacket',
    price: 4999,
    description: 'Rugged luxury meet modern fit. Crafted from heavy-duty raw denim with reinforced stitching.',
    category: 'casual',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
    stock: 15
  };

  try {
    const { data, error } = await supabase
      .from('products')
      .upsert(product)
      .select();

    if (error) {
       console.error('❌ Error:', error);
    } else {
      console.log('✅ Success! Product added to cloud:', data[0].title);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

addSignatureProduct();
