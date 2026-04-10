// TN28 Men's Fashion Store — Premium Animated Storefront
import * as backend from './backend-config.js';

// ─── DEFAULT MEN'S CLOTHING DATA ───
const defaultProducts = [
  { id: 1, name: "Premium Slim Fit Formal Shirt", brand: "Urbandesign", category: "formal", price: 2499, originalPrice: 3999, image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=80", sizes: ["S","M","L","XL","XXL"], colors: ["#1B2A4A","#FFFFFF","#F5E6D0"], fabric: "Premium Cotton", stock: 45, rating: 4.5, reviews: 128, isNew: true, isSale: false, isHot: false, description: "Impeccably tailored slim fit formal shirt crafted from premium Egyptian cotton." },
  { id: 2, name: "Classic Chino Trousers", brand: "Some", category: "casual", price: 1899, originalPrice: 2999, image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80", sizes: ["30","32","34","36","38"], colors: ["#D4BC8B","#1B2A4A","#0D0D0D"], fabric: "Cotton Twill", stock: 62, rating: 4.3, reviews: 95, isNew: true, isSale: true, isHot: false, description: "Classic fit chino trousers with comfortable stretch and a tailored look." },
  { id: 3, name: "Italian Leather Jacket", brand: "Jungle-jeans", category: "party", price: 8999, originalPrice: 14999, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80", sizes: ["M","L","XL","XXL"], colors: ["#0D0D0D","#3B2507"], fabric: "Genuine Leather", stock: 15, rating: 4.8, reviews: 67, isNew: false, isSale: true, isHot: true, description: "Handcrafted Italian leather jacket with premium YKK zippers and silk lining." },
  { id: 4, name: "Cotton Crew Neck T-Shirt", brand: "U-Casuals", category: "casual", price: 799, originalPrice: 1299, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80", sizes: ["S","M","L","XL"], colors: ["#FFFFFF","#0D0D0D","#1B2A4A","#E63946"], fabric: "100% Cotton", stock: 120, rating: 4.2, reviews: 234, isNew: true, isSale: false, isHot: false, description: "Essential crew neck t-shirt in premium combed cotton for everyday comfort." },
  { id: 5, name: "Premium Denim Jeans", brand: "wallplus", category: "casual", price: 2999, originalPrice: 4599, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80", sizes: ["30","32","34","36"], colors: ["#000000","#2c3e50"], fabric: "Heavy Denim", stock: 30, rating: 4.7, reviews: 88, isNew: false, isSale: false, isHot: true, description: "Rugged and stylish premium denim jeans from wallplus." },
  { id: 6, name: "Linen Summer Shirt", brand: "Haestor", category: "casual", price: 1599, originalPrice: 2499, image: "https://images.unsplash.com/photo-1596755094514-f8d13a027376?w=500&q=80", sizes: ["M","L","XL"], colors: ["#FFFFFF","#3498db"], fabric: "Linen", stock: 50, rating: 4.4, reviews: 110, isNew: true, isSale: true, isHot: false, description: "Breathable linen shirt by Haestor, perfect for summer days." }
];

// ─── STATE ───
let products = [];
let cart = [];
let heroSlideIndex = 0;
let heroInterval = null;

// ─── INIT ───
document.addEventListener('DOMContentLoaded', async () => {

  // Location Detection
  detectLocation();

  // Load products
  await handleLoadProducts();

  // Supabase real-time sync
  if (backend.onProductsChange) {
    backend.onProductsChange((updated) => {
      if (updated && updated.length > 0) {
        products = updated;
        localStorage.setItem('tn28_initialized', 'true');
        renderAll(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
      }
    });
  }

  // LocalStorage sync
  window.addEventListener('storage', async (e) => {
    if (!e.key || e.key === 'tn28_products') {
      await handleLoadProducts();
      renderAll(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
    }
  });

  loadCart();
  renderAll();

  initHeroSlider();
  initEventListeners();
  initScrollAnimations();

  initCountUp();
  initParticles();
  updateCartBadge();
});

// ─── LOCATION ───
function detectLocation() {
  const el = document.getElementById('userLocation');
  if (!el) return;
  const defaultLoc = 'Rasipuram, Namakkal - 637 408';
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'Rasipuram';
          const area = data.address?.suburb || data.address?.neighbourhood || '';
          el.textContent = `${area ? area + ', ' : ''}${city}, India`;
        } catch { el.textContent = defaultLoc; }
      },
      () => { el.textContent = defaultLoc; }
    );
  } else { el.textContent = defaultLoc; }
}

// ─── PRODUCTS ───
async function handleLoadProducts() {
  try {
    const fetched = await backend.fetchProducts();
    const isInit = localStorage.getItem('tn28_initialized');
    if (fetched && fetched.length > 0) { products = fetched; localStorage.setItem('tn28_initialized', 'true'); }
    else if (isInit) { products = []; }
    else { products = [...defaultProducts]; }
  } catch { products = [...defaultProducts]; }
  renderAll();
}

function renderAll(filter = 'all') { renderNewArrivals(); renderFeatured(filter); }

// ─── PRODUCT CARD ───
function createProductCard(product) {
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const pid = product.id || product.fbId;
  return `
    <div class="product-card reveal" data-id="${pid}" data-category="${product.category}">
      <div class="product-image" onclick="openQuickView('${pid}')" style="cursor:pointer">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="product-badges">
          ${product.isNew ? '<span class="product-badge new">NEW</span>' : ''}
          ${product.isSale ? `<span class="product-badge sale">${discount}% OFF</span>` : ''}
          ${product.isHot ? '<span class="product-badge hot">HOT</span>' : ''}
        </div>
        <div class="product-actions">
          <button class="product-action-btn" onclick="event.stopPropagation(); openQuickView('${pid}')"><i class="fas fa-eye"></i></button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-brand">${product.brand}</div>
        <h3 class="product-name" onclick="openQuickView('${pid}')" style="cursor:pointer">${product.name}</h3>
        <div class="product-price">
          <span class="price-current">₹${product.price.toLocaleString()}</span>
          ${product.originalPrice ? `<span class="price-original">₹${product.originalPrice.toLocaleString()}</span>` : ''}
          ${discount > 0 ? `<span class="price-discount">${discount}% OFF</span>` : ''}
        </div>
        <div class="product-rating">
          ${Array.from({length:5}, (_,i) => `<i class="fas fa-star" style="opacity:${i < Math.floor(product.rating || 4.5) ? 1 : 0.3}"></i>`).join('')}
          <span>(${product.reviews || 0})</span>
        </div>
      </div>
      <div class="product-card-footer">
        <button class="product-add-cart" onclick="addToCart('${pid}')"><i class="fas fa-shopping-bag"></i> Cart</button>
        <button class="product-buy-now" onclick="buyNow('${pid}')"><i class="fas fa-bolt"></i> Buy Now</button>
      </div>
    </div>`;
}

function renderNewArrivals() { const g = document.getElementById('newArrivalsGrid'); if (!g) return; g.innerHTML = products.filter(p => p.isNew).slice(0,4).map(createProductCard).join(''); activateReveal(); }
function renderFeatured(filter = 'all', type = 'category') {
  const g = document.getElementById('featuredGrid'); if (!g) return;
  const f = filter === 'all' ? products : products.filter(p => p[type] === filter);
  g.innerHTML = f.slice(0,8).map(createProductCard).join(''); activateReveal();
  if (type === 'category') document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
}


// ─── HERO SLIDER ───
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-bg-image');
  if (!slides.length) return;
  heroInterval = setInterval(() => {
    slides[heroSlideIndex].classList.remove('active');
    heroSlideIndex = (heroSlideIndex + 1) % slides.length;
    slides[heroSlideIndex].classList.add('active');
  }, 6000);
}

// ─── PARTICLES ───
function initParticles() {
  const c = document.getElementById('heroParticles'); if (!c) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.style.cssText = `position:absolute;width:${Math.random()*4+1}px;height:${Math.random()*4+1}px;background:rgba(200,169,110,${Math.random()*0.3+0.1});border-radius:50%;left:${Math.random()*100}%;top:${Math.random()*100}%;animation:float ${Math.random()*4+3}s ease-in-out infinite;animation-delay:${Math.random()*3}s;`;
    c.appendChild(p);
  }
}

// ─── COUNT UP ───
function initCountUp() {
  const nums = document.querySelectorAll('.stat-num');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseInt(el.dataset.count);
        let current = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = Math.floor(current).toLocaleString();
        }, 25);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  nums.forEach(n => obs.observe(n));
}

