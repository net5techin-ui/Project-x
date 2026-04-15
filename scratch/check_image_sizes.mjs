import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSizes() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, image');
  
  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total Products:', data.length);
  let totalSize = 0;
  data.forEach(p => {
    const size = p.image ? p.image.length : 0;
    totalSize += size;
    if (size > 1000) {
       console.log(`Product ID ${p.id} (${p.name}): Image size ${size} chars. Starts with: ${p.image.substring(0, 30)}...`);
    }
  });
  console.log('Total Image Data Size (approx chars):', totalSize);
  console.log('Approximate bytes:', totalSize * 2); // UTF-16
}

checkSizes();
