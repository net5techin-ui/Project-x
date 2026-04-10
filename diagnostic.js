const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('🔍 Checking Supabase Tables...');

  const tables = ['products', 'orders', 'profiles'];
  
  for (const table of tables) {
    console.log(`\n--- Testing [${table}] ---`);
    const { data, error, status } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      console.error(`❌ Table [${table}] failed:`, error.message);
      console.log(`   Code: ${error.code}, Status: ${status}`);
    } else {
      console.log(`✅ Table [${table}] exists! Rows: ${data.length}`);
    }
  }

  console.log('\n--- Testing Insert into [products] ---');
  const { error: insError } = await supabase.from('products').insert([{ name: 'Check Test' }]);
  if (insError) {
    console.error('❌ Insert failed:', insError.message);
    console.log('   Code:', insError.code);
  } else {
    console.log('✅ Insert successful!');
  }
}

check();