// ─── CART ───
function loadCart() { cart = JSON.parse(localStorage.getItem('tn28_cart') || '[]'); }
function saveCart() { localStorage.setItem('tn28_cart', JSON.stringify(cart)); updateCartBadge(); renderCart(); }
function addToCart(pid, qty = 1, size = null) {
  const p = products.find(x => (x.id == pid || x.fbId == pid)); if (!p) return;
  const ex = cart.find(i => (i.id == pid || i.fbId == pid) && i.size === size);
  if (ex) ex.qty += qty;
  else cart.push({ id: p.id, fbId: p.fbId, qty, size: size || p.sizes[0], name: p.name, price: p.price, image: p.image, brand: p.brand });
  saveCart(); showToast(`${p.name} added to cart!`, 'success');
}
function removeFromCart(i) { cart.splice(i, 1); saveCart(); }
function updateCartQty(i, d) { cart[i].qty += d; if (cart[i].qty <= 0) cart.splice(i, 1); saveCart(); }
function renderCart() {
  const c = document.getElementById('cartItems'), f = document.getElementById('cartFooter'), em = document.getElementById('cartEmpty');
  if (!c) return;
  
  if (cart.length === 0) {
    if (em) em.style.display = 'block';
    if (f) f.style.display = 'none';
    c.innerHTML = '';
    return;
  }

  if (em) em.style.display = 'none';
  if (f) f.style.display = 'block';
  
  let total = 0;
  c.innerHTML = cart.map((item, i) => {
    total += item.price * item.qty;
    return `<div class="cart-item">
      <div class="cart-item-image"><img src="${item.image}" alt="${item.name}"></div>
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">${item.brand} • Size: ${item.size}</div>
        <div class="cart-item-bottom">
          <span class="cart-item-price">₹${(item.price*item.qty).toLocaleString()}</span>
          <div class="cart-item-qty">
            <button onclick="updateCartQty(${i},-1)">−</button>
            <span>${item.qty}</span>
            <button onclick="updateCartQty(${i},1)">+</button>
          </div>
          <span class="cart-item-remove" onclick="removeFromCart(${i})"><i class="fas fa-trash"></i></span>
        </div>
      </div>
    </div>`;
  }).join('');
  
  if (document.getElementById('cartTotal')) {
    document.getElementById('cartTotal').textContent = `₹${total.toLocaleString()}`;
  }
}

