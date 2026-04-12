
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("🔍 Inspecting live Supabase schema...");
    const { data, error } = await supabase.from('products').select('*').limit(1);
    
    if (error) {
        console.error("❌ Schema Inspection Failed:", error);
    } else if (data && data.length > 0) {
        console.log("✅ Live columns found:", Object.keys(data[0]));
    } else {
        console.log("ℹ️ Products table is empty, couldn't detect columns via select.");
    }
}

inspectSchema();
