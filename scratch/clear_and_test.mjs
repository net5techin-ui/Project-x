import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAndAddTest() {
    console.log('🗑️ Clearing all products from Supabase...');
    
    // 1. Delete all products
    const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .neq('id', 0); // Delete all where ID is not 0
        
    if (deleteError) {
        console.error('❌ Failed to clear products:', deleteError.message);
        return;
    }
    console.log('✅ All existing products removed.');

    // 2. Add high-quality test product
    console.log('🧪 Adding official test product...');
    const testProduct = {
        name: 'TN28 Signature Executive Shirt',
        price: 2499,
        originalPrice: 3999,
        brand: 'TN28 Premium',
        category: 'formal',
        description: 'Elite quality oxford cotton shirt designed for professional excellence. Features premium stitching and a contemporary slim fit.',
        stock: 100,
        fabric: 'Egyptian Giza Cotton',
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['#FFFFFF', '#F0F0F0'],
        isNew: true,
        isHot: true
    };

    const { data, error: insertError } = await supabase
        .from('products')
        .insert([testProduct])
        .select();

    if (insertError) {
        console.error('❌ Test insertion failed:', insertError.message);
    } else {
        console.log('✅ Test product added successfully:', data[0].title);
        console.log('🌐 Verification: Check https://www.tn28apparels.com');
    }
}

clearAndAddTest();
