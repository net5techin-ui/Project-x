// TN28 Admin Panel Logic — Unified Backend Architecture
import * as backend from './firebase-config.js';

let products = [];
let mediaLibrary = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadAndRender();
  initTabs();
  initImageUpload();
  initMediaUpload();
  document.getElementById('productForm').addEventListener('submit', handleSaveProduct);
  
  // Set up event delegation for product actions
  document.getElementById('productsTable').addEventListener('click', handleTableClick);
  
  // Load orders data
  await loadOrders();
});

async function handleTableClick(e) {
  const btn = e.target.closest('button');
  if (!btn) return;
  
  const id = btn.dataset.id;
  if (!id) return;
  
  if (btn.classList.contains('btn-edit')) {
    window.editProduct(id);
  } else if (btn.classList.contains('btn-delete')) {
    window.deleteProduct(id);
  }
}

// =================== DATA ===================
async function loadAndRender() {
  showAdminToast('Loading products...', 'info');
  products = await backend.fetchProducts();
  mediaLibrary = JSON.parse(localStorage.getItem('tn28_media') || '[]');
  
  // Ensure storefront knows we have initialized the database
  if (!backend.isFirebaseEnabled) {
    localStorage.setItem('tn28_initialized', 'true');
  }
  
  renderDashboard();
  renderProductsTable();
  renderBrands();
  renderMediaGrid();
}

function saveLocalMedia() {
  localStorage.setItem('tn28_media', JSON.stringify(mediaLibrary));
}

// =================== TABS ===================
function initTabs() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(item.dataset.tab);
    });
  });
}

function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNavItem = document.querySelector(`.nav-item[data-tab="${tab}"]`);
  if (activeNavItem) activeNavItem.classList.add('active');

  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const activeTabContent = document.getElementById(`tab-${tab}`);
  if (activeTabContent) activeTabContent.classList.add('active');

  const titles = { 
    dashboard: 'Dashboard Overview', 
    products: 'Inventory Management', 
    'add-product': 'Product Editor', 
    media: 'Digital Assets Library', 
    orders: 'Customer Orders', 
    brands: 'Brand Identity' 
  };
  document.getElementById('pageTitle').textContent = titles[tab] || tab;
  if (tab === 'media') renderMediaGrid();
}
window.switchTab = switchTab;

// =================== IMAGE UPLOAD (Amazon Style) ===================
function initImageUpload() {
  const dropzone = document.getElementById('uploadDropzone');
  const fileInput = document.getElementById('imageFileInput');
  const btnBrowse = document.getElementById('btnBrowse');
  const btnLoadUrl = document.getElementById('btnLoadUrl');
  const removeBtn = document.getElementById('removeImage');

  dropzone.addEventListener('click', (e) => {
    if (!e.target.closest('.preview-remove')) fileInput.click();
  });

  btnBrowse.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleProductImageUpload(e.target.files[0]);
  });

  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleProductImageUpload(e.dataTransfer.files[0]);
  });

  btnLoadUrl.addEventListener('click', () => {
    const url = document.getElementById('pImageUrl').value.trim();
    if (url) {
      setImagePreview(url, 'Linked External Asset');
      document.getElementById('pImage').value = url;
    }
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearImagePreview();
  });
}

