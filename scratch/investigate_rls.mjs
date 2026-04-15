
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    console.log("🕵️ Investigating Supabase Security (RLS)...");
    
    // Try to read common sensitive info to see if we have high privs
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
        console.warn("⚠️ Cannot list buckets (Typical for Anon Key)");
    }

    // Try to insert and then update
    const { data: insData, error: insError } = await supabase.from('products').insert([{ name: 'RLS Test' }]).select();
    
    if (insError) {
        console.error("❌ RLS Blocked INSERT:", insError.message);
    } else {
        console.log("✅ INSERT Allowed.");
        const { error: upError } = await supabase.from('products').update({ name: 'RLS Updated' }).eq('id', insData[0].id);
        if (upError) console.error("❌ RLS Blocked UPDATE:", upError.message);
        else console.log("✅ UPDATE Allowed.");
        
        await supabase.from('products').delete().eq('id', insData[0].id);
    }
}

checkRLS();
