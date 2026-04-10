/**
 * TN28 Unified Backend API Config
 * Handles all communication with the MongoDB Express Server on port 3000
 */

// Basic State
export const isBackendConnected = true;

// =================== PRODUCT METHODS ===================

export async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend not reachable, falling back to LocalStorage.');
  }
  const local = localStorage.getItem('tn28_products');
  return local ? JSON.parse(local) : [];
}

export async function saveProduct(product) {
  try {
    // Determine method: if it has an ID and it's not a fresh timestamp, it's likely an update
    const isUpdate = product.id && (String(product.id).length > 6); 
    const method = isUpdate ? 'PUT' : 'POST';
    const url = isUpdate ? `/api/products/${product.id}` : '/api/products';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('API Save Error:', err);
  }

  // Local Fallback
  let products = JSON.parse(localStorage.getItem('tn28_products') || '[]');
  const idx = products.findIndex(p => String(p.id) === String(product.id));
  if (idx > -1) products[idx] = product;
  else {
    if (!product.id) product.id = Date.now().toString();
    products.push(product);
  }
  localStorage.setItem('tn28_products', JSON.stringify(products));
  return product;
}

export async function deleteProduct(product) {
  try {
    const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
    if (res.ok) console.log('Deleted from MongoDB');
  } catch (err) {
    console.error('API Delete Error:', err);
  }

  let products = JSON.parse(localStorage.getItem('tn28_products') || '[]');
  products = products.filter(p => String(p.id) !== String(product.id));
  localStorage.setItem('tn28_products', JSON.stringify(products));
  window.dispatchEvent(new Event('storage'));
}

// =================== MEDIA METHODS ===================

export async function uploadImage(file) {
  // Simple Base64 conversion for this version
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

// =================== ORDER METHODS ===================

export async function placeOrder(order) {
  // Since we only have product API for now, orders stay in localStorage or 
  // you can extend backend to handle orders too.
  const orderData = {
    ...order,
    orderId: 'TN28-' + Date.now().toString(36).toUpperCase(),
    timestamp: new Date().toISOString()
  };
  let orders = JSON.parse(localStorage.getItem('tn28_orders') || '[]');
  orders.push(orderData);
  localStorage.setItem('tn28_orders', JSON.stringify(orders));
  return orderData;
}

export async function fetchOrders() {
  const local = localStorage.getItem('tn28_orders');
  return local ? JSON.parse(local) : [];
}

export async function updateOrderStatus(order, status) {
  let orders = JSON.parse(localStorage.getItem('tn28_orders') || '[]');
  orders = orders.map(o => o.orderId === order.orderId ? { ...o, status } : o);
  localStorage.setItem('tn28_orders', JSON.stringify(orders));
}

export async function deleteOrder(order) {
  let orders = JSON.parse(localStorage.getItem('tn28_orders') || '[]');
  orders = orders.filter(o => o.orderId !== order.orderId);
  localStorage.setItem('tn28_orders', JSON.stringify(orders));
}

// Hooks for real-time (simulation)
export function onProductsChange(callback) {
  window.addEventListener('storage', () => fetchProducts().then(callback));
}

export function onOrdersChange(callback) {}
