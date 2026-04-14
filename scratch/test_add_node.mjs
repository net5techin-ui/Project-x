import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAddProduct() {
  const newProduct = {
    name: "Test Add Product " + Date.now(),
    brand: "Test Brand",
    category: "casual",
    price: 999,
    description: "Testing if products persist",
    image: "https://via.placeholder.com/150"
  };

  console.log('Sending product to Supabase...');
  const { data, error } = await supabase
    .from('products')
    .insert([newProduct])
    .select();

  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Successfully inserted:', data[0]);
    
    console.log('Immediately fetching to verify...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('products')
      .select('*')
      .eq('id', data[0].id);
      
    if (verifyError) {
      console.error('Verify Error:', verifyError);
    } else {
      console.log('Verified product in DB:', verifyData[0]);
    }
  }
}

testAddProduct();
