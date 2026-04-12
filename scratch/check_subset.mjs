
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDataSizes() {
  console.log('Checking subset of fields...');
  const { data, error } = await supabase.from('products').select('id, title, price').limit(50);
  if (error) {
    console.error('Subset Error:', error);
  } else {
    console.log('Successfully fetched 50 items with subset fields.');
    console.log('Sample item:', data[0]);
  }
}

checkDataSizes();
