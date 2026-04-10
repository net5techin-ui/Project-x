import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  console.log("🔍 Checking Supabase Buckets...");
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error("❌ Error listing buckets:", error.message);
    } else {
      console.log("✅ Available Buckets:", data.map(b => b.name).join(', ') || 'None');
      const productsBucket = data.find(b => b.name === 'products');
      if (productsBucket) {
        console.log("📦 'products' bucket found!");
        console.log("🔒 Public:", productsBucket.public);
      } else {
        console.log("❌ 'products' bucket NOT found.");
      }
    }
  } catch (err) {
    console.error("💥 Unexpected error:", err);
  }
}

checkBuckets();
