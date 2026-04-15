import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseHealth() {
  console.log('💓 Database Pulse Check Initiated...');
  
  // 1. Check Read Access (Products)
  const { data: products, error: pError } = await supabase.from('products').select('*').limit(1);
  if (pError) {
    console.error('❌ Read Test Failed (Products):', pError.message);
  } else {
    console.log('✅ Read Test (Products): Success');
  }

  // 2. Check Orders Table
  const { data: orders, error: oError } = await supabase.from('orders').select('*').limit(1);
  if (oError) {
     if (oError.code === '42P01') {
        console.warn('⚠️ Order Table Check: "orders" table does not exist yet.');
     } else {
        console.error('❌ Read Test Failed (Orders):', oError.message);
     }
  } else {
    console.log('✅ Read Test (Orders): Success');
  }

  // 3. Check Write Access (Test Entry)
  console.log('📝 Testing Write Access...');
  const testProduct = { name: 'DB Pulse Test', price: 0, category: 'test', stock: 0 };
  const { data: written, error: wError } = await supabase.from('products').insert([testProduct]).select();
  
  if (wError) {
    console.error('❌ Write Test Failed:', wError.message);
  } else {
    console.log('✅ Write Test: Success (Test Product Created)');
    // Cleanup
    const { error: dError } = await supabase.from('products').delete().eq('id', written[0].id);
    if (dError) {
       console.error('❌ Cleanup Failed:', dError.message);
    } else {
       console.log('✅ Database Pulse Check COMPLETED. Everything is working perfectly.');
    }
  }
}

checkDatabaseHealth();
