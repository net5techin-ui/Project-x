const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

// Initialize from window.supabase (loaded via CDN script in HTML)
let supabase;
if (typeof window !== 'undefined' && window.supabase) {
  supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('Supabase global not found, backend will be unavailable.');
}

export { supabase };
export const isBackendConnected = !!supabase;

// =================== LOGIC HELPERS ===================

/**
 * Maps database fields (like 'title') to frontend fields (like 'name')
 * and ensures all required properties exist.
 */
function mapProduct(p) {
  if (!p) return null;
  // Normalize fields from various possible DB schemas
  const name = p.name || p.title || p.product_name || 'Premium Item';
  const price = Number(p.price || p.current_price || p.sale_price) || 0;
  const originalPrice = Number(p.originalPrice || p.original_price || p.mrp) || null;
  const image = p.image || p.image_url || p.img || 'https://via.placeholder.com/300x400?text=No+Image';
  const brand = p.brand || p.brand_name || 'TN28';
  
  return {
    ...p,
    id: p.id,
    fbId: p.fbId || p.id, // Support legacy IDs
    name,
    brand,
    category: p.category || 'casual',
    price,
    originalPrice,
    image,
    sizes: p.sizes || ['M', 'L', 'XL'],
    colors: p.colors || ['#000000'],
    stock: p.stock || 0,
    rating: p.rating || 4.5,
    reviews: p.reviews || 0,
    isNew: !!(p.isNew || p.is_new),
    isSale: !!(p.isSale || p.is_sale),
    isHot: !!(p.isHot || p.is_hot),
    description: p.description || p.desc || ''
  };
}

// =================== PRODUCT METHODS ===================

export async function fetchProducts() {
  console.log('☁️ Fetching products from Supabase...');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    if (data && data.length > 0) {
      const mapped = data.map(mapProduct);
      localStorage.setItem('tn28_products', JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.error('Supabase Fetch Error:', err);
  }

  // Local Fallback
  const local = localStorage.getItem('tn28_products');
  return local ? JSON.parse(local) : [];
}

export async function saveProduct(product) {
  console.log('💾 Saving product to Supabase:', product.name);
  try {
    // PREPARE PAYLOAD: Only include columns that actually exist in the DB
    // to avoid "column does not exist" errors.
    const dbPayload = {
      name: product.name || 'New Product',
      brand: product.brand || 'TN28',
      price: Number(product.price) || 0,
      originalPrice: Number(product.originalPrice) || null,
      description: product.description || '',
      category: product.category || 'casual',
      image: product.image || '',
      stock: Number(product.stock) || 0,
      isNew: !!product.isNew,
      isSale: !!product.isSale,
      isHot: !!product.isHot,
      fabric: product.fabric || 'Premium Cotton',
      sizes: product.sizes || ['M', 'L', 'XL'],
      colors: product.colors || ['#000000']
    };

    // Include ID only if it exists (for updates)
    if (product.id) dbPayload.id = product.id;

    const { data, error } = await supabase
      .from('products')
      .upsert(dbPayload)
      .select();

    if (error) throw error;
    
    const saved = mapProduct(data[0]);
    // Trigger local update
    window.dispatchEvent(new Event('storage'));
    return saved;
  } catch (err) {
    console.error('Supabase Save Error (Cleaned Payload):', err);
    throw err;
  }
}

export async function deleteProduct(product) {
  console.log('🗑️ Deleting product:', product.id);
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) throw error;
    
    // Trigger local update
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Supabase Delete Error:', err);
    throw err;
  }
}

// =================== MEDIA METHODS ===================

export async function uploadImage(file) {
  try {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data, error } = await supabase.storage
      .from('products')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.error('Storage Upload Error:', err);
    // Fallback to local Base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }
}

// =================== ORDER METHODS ===================

export async function placeOrder(order) {
  console.log('📦 Placing order in Supabase...');
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        order_id: order.orderId,
        customer: order.customer,
        address: order.address,
        items: order.items,
        total: order.total,
        grand_total: order.grandTotal,
        status: 'pending'
      }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (err) {
    console.error('Order Placement Error:', err);
    // Fallback to local
    let orders = JSON.parse(localStorage.getItem('tn28_orders') || '[]');
    orders.push(order);
    localStorage.setItem('tn28_orders', JSON.stringify(orders));
    return order;
  }
}

export async function fetchOrders() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (err) {
    const local = localStorage.getItem('tn28_orders');
    return local ? JSON.parse(local) : [];
  }
}

export async function updateOrderStatus(order, status) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('order_id', order.order_id || order.orderId);
    
    if (error) throw error;
  } catch (err) {
    console.error('Status Update Error:', err);
  }
}

export async function deleteOrder(order) {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('order_id', order.order_id || order.orderId);
    
    if (error) throw error;
  } catch (err) {
    console.error('Order Delete Error:', err);
  }
}

// Real-time listener
export function onProductsChange(callback) {
  window.addEventListener('storage', () => fetchProducts().then(callback));
  
  // Realtime subscription
  return supabase
    .channel('public:products')
    .on('postgres_changes', { event: '*', table: 'products' }, (payload) => {
      console.log('Change received!', payload);
      fetchProducts().then(callback);
    })
    .subscribe();
}
