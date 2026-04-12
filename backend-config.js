
// TN28 Global Backend Configuration
const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

// Use window.supabase loaded from CDN in HTML
let supabase;

function getSupabase() {
    if (supabase) return supabase;
    if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        return supabase;
    }
    return null;
}

export { supabase };

// =================== LOGIC HELPERS ===================

function mapProduct(p) {
  if (!p) return null;
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
    // We use a simple select with a limit to avoid timeouts
    const { data, error } = await client
      .from('products')
      .select('id, title, price, description, category, image, stock')
      .order('id', { ascending: false })
      .limit(30);

    if (error) {
        console.error('Supabase Query Error:', error);
        throw error;
    }
    
    if (data) {
      const mapped = data.map(mapProduct);
      const current = localStorage.getItem('tn28_products');
      if (current !== JSON.stringify(mapped)) {
        localStorage.setItem('tn28_products', JSON.stringify(mapped));
        console.log('✅ Local cache updated');
      }
      return mapped;
    }
  } catch (err) {
    console.warn('Cloud fetch failed, falling back to local storage:', err.message);
  }

  const local = localStorage.getItem('tn28_products');
  return local ? JSON.parse(local) : [];
}

export async function saveProduct(product) {
  const client = getSupabase();
  if (!client) throw new Error('Backend unavailable');

  console.log('💾 Saving:', product.name);
  
  // Prepare payload based on current verified columns
  const payload = {
    title: product.name,
    price: Number(product.price),
    description: product.description || '',
    category: product.category || 'casual',
    image: product.image || '',
    stock: Number(product.stock) || 0
  };

  if (product.id) payload.id = Number(product.id);

  const { data, error } = await client
    .from('products')
    .upsert(payload)
    .select();

  if (error) throw error;
  window.dispatchEvent(new Event('storage'));
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