async function handleProductImageUpload(file) {
  if (!file.type.startsWith('image/')) return;
  showAdminToast('Uploading asset to cloud...', 'info');
  
  try {
    const url = await backend.uploadImage(file);
    setImagePreview(url, `${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    document.getElementById('pImage').value = url;
    
    // Add to local media library history
    mediaLibrary.unshift({ id: Date.now(), name: file.name, data: url, date: new Date().toISOString() });
    saveLocalMedia();
    showAdminToast('Asset synchronized with backend!', 'success');
  } catch (err) {
    showAdminToast('Asset upload failed: ' + err.message, 'error');
  }
}

function setImagePreview(src, info) {
  document.getElementById('uploadPlaceholder').style.display = 'none';
  document.getElementById('uploadPreview').style.display = 'block';
  document.getElementById('previewImg').src = src;
  document.getElementById('previewInfo').textContent = info || '';
}

function clearImagePreview() {
  document.getElementById('uploadPlaceholder').style.display = '';
  document.getElementById('uploadPreview').style.display = 'none';
  document.getElementById('previewImg').src = '';
  document.getElementById('previewInfo').textContent = '';
  document.getElementById('pImage').value = '';
  document.getElementById('pImageUrl').value = '';
  document.getElementById('imageFileInput').value = '';
}

// =================== MEDIA LIBRARY ===================
function initMediaUpload() {
  const mediaInput = document.getElementById('mediaUploadInput');
  const btnMedia = document.getElementById('btnUploadMedia');
  
  if (btnMedia) btnMedia.addEventListener('click', () => mediaInput.click());
  if (mediaInput) mediaInput.addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      try {
        const url = await backend.uploadImage(file);
        mediaLibrary.unshift({ id: Date.now() + Math.random(), name: file.name, data: url, date: new Date().toISOString() });
      } catch (err) { console.error(err); }
    }
    saveLocalMedia();
    renderMediaGrid();
    showAdminToast('Media assets synchronized', 'success');
  });
}

function renderMediaGrid() {
  const grid = document.getElementById('mediaGrid');
  const empty = document.getElementById('mediaEmpty');
  if (!grid || !empty) return;

  if (mediaLibrary.length === 0) {
    empty.style.display = 'block';
    grid.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = mediaLibrary.map(m => `
    <div class="media-item">
      <img src="${m.data}" alt="${m.name}" loading="lazy">
      <div class="media-item-overlay">
        <button class="media-btn-use" onclick="useMediaAsset('${m.data}', '${m.name}')" title="Attach to Product"><i class="fas fa-link"></i></button>
        <button class="media-btn-delete" onclick="deleteMediaAsset(${m.id})" title="Purge"><i class="fas fa-trash"></i></button>
      </div>
      <div class="media-item-name">${m.name}</div>
    </div>
  `).join('');
}

window.useMediaAsset = (data, name) => {
  document.getElementById('pImage').value = data;
  setImagePreview(data, name);
  switchTab('add-product');
  showAdminToast('Asset attached to editor', 'success');
};

window.deleteMediaAsset = (id) => {
  if (!confirm('Purge this asset from local history?')) return;
  mediaLibrary = mediaLibrary.filter(m => m.id !== id);
  saveLocalMedia();
  renderMediaGrid();
  showAdminToast('Asset purged', 'error');
};

// =================== CORE CRUD (Cloud Compatible) ===================

async function handleSaveProduct(e) {
  e.preventDefault();
  const imageVal = document.getElementById('pImage').value;
  if (!imageVal) return showAdminToast('Product requires a visual asset', 'error');

  const editId = document.getElementById('editId').value;
  const product = {
    id: editId ? parseInt(editId) : Date.now(),
    name: document.getElementById('pName').value,
    brand: document.getElementById('pBrand').value,
    category: document.getElementById('pCategory').value,
    price: parseInt(document.getElementById('pPrice').value),
    originalPrice: parseInt(document.getElementById('pOriginalPrice').value) || null,
    stock: parseInt(document.getElementById('pStock').value),
    fabric: document.getElementById('pFabric').value || 'Premium Cotton',
    image: imageVal,
    sizes: document.getElementById('pSizes').value.split(',').map(s => s.trim()),
    colors: document.getElementById('pColors').value ? document.getElementById('pColors').value.split(',').map(c => c.trim()) : ['#000000'],
    description: document.getElementById('pDescription').value || '',
    isNew: document.getElementById('pIsNew').checked,
    isSale: document.getElementById('pIsSale').checked,
    isHot: document.getElementById('pIsHot').checked,
    rating: 4.5,
    reviews: Math.floor(Math.random() * 50) + 10
  };

  // Carry over Firebase ID if editing
  if (editId) {
    const existing = products.find(p => p.id === parseInt(editId));
    if (existing && existing.fbId) product.fbId = existing.fbId;
  }

  showAdminToast('Synchronizing with backend...', 'info');
  try {
    await backend.saveProduct(product);
    await loadAndRender();
    resetForm();
    showAdminToast(editId ? 'Entity updated in cloud!' : 'Entity published to cloud!', 'success');
    switchTab('products');
  } catch (err) {
    showAdminToast('Cloud sync failed: ' + err.message, 'error');
  }
}

window.editProduct = (id) => {
  const p = products.find(pr => (pr.id == id || pr.fbId == id));
  if (!p) return;
  
  document.getElementById('editId').value = p.id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pBrand').value = p.brand;
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pOriginalPrice').value = p.originalPrice || '';
  document.getElementById('pStock').value = p.stock || 0;
  document.getElementById('pFabric').value = p.fabric || '';
  document.getElementById('pImage').value = p.image;
  document.getElementById('pSizes').value = Array.isArray(p.sizes) ? p.sizes.join(', ') : '';
  document.getElementById('pColors').value = Array.isArray(p.colors) ? p.colors.join(', ') : '';
  document.getElementById('pDescription').value = p.description || '';
  document.getElementById('pIsNew').checked = p.isNew;
  document.getElementById('pIsSale').checked = p.isSale;
  document.getElementById('pIsHot').checked = p.isHot;

  if (p.image) setImagePreview(p.image, p.name);
  document.getElementById('formTitle').textContent = 'Product Editor — Serial: ' + p.id;
  switchTab('add-product');
};

window.deleteProduct = async (id) => {
  console.log('Delete button clicked for ID:', id);
  if (!confirm('Permanently delete this product from database?')) {
    console.log('Delete cancelled by user');
    return;
  }
  
  const p = products.find(pr => (pr.id == id || pr.fbId == id));
  if (!p) {
    console.error('Product not found in local array. ID:', id, 'Available products:', products);
    return;
  }
  
  showAdminToast('Deleting from cloud...', 'info');
  try {
    console.log('Calling backend.deleteProduct for:', p);
    await backend.deleteProduct(p);
    await loadAndRender();
    showAdminToast('Entity deleted from backend', 'success');
  } catch (err) {
    console.error('Deletion failed:', err);
    showAdminToast('Cloud deletion failed: ' + err.message, 'error');
  }
};

function resetForm() {
  document.getElementById('productForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('pImage').value = '';
  document.getElementById('formTitle').textContent = 'Add New Product';
  clearImagePreview();
}
window.resetForm = resetForm;

// =================== RENDER HELPERS ===================

function renderDashboard() {
  document.getElementById('totalProducts').textContent = products.length;
  const revenue = products.reduce((sum, p) => sum + (p.price || 0), 0);
  document.getElementById('totalRevenue').textContent = `₹${revenue.toLocaleString()}`;
  document.getElementById('totalBrands').textContent = [...new Set(products.map(p => p.brand))].length;

  const recent = document.getElementById('recentProducts');
  recent.innerHTML = products.slice(-5).reverse().map(p => `
    <div class="dashboard-recent-item" style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f0f0f0">
      <img src="${p.image}" style="width:40px;height:50px;object-fit:cover;border-radius:4px">
      <div style="flex:1">
        <div style="font-weight:600;font-size:13px">${p.name}</div>
        <div style="font-size:11px;color:#888">${p.brand}</div>
      </div>
      <div style="font-weight:700">₹${p.price.toLocaleString()}</div>
    </div>
  `).join('');
}

function renderProductsTable() {
  const tbody = document.getElementById('productsTable');
  if (!tbody) return;
  
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#888">No products found.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img src="${p.image}" style="width:40px;height:50px;object-fit:cover;border-radius:4px"></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.brand}</td>
      <td style="text-transform:capitalize">${p.category}</td>
      <td><strong>₹${p.price.toLocaleString()}</strong></td>
      <td>${p.stock || 0}</td>
      <td>
        <div class="table-actions">
          <button type="button" class="btn-edit" data-id="${p.id || p.fbId}"><i class="fas fa-edit"></i></button>
          <button type="button" class="btn-delete" data-id="${p.id || p.fbId}"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderBrands() {
  const brands = {};
  products.forEach(p => brands[p.brand] = (brands[p.brand] || 0) + 1);
  const container = document.getElementById('brandsList2');
  if (container) {
    container.innerHTML = Object.entries(brands).map(([name, count]) => `
      <div class="brand-item">
        <div>${name}</div>
        <div class="brand-count">${count} products</div>
      </div>
    `).join('');
  }
}

function showAdminToast(msg, type = '') {
  const container = document.getElementById('adminToast');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// =================== ORDERS MANAGEMENT ===================
let orders = [];
let currentOrderFilter = 'all';

async function loadOrders() {
  try {
    orders = await backend.fetchOrders();
  } catch (err) {
    console.error('Failed to load orders:', err);
    orders = [];
  }
  renderOrders();
  // Update dashboard order count
  const totalOrdersEl = document.getElementById('totalOrders');
  if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
}

function renderOrders(filter = currentOrderFilter) {
  const list = document.getElementById('ordersList');
  const empty = document.getElementById('ordersEmpty');
  if (!list) return;

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (filtered.length === 0) {
    empty.style.display = 'block';
    list.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = filtered.map(order => {
    const statusColors = {
      pending: '#FF9800',
      confirmed: '#2196F3',
      shipped: '#9C27B0',
      delivered: '#4CAF50',
      cancelled: '#F44336'
    };
    const statusColor = statusColors[order.status] || '#999';
    const date = order.timestamp ? new Date(order.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';
    const customer = order.customer || {};
    const address = order.address || {};
    const items = order.items || [];
    const orderId = order.orderId || order.id || 'N/A';

    return `
      <div class="order-card" data-status="${order.status}">
        <div class="order-card-header">
          <div class="order-id-info">
            <span class="order-id-label">Order</span>
            <span class="order-id-value">#${orderId}</span>
          </div>
          <div class="order-status-badge" style="background:${statusColor}15;color:${statusColor};border:1px solid ${statusColor}30">
            <span class="status-dot" style="background:${statusColor}"></span>
            ${(order.status || 'pending').toUpperCase()}
          </div>
          <div class="order-date">${date}</div>
        </div>

        <div class="order-card-body">
          <div class="order-customer-section">
            <h4><i class="fas fa-user"></i> Customer</h4>
            <div class="order-detail-grid">
              <div><strong>Name:</strong> ${customer.name || 'N/A'}</div>
              <div><strong>Email:</strong> ${customer.email || 'N/A'}</div>
              <div><strong>Phone:</strong> ${customer.phone || 'N/A'}</div>
            </div>
          </div>

          <div class="order-address-section">
            <h4><i class="fas fa-map-marker-alt"></i> Delivery Address</h4>
            <p class="order-address-text">
              ${address.street || 'N/A'}${address.landmark ? ', ' + address.landmark : ''}<br>
              ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}
            </p>
          </div>

          <div class="order-items-section">
            <h4><i class="fas fa-box"></i> Items (${items.length})</h4>
            <div class="order-items-list">
              ${items.map(item => `
                <div class="order-item-row">
                  <img src="${item.image}" alt="${item.name}" class="order-item-thumb">
                  <div class="order-item-detail">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-meta">${item.brand || ''} • Size: ${item.size || '-'} • Qty: ${item.qty || 1}</div>
                  </div>
                  <div class="order-item-price">₹${((item.price || 0) * (item.qty || 1)).toLocaleString()}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="order-card-footer">
          <div class="order-total">
            <span>Total:</span>
            <strong>₹${(order.grandTotal || order.total || 0).toLocaleString()}</strong>
          </div>
          <div class="order-actions-row">
            <select class="order-status-select" onchange="handleStatusChange('${orderId}', this.value)" data-order-id="${orderId}">
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
              <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
            <button class="btn-admin btn-delete-order" onclick="handleDeleteOrder('${orderId}')" title="Delete Order">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.filterOrders = (status) => {
  currentOrderFilter = status;
  document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  document.querySelector(`.btn-filter[data-status="${status}"]`)?.classList.add('active');
  renderOrders(status);
};

window.handleStatusChange = async (orderId, newStatus) => {
  const order = orders.find(o => (o.orderId || o.id) == orderId);
  if (!order) return;
  showAdminToast('Updating order status...', 'info');
  try {
    await backend.updateOrderStatus(order, newStatus);
    order.status = newStatus;
    renderOrders();
    showAdminToast(`Order #${orderId} → ${newStatus.toUpperCase()}`, 'success');
  } catch (err) {
    showAdminToast('Status update failed: ' + err.message, 'error');
  }
};

window.handleDeleteOrder = async (orderId) => {
  if (!confirm(`Delete order #${orderId}? This cannot be undone.`)) return;
  const order = orders.find(o => (o.orderId || o.id) == orderId);
  if (!order) return;
  showAdminToast('Deleting order...', 'info');
  try {
    await backend.deleteOrder(order);
    orders = orders.filter(o => o !== order);
    renderOrders();
    const totalOrdersEl = document.getElementById('totalOrders');
    if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
    showAdminToast('Order deleted', 'success');
  } catch (err) {
    showAdminToast('Delete failed: ' + err.message, 'error');
  }
};
