
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("🔍 Checking products in database...");
    const { data, count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact' });

    if (error) {
        console.error("❌ Error fetching:", error);
        return;
    }

    console.log(`✅ Found ${data.length} products (Count: ${count})`);
    data.forEach((p, i) => {
        console.log(`${i+1}. ID: ${p.id}, Name: ${p.name || p.title}`);
    });

    console.log("\n🧪 Attempting to add a 4th product manually...");
    const testProduct = {
        name: "Test 4th Product",
        brand: "TN28 Test",
        category: "casual",
        price: 999,
        stock: 10,
        description: "Testing product addition"
    };

    const { data: inserted, error: insertError } = await supabase
        .from('products')
        .insert([testProduct])
        .select();

    if (insertError) {
        console.error("❌ Error adding 4th product:", insertError);
    } else {
        console.log("✅ Success! 4th product added:", inserted[0].name);
        
        // Clean up
        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', inserted[0].id);
        
        if (deleteError) console.error("❌ Error cleaning up:", deleteError);
        else console.log("🧹 Cleaned up test product.");
    }
}

check();
