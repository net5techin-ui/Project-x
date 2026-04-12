
// TN28 Global Backend Configuration
const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

// Use window.supabase loaded from CDN in HTML
let supabase;

function getSupabase() {
    if (supabase) return supabase;
    // Support both Browser (window) and Node.js environment
    if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        // For node scripts (using the @supabase/supabase-js package)
        try {
            const { createClient } = require('@supabase/supabase-js');
            supabase = createClient(supabaseUrl, supabaseKey);
        } catch (e) {
            // If require fails (e.g. in ESM or browser)
            console.warn('Supabase client initialization deferred');
        }
    }
    return supabase;
}

export { supabase };

// =================== LOGIC HELPERS ===================

function mapProduct(p) {
  if (!p) return null;
  // Map 'title' from DB to 'name' for UI
  return {
    ...p,
    id: p.id,
    name: p.name || p.title || 'Premium Item',
    brand: p.brand || 'TN28',
    category: p.category || 'casual',
    price: Number(p.price) || 0,
    originalPrice: Number(p.originalPrice || p.original_price) || null,
    image: p.image || 'https://via.placeholder.com/300x400?text=No+Image',
    stock: p.stock || 0,
    isNew: !!p.isNew,
    isSale: !!p.isSale,
    isHot: !!p.isHot,
    description: p.description || ''
  };
}

// =================== PRODUCT METHODS ===================

export async function fetchProducts() {
  console.log('☁️ Attempting cloud fetch...');
  const client = getSupabase();
  if (!client) {
      console.warn('Supabase client not ready. Using local cache.');
      return JSON.parse(localStorage.getItem('tn28_products') || '[]');
  }

  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('id', { ascending: false })
      .limit(100);

    if (error) throw error;
    
    if (data) {
      const mapped = data.map(mapProduct);
      if (typeof localStorage !== 'undefined') {
          localStorage.setItem('tn28_products', JSON.stringify(mapped));
      }
      return mapped;
    }
  } catch (err) {
    console.warn('Cloud fetch failed:', err.message);
  }

  if (typeof localStorage !== 'undefined') {
      const local = localStorage.getItem('tn28_products');
      return local ? JSON.parse(local) : [];
  }
  return [];
}

export async function saveProduct(product) {
  const client = getSupabase();
  if (!client) throw new Error('Backend unavailable');

  console.log('💾 Saving:', product.name);
  
  // Align payload with verified Supabase columns
  const payload = {
    name: product.name || product.title,
    price: Number(product.price),
    description: product.description || '',
    category: product.category || 'casual',
    image: product.image || '',
    stock: Number(product.stock) || 0
  };

  // Only add columns if they are not undefined (to avoid schema errors if missing)
  if (product.brand) payload.brand = product.brand;
  if (product.originalPrice) payload.originalPrice = Number(product.originalPrice);
  if (product.fabric) payload.fabric = product.fabric;
  if (product.sizes) payload.sizes = product.sizes;
  if (product.colors) payload.colors = product.colors;
  if (product.isNew !== undefined) payload.isNew = !!product.isNew;
  if (product.isSale !== undefined) payload.isSale = !!product.isSale;
  if (product.isHot !== undefined) payload.isHot = !!product.isHot;

  if (product.id) payload.id = Number(product.id);

  const { data, error } = await client
    .from('products')
    .upsert(payload)
    .select();

  if (error) {
      console.error('Supabase Save Error:', error);
      throw error;
  }
  
  if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
  }
  return mapProduct(data[0]);
}

export async function deleteProduct(product) {
  const client = getSupabase();
  if (!client) return;

  const { error } = await client
    .from('products')
    .delete()
    .eq('id', product.id);

  if (error) throw error;
  window.dispatchEvent(new Event('storage'));
}

// =================== ORDER METHODS ===================

export async function fetchOrders() {
  const client = getSupabase();
  if (!client) return JSON.parse(localStorage.getItem('tn28_orders') || '[]');

  try {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Order fetch error:', err);
    return JSON.parse(localStorage.getItem('tn28_orders') || '[]');
  }
}

export async function placeOrder(order) {
  const client = getSupabase();
  if (!client) throw new Error('Backend offline');

  const { data, error } = await client
    .from('orders')
    .insert([{
      order_id: order.orderId,
      customer: order.customer,
      address: order.address,
      items: order.items,
      total: order.total,
      grandTotal: order.grandTotal,
      status: 'pending'
    }])
    .select();

  if (error) throw error;
  return data[0];
}

export async function updateOrderStatus(order, status) {
  const client = getSupabase();
  if (!client) return;
  const idValue = order.order_id || order.orderId || order.id;
  const { error } = await client
    .from('orders')
    .update({ status })
    .match({ order_id: idValue });
  if (error) throw error;
}

export async function deleteOrder(order) {
  const client = getSupabase();
  if (!client) return;
  const idValue = order.order_id || order.orderId || order.id;
  const { error } = await client
    .from('orders')
    .delete()
    .match({ order_id: idValue });
  if (error) throw error;
}

// =================== REALTIME ===================

export async function uploadImage(file) {
  const client = getSupabase();
  if (!client) return base64Fallback(file);

  try {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data, error } = await client.storage.from('products').upload(fileName, file);
    if (error) throw error;
    
    const { data: { publicUrl } } = client.storage.from('products').getPublicUrl(fileName);
    return publicUrl;
  } catch (err) {
    console.error('Upload error:', err);
    return base64Fallback(file);
  }
}

function base64Fallback(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

export function onProductsChange(callback) {
  const client = getSupabase();
  if (!client) return { unsubscribe: () => {} };

  return client
    .channel('public:products')
    .on('postgres_changes', { event: '*', table: 'products' }, () => {
      fetchProducts().then(callback);
    })
    .subscribe();
}
