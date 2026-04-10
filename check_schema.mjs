import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("🔍 Checking orders schema...");
  try {
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    if (error) {
      console.error("❌ Schema Check Failed:", error.message);
    } else {
      if (data && data.length > 0) {
        console.log("✅ Columns found:", Object.keys(data[0]));
        console.log("✅ Sample data:", data[0]);
      } else {
        console.log("Table is empty.");
      }
    }
  } catch (err) {
    console.error("💥 Error during schema check:", err);
  }
}

checkSchema();
