
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    console.log("📦 Checking Storage Buckets...");
    
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error("❌ Error listing buckets:", error.message);
        return;
    }

    const productsBucket = buckets.find(b => b.name === 'products');
    if (productsBucket) {
        console.log("✅ Bucket 'products' exists.");
        console.log("   Public:", productsBucket.public);
    } else {
        console.log("❌ Bucket 'products' DOES NOT EXIST.");
        console.log("   Creating bucket 'products'...");
        const { data, error: createError } = await supabase.storage.createBucket('products', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
            fileSizeLimit: 10485760 // 10MB
        });
        if (createError) console.error("   ❌ Failed to create bucket:", createError.message);
        else console.log("   ✅ Bucket created successfully.");
    }
}

checkStorage();
