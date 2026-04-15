import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('🔍 Checking Supabase Cloud Products...');
  
  const { data, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error('❌ Supabase Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log(`✅ Success! Found ${data.length} products in the cloud.`);
    data.forEach((p, i) => {
      console.log(`   [${i+1}] Name: ${p.name || p.title}, Price: ${p.price}`);
    });
  } else {
    console.log('⚠️ Supabase table "products" is EMPTY.');
  }
}

check();