function buyNow(pid) {
  const p = products.find(x => (x.id == pid || x.fbId == pid));
  if (!p) return;
  // Clear current cart if desired, or just add and checkout. 
  // User usually expects "Buy Now" to focus on that one item.
  cart = [{ id: p.id, fbId: p.fbId, qty: 1, size: p.sizes[0], name: p.name, price: p.price, image: p.image, brand: p.brand }];
  saveCart();
  openCheckoutModal();
}

function updateCartBadge() { const e = document.getElementById('cartBadge'); if (e) e.textContent = cart.reduce((s,i) => s + i.qty, 0); }



// ─── QUICK VIEW ───
function openQuickView(pid) {
  const p = products.find(x => (x.id == pid || x.fbId == pid)); if (!p) return;
  document.getElementById('qvImage').src = p.image;
  document.getElementById('qvBrand').textContent = p.brand;
  document.getElementById('qvName').textContent = p.name;
  document.getElementById('qvPrice').textContent = `₹${p.price.toLocaleString()}`;
  document.getElementById('qvDescription').textContent = p.description || '';
  document.getElementById('qvSizes').innerHTML = p.sizes.map((s,i) => `<button class="size-option${i===0?' active':''}" onclick="selectSize(this)">${s}</button>`).join('');
  document.getElementById('qvAddToCart').onclick = () => { const size = document.querySelector('#qvSizes .size-option.active')?.textContent; addToCart(pid, parseInt(document.getElementById('qvQty').value||1), size); closeModal('quickView'); };
  openModal('quickView');
}
function selectSize(el) { el.parentElement.querySelectorAll('.size-option').forEach(s => s.classList.remove('active')); el.classList.add('active'); }

// ─── MODALS ───
function openModal(name) { document.getElementById(`${name}Overlay`).classList.add('active'); document.getElementById(`${name}Modal`).classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeModal(name) { document.getElementById(`${name}Overlay`).classList.remove('active'); document.getElementById(`${name}Modal`).classList.remove('active'); document.body.style.overflow = ''; }

// ─── TOAST ───
function showToast(msg, type = '') {
  const c = document.getElementById('toastContainer'); if (!c) return;
  const t = document.createElement('div'); t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas fa-${type==='success'?'check-circle':'info-circle'}"></i> ${msg}`;
  c.appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(30px)'; setTimeout(() => t.remove(), 500); }, 3000);
}

// ─── TIMER ───


// ─── SCROLL ANIMATIONS ───
function initScrollAnimations() {
  const obs = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); }); }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}
