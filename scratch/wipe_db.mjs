
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeAndRebuild() {
    console.log("🧹 Wiping all products from Cloud Database...");
    
    // Delete all products
    const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .neq('id', 0); // Delete everything where id is not 0 (everything)

    if (deleteError) {
        console.error("❌ Error wiping database:", deleteError);
        return;
    }

    console.log("✅ Database wiped clean.");
}

wipeAndRebuild();
