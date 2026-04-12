
import { supabase } from '../backend-config.js';

async function testAddProduct() {
  console.log('Testing product addition...');
  const testProduct = {
    title: 'Test Premium Shirt',
    price: 1599,
    description: 'A test product added via script',
    category: 'formal',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=80',
    stock: 10
  };

  try {
    const { data, error } = await supabase
      .from('products')
      .upsert(testProduct)
      .select();

    if (error) {
      console.error('❌ Error adding product:', error);
      if (error.message.includes('column "title" does not exist')) {
          console.log('Trying with "name" column instead...');
          delete testProduct.title;
          testProduct.name = 'Test Premium Shirt';
          const { data: d2, error: e2 } = await supabase.from('products').upsert(testProduct).select();
          if (e2) console.error('❌ Still failed:', e2);
          else console.log('✅ Success with "name" column:', d2);
      }
    } else {
      console.log('✅ Success with "title" column:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testAddProduct();