function activateReveal() {
  setTimeout(() => {
    const obs = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); }); }, { threshold: 0.1 });
    document.querySelectorAll('.reveal:not(.active)').forEach(el => obs.observe(el));
  }, 100);
}

// ─── EVENTS ───
function initEventListeners() {
  // Scroll effects
  window.addEventListener('scroll', () => {
    document.getElementById('header').classList.toggle('scrolled', window.scrollY > 50);
    document.getElementById('scrollTop').classList.toggle('active', window.scrollY > 500);
  });
  document.getElementById('scrollTop').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Mobile menu
  document.getElementById('mobileMenuBtn').onclick = () => { document.getElementById('mobileMenu').classList.add('active'); document.getElementById('mobileMenuOverlay').classList.add('active'); };
  const closeMob = () => { document.getElementById('mobileMenu').classList.remove('active'); document.getElementById('mobileMenuOverlay').classList.remove('active'); };
  document.getElementById('closeMobileMenu').onclick = closeMob;
  document.getElementById('mobileMenuOverlay').onclick = closeMob;
  document.querySelectorAll('.mobile-nav-links a').forEach(a => a.addEventListener('click', closeMob));

  // Search
  document.getElementById('searchBtn').onclick = () => { document.getElementById('searchOverlay').classList.add('active'); document.getElementById('searchInput').focus(); };
  document.getElementById('searchClose').onclick = () => document.getElementById('searchOverlay').classList.remove('active');
  document.getElementById('searchInput').addEventListener('input', handleSearch);

  // Cart
  document.getElementById('cartBtn').onclick = () => { renderCart(); document.getElementById('cartSidebar').classList.add('active'); document.getElementById('cartOverlay').classList.add('active'); };
  const closeCartFn = () => { document.getElementById('cartSidebar').classList.remove('active'); document.getElementById('cartOverlay').classList.remove('active'); };
  document.getElementById('closeCart').onclick = closeCartFn;
  document.getElementById('cartOverlay').onclick = closeCartFn;

  // Quick View
  document.getElementById('closeQuickView').onclick = () => closeModal('quickView');
  document.getElementById('quickViewOverlay').onclick = () => closeModal('quickView');



  // Checkout
  document.getElementById('checkoutBtn').onclick = () => { if (cart.length > 0) openCheckoutModal(); };
  const checkoutFormEl = document.getElementById('checkoutForm');
  if (checkoutFormEl) checkoutFormEl.addEventListener('submit', handleCheckout);

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      renderFeatured(btn.dataset.filter, 'category');
      document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Qty buttons in quick view
  const qtyMinus = document.getElementById('qvQtyMinus');
  const qtyPlus = document.getElementById('qvQtyPlus');
  const qtyInput = document.getElementById('qvQty');
  if (qtyMinus) qtyMinus.onclick = () => { const v = parseInt(qtyInput.value); if (v > 1) qtyInput.value = v - 1; };
  if (qtyPlus) qtyPlus.onclick = () => { const v = parseInt(qtyInput.value); if (v < 10) qtyInput.value = v + 1; };

  // Newsletter
  const nlForm = document.getElementById('newsletterForm');
  if (nlForm) nlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const card = nlForm.closest('.newsletter-card');
    if (card) {
      card.innerHTML = `<div style="text-align:center;padding:20px;"><div style="font-size:48px;margin-bottom:16px;">🎉</div><h2 style="margin-bottom:8px;">Thank You!</h2><p style="opacity:0.8;">You've been subscribed. Get ready for exclusive offers and style updates from TN28!</p><p style="margin-top:16px;opacity:0.6;">Keep visiting our website for amazing deals!</p></div>`;
    }
  });
}

