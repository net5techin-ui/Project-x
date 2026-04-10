import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBucket() {
  console.log("🛠️ Attempting to create 'products' bucket via API...");
  try {
    const { data, error } = await supabase.storage.createBucket('products', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });
    
    if (error) {
       console.error("❌ Error creating bucket:", error.message);
       if (error.message.includes("Permission denied") || error.message.includes("403")) {
          console.log("💡 The Anon Key doesn't have permission to create buckets. This MUST be done in the Supabase Dashboard (Storage tab) or using SQL.");
       }
    } else {
       console.log("✅ Successfully created 'products' bucket!");
       console.log("Data:", data);
    }
  } catch (err) {
    console.error("💥 Unexpected error:", err);
  }
}

fixBucket();
