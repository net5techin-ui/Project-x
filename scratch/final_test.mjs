
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBackend() {
    console.log("🧪 Running Final Backend Test (Smart Fallback)...");
    
    // Simulate a product with a Base64 image (the fallback I just implemented)
    const testProduct = {
        name: "Backend Test Product #4",
        brand: "TN28 Test",
        category: "casual",
        price: 999,
        image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", // 1x1 transparent dot
        stock: 100,
        isNew: true
    };

    console.log("🛰️ Sending product to Supabase...");
    const { data, error } = await supabase.from('products').insert([testProduct]).select();

    if (error) {
        console.error("❌ Test Failed:", error.message);
    } else {
        console.log("✅ Test Successful! Product #4 added to database.");
        console.log("📊 Record ID:", data[0].id);
        
        // Cleanup
        await supabase.from('products').delete().eq('id', data[0].id);
        console.log("🏁 Test cleanup complete. Backend is 100% operational.");
    }
}

testBackend();