// ─── CHECKOUT ───
async function handleCheckout(e) {
  e.preventDefault();
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESSING...';
  const total = cart.reduce((s,i) => s + (i.price * i.qty), 0);
  const payload = {
    customer: { name: document.getElementById('coFullName').value, email: document.getElementById('coEmail').value, phone: document.getElementById('coPhone').value },
    address: { street: document.getElementById('coAddress').value, city: document.getElementById('coCity').value, state: document.getElementById('coState').value, pincode: document.getElementById('coPincode').value, landmark: document.getElementById('coLandmark').value },
    items: cart.map(i => ({ name: i.name, brand: i.brand, price: i.price, qty: i.qty, size: i.size, image: i.image, productId: i.id || i.fbId })),
    itemCount: cart.reduce((s,i) => s + i.qty, 0), total, shipping: Math.round(total * 0.10), grandTotal: Math.round(total * 1.10)
  };
  try {
    const result = await backend.placeOrder(payload);
    closeModal('checkout');
    document.getElementById('successOrderId').textContent = result.orderId || 'N/A';
    document.getElementById('successDetails').innerHTML = `<p style="margin:12px 0">Total: ₹${payload.grandTotal.toLocaleString()}</p><p style="font-size:14px;color:#64748B">You'll receive a confirmation email shortly.</p>`;
    openModal('orderSuccess');
    cart = []; saveCart();
    document.getElementById('cartSidebar').classList.remove('active'); document.getElementById('cartOverlay').classList.remove('active');
    showToast('Order placed successfully!', 'success');
  } catch (err) { showToast('Order failed: ' + err.message, 'error'); }
  finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> PLACE ORDER'; }
}

function openCheckoutModal() {
  const items = document.getElementById('checkoutOrderItems');
  let total = 0;
  items.innerHTML = cart.map(i => { total += i.price * i.qty; return `<div style="display:flex;align-items:center;gap:12px;padding:10px;background:#F8FAFC;border-radius:8px;margin-bottom:8px"><img src="${i.image}" style="width:48px;height:60px;object-fit:cover;border-radius:6px"><div style="flex:1"><div style="font-weight:600;font-size:13px">${i.name}</div><div style="font-size:11px;color:#64748B">${i.brand} • Size: ${i.size} • Qty: ${i.qty}</div></div><div style="font-weight:700">₹${(i.price*i.qty).toLocaleString()}</div></div>`; }).join('');
  const ship = Math.round(total * 0.10);
  document.getElementById('coSubtotal').textContent = `₹${total.toLocaleString()}`;
  document.getElementById('coShipping').textContent = `₹${ship.toLocaleString()}`;
  document.getElementById('coTotal').textContent = `₹${(total + ship).toLocaleString()}`;
  openModal('checkout');
}

// ─── SEARCH ───
function handleSearch() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const r = document.getElementById('searchResults');
  if (q.length < 2) { r.innerHTML = ''; return; }
  const results = products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  r.innerHTML = results.map(p => `<div style="display:flex;align-items:center;gap:12px;padding:12px;cursor:pointer;border-radius:8px;transition:all 0.3s" onmouseover="this.style.background='#F1F5F9'" onmouseout="this.style.background=''" onclick="openQuickView('${p.id||p.fbId}');document.getElementById('searchOverlay').classList.remove('active')"><img src="${p.image}" style="width:50px;height:60px;object-fit:cover;border-radius:6px"><div><div style="font-weight:600;font-size:14px">${p.name}</div><div style="font-size:12px;color:#64748B">₹${p.price.toLocaleString()} • ${p.brand}</div></div></div>`).join('');
}

// ─── GLOBAL ───
window.addToCart = addToCart;
window.buyNow = buyNow;
window.removeFromCart = removeFromCart;
window.updateCartQty = updateCartQty;
window.toggleWishlist = () => {};
window.openQuickView = openQuickView;
window.selectSize = selectSize;
window.closeModal = closeModal;
window.openCheckoutModal = openCheckoutModal;
window.filterByBrand = (b) => renderFeatured(b, 'brand');
window.filterByCategory = (c) => renderFeatured(c, 'category');

// ─── MULTI-STEP CHECKOUT LOGIC ───
window.nextStep = (step) => {
  if (step === 'Address') {
    document.getElementById('checkoutMainTitle').textContent = 'Add Delivery Address';
    document.getElementById('checkoutBackBtn').style.display = 'flex';
  } else if (step === 'Summary') {
    // Validate Address fields before moving to Summary
    const name = document.getElementById('coFullName').value;
    const phone = document.getElementById('coPhone').value;
    const address = document.getElementById('coAddress').value;
    const city = document.getElementById('coCity').value;
    const pincode = document.getElementById('coPincode').value;
    
    if (!name || !phone || !address || !city || !pincode) {
      showToast('Please fill all required delivery fields', 'error');
      return;
    }
    
    document.getElementById('checkoutMainTitle').textContent = 'Order Summary';
  } else if (step === 'Payment') {
    document.getElementById('checkoutMainTitle').textContent = 'Select Payment Method';
    document.getElementById('checkoutBackBtn').style.display = 'none';
  }

  // Toggle steps
  document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`step${step}`).classList.add('active');
};

