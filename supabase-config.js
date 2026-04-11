import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ============================================
// TN28 Hybrid Backend (MongoDB + Supabase)
// ============================================

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

export const supabase = createClient(supabaseUrl, supabaseKey);
export const isSupabaseEnabled = true;

// =================== PRODUCT METHODS (Hybrid) ===================

export async function fetchProducts() {
  // 1. Try Local MongoDB API (Port 3000)
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Loaded from Local MongoDB');
      return data;
    }
  } catch (err) {
    console.warn('Local API unavailable, falling back to Supabase Cloud.');
  }

  // 2. Fallback to Supabase Cloud
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    console.log('☁️ Loaded from Supabase Cloud');
    return data;
  } catch (err) {
    return JSON.parse(localStorage.getItem('tn28_products') || '[]');
  }
}

export async function saveProduct(product) {
  // 1. Save to Local MongoDB
  try {
    const method = product.id && String(product.id).length > 5 ? 'PUT' : 'POST';
    const url = method === 'PUT' ? `/api/products/${product.id}` : '/api/products';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (res.ok) {
        const saved = await res.json();
        // 2. Sync to Supabase in background
        syncToSupabase(saved);
        return saved;
    }
  } catch (err) {
    console.error('Local Save Failed:', err);
  }

  // Fallback Save to Supabase
  const { data, error } = await supabase.from('products').upsert(product).select();
  return data ? data[0] : product;
}

async function syncToSupabase(product) {
    try {
        await supabase.from('products').upsert(product);
    } catch (e) { /* silent sync fail */ }
}

export async function deleteProduct(product) {
  try {
    await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
    await supabase.from('products').delete().eq('id', product.id);
  } catch (err) {
    console.error('Delete trace:', err);
  }
}

// =================== AUTH METHODS ===================
// Auth stays on Supabase for security
export { onAuthUpdate } from './login.js'; // Assuming you want a shared auth hook

// =================== MEDIA METHODS ===================
export async function uploadImage(file) {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('products').upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
    return publicUrl;
  } catch (err) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }
}

// Hooks
export function onProductsChange(callback) {
  // Listen to both storage events and Supabase changes
  window.addEventListener('storage', () => fetchProducts().then(callback));
  return supabase.channel('products-realtime').on('postgres_changes', { event: '*', table: 'products' }, () => {
    fetchProducts().then(callback);
  }).subscribe();
}