window.selectPayment = (method) => {
  document.querySelectorAll('.payment-option-item').forEach(item => {
    item.classList.remove('active');
    const arrow = item.querySelector('.payment-arrow i');
    if (arrow) {
      arrow.className = 'far fa-circle';
      arrow.style.color = 'var(--text-light)';
    }
  });
  
  const selected = document.querySelector(`.payment-option-item[onclick="selectPayment('${method}')"]`);
  if (selected) {
    selected.classList.add('active');
    const arrow = selected.querySelector('.payment-arrow i');
    if (arrow) {
      arrow.className = 'fas fa-check-circle';
      arrow.style.color = '#22C55E';
    }
  }
};

window.handleCheckoutFinal = async () => {
  const btn = document.querySelector('.btn-checkout-next[style*="background:#000"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> INITIALIZING PAYMENT...';
  }

  const orderId = 'TN28-' + Date.now().toString(36).toUpperCase();
  const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  const ship = Math.round(total * 0.10);
  const grandTotal = total + ship;

  const payload = {
    orderId,
    customer: {
      name: document.getElementById('coFullName').value,
      phone: document.getElementById('coPhone').value
    },
    address: {
      street: document.getElementById('coAddress').value,
      city: document.getElementById('coCity').value,
      state: document.getElementById('coState').value,
      pincode: document.getElementById('coPincode').value
    },
    items: cart,
    total,
    shipping: ship,
    grandTotal,
    status: 'pending'
  };

  try {
    // 1. Save order to backend
    await backend.placeOrder(payload);

    // 2. Prepare UPI Deep Link (Amazon Style)
    const upiLink = `upi://pay?pa=8637489726@upi&pn=TN28%20Fashions&am=${grandTotal}&cu=INR&tn=Order%20${orderId}`;
    
    // 3. Prepare WhatsApp Message
    const whatsappNumber = "918637489726";
    const itemsText = cart.map(i => `• ${i.name} (${i.size}) x ${i.qty} - ₹${(i.price * i.qty).toLocaleString()}`).join('%0A');
    const message = `🛍️ *NEW ORDER: ${orderId}*%0A` +
      `━━━━━━━━━━━━━━━━━━%0A%0A` +
      `📦 *ORDERED ITEMS:*%0A${itemsText}%0A%0A` +
      `💰 *BILLING SUMMARY:*%0A` +
      `Subtotal: ₹${total.toLocaleString()}%0A` +
      `Shipping: ${ship === 0 ? 'FREE' : '₹' + ship}%0A` +
      `*Grand Total: ₹${grandTotal.toLocaleString()}*%0A%0A` +
      `💳 *PAYMENT METHOD:* UPI%0A` +
      `Ref: Paid to 8637489726%0A%0A` +
      `👤 *CUSTOMER DETAILS:*%0A` +
      `Name: ${payload.customer.name}%0A` +
      `Phone: ${payload.customer.phone}%0A%0A` +
      `📍 *DELIVERY ADDRESS:*%0A` +
      `${payload.address.street}, ${payload.address.city}, ${payload.address.state} - ${payload.address.pincode}%0A%0A` +
      `━━━━━━━━━━━━━━━━━━%0A` +
      `✅ *Please share the payment screenshot to confirm your order!*`;

    const waLink = `https://wa.me/${whatsappNumber}?text=${message}`;

    // 4. Trigger UPI App first
    window.location.href = upiLink;

    // 5. Short delay, then open WhatsApp
    setTimeout(() => {
      // Clean up cart
      cart = [];
      saveCart();
      closeModal('checkout');
      
      // Open WhatsApp
      window.open(waLink, '_blank');
      
      // Success modal
      document.getElementById('successOrderId').textContent = orderId;
      openModal('orderSuccess');
    }, 2000);

  } catch (err) {
    console.error('Order error:', err);
    showToast('Failed to place order. Please try again.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fab fa-whatsapp"></i> PLACE ORDER VIA WHATSAPP';
    }
  }
};

// Back button logic
document.getElementById('checkoutBackBtn')?.addEventListener('click', () => {
  const addressStep = document.getElementById('stepAddress');
  const paymentStep = document.getElementById('stepPayment');
  const summaryStep = document.getElementById('stepSummary');

  if (addressStep.classList.contains('active')) {
    nextStep('Payment');
  } else if (summaryStep.classList.contains('active')) {
    nextStep('Address');
  }
});

window.handleCheckoutFinal = handleCheckoutFinal;
