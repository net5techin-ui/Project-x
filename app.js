// TN28 Men's Fashion Store - Premium Animated Storefront
import * as backend from './backend-config.js';

// --- DEFAULT MEN'S CLOTHING DATA ---
const defaultProducts = [
  { id: 1, name: "Premium Slim Fit Formal Shirt", brand: "Urbandesign", category: "formal", price: 2499, originalPrice: 3999, image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=80", sizes: ["S","M","L","XL","XXL"], colors: ["#1B2A4A","#FFFFFF","#F5E6D0"], fabric: "Premium Cotton", stock: 45, rating: 4.5, reviews: 128, isNew: true, isSale: false, isHot: false, description: "Impeccably tailored slim fit formal shirt crafted from premium Egyptian cotton." },
  { id: 2, name: "Classic Chino Trousers", brand: "Some", category: "casual", price: 1899, originalPrice: 2999, image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80", sizes: ["30","32","34","36","38"], colors: ["#D4BC8B","#1B2A4A","#0D0D0D"], fabric: "Cotton Twill", stock: 62, rating: 4.3, reviews: 95, isNew: true, isSale: true, isHot: false, description: "Classic fit chino trousers with comfortable stretch and a tailored look." },
  { id: 3, name: "Italian Leather Jacket", brand: "Jungle-jeans", category: "party", price: 8999, originalPrice: 14999, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80", sizes: ["M","L","XL","XXL"], colors: ["#0D0D0D","#3B2507"], fabric: "Genuine Leather", stock: 15, rating: 4.8, reviews: 67, isNew: false, isSale: true, isHot: true, description: "Handcrafted Italian leather jacket with premium YKK zippers and silk lining." },
  { id: 4, name: "Cotton Crew Neck T-Shirt", brand: "U-Casuals", category: "casual", price: 799, originalPrice: 1299, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80", sizes: ["S","M","L","XL"], colors: ["#FFFFFF","#0D0D0D","#1B2A4A","#E63946"], fabric: "100% Cotton", stock: 120, rating: 4.2, reviews: 234, isNew: true, isSale: false, isHot: false, description: "Essential crew neck t-shirt in premium combed cotton for everyday comfort." },
  { id: 5, name: "Premium Denim Jeans", brand: "wallplus", category: "casual", price: 2999, originalPrice: 4599, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80", sizes: ["30","32","34","36"], colors: ["#000000","#2c3e50"], fabric: "Heavy Denim", stock: 30, rating: 4.7, reviews: 88, isNew: false, isSale: false, isHot: true, description: "Rugged and stylish premium denim jeans from wallplus." },
  { id: 6, name: "Linen Summer Shirt", brand: "Haestor", category: "casual", price: 1599, originalPrice: 2499, image: "https://images.unsplash.com/photo-1596755094514-f8d13a027376?w=500&q=80", sizes: ["M","L","XL"], colors: ["#FFFFFF","#3498db"], fabric: "Linen", stock: 50, rating: 4.4, reviews: 110, isNew: true, isSale: true, isHot: false, description: "Breathable linen shirt by Haestor, perfect for summer days." }
];

// --- STATE ---
let products = [];
let cart = [];
let heroSlideIndex = 0;
let heroInterval = null;

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize UI listeners IMMEDIATELY (Non-blocking)
  initEventListeners();
  loadCart();
  updateCartBadge();
  initHeroSlider();
  initParticles();
  
  // 2. Start data loading
  await handleLoadProducts();
  
  // 3. Post-load initialization
  initScrollAnimations();
  initCountUp();
  detectLocation();

  if (backend.onProductsChange) {
    backend.onProductsChange((updated) => {
      if (updated && updated.length > 0) {
        products = updated;
        localStorage.setItem('tn28_initialized', 'true');
        renderAll(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
      }
    });
  }

  window.addEventListener('storage', async (e) => {
    if (!e.key || e.key === 'tn28_products') {
      await handleLoadProducts();
      renderAll(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
    }
  });
});

async function handleLoadProducts() {
  console.log('🔄 Loading application data...');
  try {
    const fetched = await backend.fetchProducts();
    const isInit = localStorage.getItem('tn28_initialized');
    
    if (fetched && fetched.length > 0) { 
      products = fetched; 
      localStorage.setItem('tn28_initialized', 'true'); 
      console.log('✅ Products loaded from Cloud');
    } else if (!isInit) { 
      products = [...defaultProducts]; 
      console.log('⚠️ Using Default Products (Initial Load)');
    } else {
      products = [...defaultProducts];
      console.log('ℹ️ Using Default Products (Cloud Empty)');
    }
  } catch (err) { 
    console.error('❌ Data loading error:', err);
    products = [...defaultProducts]; 
  }
  renderAll();
}

function renderAll(filter = 'all') { 
  renderNewArrivals(); 
  renderFeatured(filter); 
  renderOffers();
  
  // Extra: If on offers page, render all products to the offers grid too
  const og = document.getElementById('offersPageGrid');
  if (og) {
    const f = filter === 'all' ? products : products.filter(p => p.category === filter);
    og.innerHTML = f.map(createProductCard).join('');
    activateReveal();
  }
}

function renderOffers() {
  const container = document.getElementById('dynamicOfferContainer');
  if (!container) return;
  
  const offers = JSON.parse(localStorage.getItem('tn28_offers') || '[]');
  if (offers.length === 0) {
    container.innerHTML = `
      <section class="section" style="padding: 100px 0; text-align: center; background: var(--bg-warm);">
        <div class="container">
          <div class="section-head reveal active">
            <h2 class="section-title">Grand Opening Offers</h2>
            <p class="section-sub">Sign up for our newsletter to receive exclusive launch offers!</p>
          </div>
          <div style="margin-top: 40px;">
            <a href="index.html#featured" class="btn-dark">EXPLORE COLLECTION</a>
          </div>
        </div>
      </section>
    `;
    return;
  }
  
  container.innerHTML = offers.filter(o => o.active).map(offer => `
    <section class="section" style="padding: 60px 0; background: ${offers.indexOf(offer) % 2 === 0 ? 'var(--bg-warm)' : 'var(--white)'}">
      <div class="container">
        <div class="style-banner-inner reveal active">
          <div class="style-banner-text">
            <span class="style-tag">${offer.discount}% OFF</span>
            <h2>${offer.title}</h2>
            <p>${offer.description}</p>
            ${offer.code ? `<div style="background:rgba(255,255,255,0.1); padding:10px 20px; border-radius:8px; display:inline-block; margin-bottom:20px; font-weight:700; letter-spacing:2px; border:1px dashed var(--gold);">CODE: ${offer.code}</div><br>` : ''}
            <a href="index.html#featured" class="btn-hero-primary">REDEEM NOW</a>
          </div>
          <div class="style-banner-images">
             <div class="style-img-card" style="flex:2">
               <img src="${offer.image || 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800&q=80'}" style="height:400px; width:100%; object-fit:cover;">
             </div>
          </div>
        </div>
      </div>
    </section>
  `).join('');
}

// --- PRODUCT CARD ---
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

function renderNewArrivals() { 
  const g = document.getElementById('newArrivalsGrid'); 
  if (!g) return; 
  g.innerHTML = products.filter(p => p.isNew).slice(0,4).map(createProductCard).join(''); 
  activateReveal(); 
}

function renderFeatured(filter = 'all', type = 'category') {
  const g = document.getElementById('featuredGrid'); 
  if (!g) return;
  const f = filter === 'all' ? products : products.filter(p => p[type] === filter);
  g.innerHTML = f.slice(0,8).map(createProductCard).join(''); 
  activateReveal();
  if (type === 'category') document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
}

function filterByCategory(cat) {
  renderFeatured(cat, 'category');
  document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });
}

function filterByBrand(brand) {
  renderFeatured(brand, 'brand');
  document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });
}

// --- SEARCH ---
function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  const resultsEl = document.getElementById('searchResults');
  if (!resultsEl) return;
  
  if (!query) {
    resultsEl.innerHTML = '';
    return;
  }
  
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.brand.toLowerCase().includes(query) || 
    p.category.toLowerCase().includes(query)
  );
  
  if (filtered.length === 0) {
    resultsEl.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-light)">No products found for "${query}"</div>`;
    return;
  }
  
  resultsEl.innerHTML = `
    <div style="font-size:12px;color:var(--text-light);margin-bottom:16px;">Found ${filtered.length} results</div>
    <div class="search-results-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(140px,1fr));gap:16px;">
      ${filtered.map(p => `
        <div class="search-result-item" onclick="openQuickView('${p.id || p.fbId}')" style="cursor:pointer">
          <img src="${p.image}" style="width:100%;height:160px;object-fit:cover;border-radius:8px;margin-bottom:8px;">
          <div style="font-size:11px;color:var(--gold);font-weight:700;text-transform:uppercase;">${p.brand}</div>
          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
          <div style="font-size:14px;font-weight:700;">₹${p.price.toLocaleString()}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// --- HERO SLIDER ---
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-bg-image');
  if (!slides.length) return;
  heroInterval = setInterval(() => {
    slides[heroSlideIndex].classList.remove('active');
    heroSlideIndex = (heroSlideIndex + 1) % slides.length;
    slides[heroSlideIndex].classList.add('active');
  }, 6000);
}

// --- PARTICLES ---
function initParticles() {
  const c = document.getElementById('heroParticles'); 
  if (!c) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.style.cssText = `position:absolute;width:${Math.random()*4+1}px;height:${Math.random()*4+1}px;background:rgba(200,169,110,${Math.random()*0.3+0.1});border-radius:50%;left:${Math.random()*100}%;top:${Math.random()*100}%;animation:float ${Math.random()*4+3}s ease-in-out infinite;animation-delay:${Math.random()*3}s;`;
    c.appendChild(p);
  }
}

// --- COUNT UP ---
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

// --- CART ---
function loadCart() { cart = JSON.parse(localStorage.getItem('tn28_cart') || '[]'); }
function saveCart() { localStorage.setItem('tn28_cart', JSON.stringify(cart)); updateCartBadge(); renderCart(); }

function addToCart(pid, qty = 1, size = null) {
  const p = products.find(x => (x.id == pid || x.fbId == pid)); 
  if (!p) return;
  const ex = cart.find(i => (i.id == pid || i.fbId == pid) && i.size === size);
  if (ex) ex.qty += qty;
  else cart.push({ id: p.id, fbId: p.fbId, qty, size: size || p.sizes[0], name: p.name, price: p.price, image: p.image, brand: p.brand });
  saveCart(); 
  showToast(`${p.name} added to cart!`, 'success');
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
    return `
      <div class="cart-item">
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
  cart = [{ id: p.id, fbId: p.fbId, qty: 1, size: p.sizes[0], name: p.name, price: p.price, image: p.image, brand: p.brand }];
  saveCart();
  openCheckoutModal();
}

function updateCartBadge() { const e = document.getElementById('cartBadge'); if (e) e.textContent = cart.reduce((s,i) => s + i.qty, 0); }

// --- QUICK VIEW ---
function openQuickView(pid) {
  const p = products.find(x => (x.id == pid || x.fbId == pid)); 
  if (!p) return;
  document.getElementById('qvImage').src = p.image;
  document.getElementById('qvBrand').textContent = p.brand;
  document.getElementById('qvName').textContent = p.name;
  document.getElementById('qvPrice').textContent = `₹${p.price.toLocaleString()}`;
  document.getElementById('qvDescription').textContent = p.description || '';
  document.getElementById('qvSizes').innerHTML = p.sizes.map((s,i) => `<button class="size-option${i===0?' active':''}" onclick="selectSize(this)">${s}</button>`).join('');
  document.getElementById('qvAddToCart').onclick = () => { 
    const size = document.querySelector('#qvSizes .size-option.active')?.textContent; 
    addToCart(pid, parseInt(document.getElementById('qvQty').value||1), size); 
    closeModal('quickView'); 
  };
  openModal('quickView');
}

function selectSize(el) { 
  el.parentElement.querySelectorAll('.size-option').forEach(s => s.classList.remove('active')); 
  el.classList.add('active'); 
}

// --- MODALS ---
function openModal(name) { 
  document.getElementById(`${name}Overlay`).classList.add('active'); 
  document.getElementById(`${name}Modal`).classList.add('active'); 
  document.body.style.overflow = 'hidden'; 
}

function closeModal(name) { 
  document.getElementById(`${name}Overlay`).classList.remove('active'); 
  document.getElementById(`${name}Modal`).classList.remove('active'); 
  document.body.style.overflow = ''; 
}

// --- TOAST ---
function showToast(msg, type = '') {
  const c = document.getElementById('toastContainer'); 
  if (!c) return;
  const t = document.createElement('div'); 
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas fa-${type==='success'?'check-circle':'info-circle'}"></i> ${msg}`;
  c.appendChild(t); 
  setTimeout(() => { 
    t.style.opacity = '0'; 
    t.style.transform = 'translateX(30px)'; 
    setTimeout(() => t.remove(), 500); 
  }, 3000);
}

// --- SCROLL ANIMATIONS ---
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

// --- EVENTS ---
function initEventListeners() {
  window.addEventListener('scroll', () => {
    const h = document.getElementById('header');
    if (h) h.classList.toggle('scrolled', window.scrollY > 50);
    const st = document.getElementById('scrollTop');
    if (st) st.classList.toggle('active', window.scrollY > 500);
  });

  const st = document.getElementById('scrollTop');
  if (st) st.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Mobile menu
  const mmb = document.getElementById('mobileMenuBtn');
  const mm = document.getElementById('mobileMenu');
  const mmo = document.getElementById('mobileMenuOverlay');
  
  if (mmb && mm && mmo) {
    mmb.addEventListener('click', (e) => {
      e.stopPropagation();
      mm.classList.add('active');
      mmo.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  const closeMob = () => {
    if (mm) mm.classList.remove('active');
    if (mmo) mmo.classList.remove('active');
    document.body.style.overflow = '';
  };
  
  document.getElementById('closeMobileMenu')?.addEventListener('click', closeMob);
  mmo?.addEventListener('click', closeMob);
  document.querySelectorAll('.mobile-nav-links a').forEach(a => a.addEventListener('click', closeMob));

  // Search
  const sb = document.getElementById('searchBtn');
  const so = document.getElementById('searchOverlay');
  if (sb && so) {
    sb.addEventListener('click', () => {
      so.classList.add('active');
      document.getElementById('searchInput')?.focus();
      document.body.style.overflow = 'hidden';
    });
  }
  
  document.getElementById('searchClose')?.addEventListener('click', () => {
    so?.classList.remove('active');
    document.body.style.overflow = '';
  });
  
  document.getElementById('searchInput')?.addEventListener('input', handleSearch);

  // Cart
  const cb = document.getElementById('cartBtn');
  const cs = document.getElementById('cartSidebar');
  const co = document.getElementById('cartOverlay');
  if (cb && cs && co) {
    cb.addEventListener('click', () => {
      renderCart();
      cs.classList.add('active');
      co.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  const closeCartFn = () => {
    cs?.classList.remove('active');
    co?.classList.remove('active');
    document.body.style.overflow = '';
  };
  
  document.getElementById('closeCart')?.addEventListener('click', closeCartFn);
  co?.addEventListener('click', closeCartFn);
  document.getElementById('checkoutBtn')?.addEventListener('click', openCheckoutModal);

  // Quick View Close
  document.getElementById('closeQuickView')?.addEventListener('click', () => closeModal('quickView'));
  document.getElementById('quickViewOverlay')?.addEventListener('click', () => closeModal('quickView'));

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      renderFeatured(btn.dataset.filter, 'category');
      document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Qty buttons in quick view
  const qtyInput = document.getElementById('qvQty');
  document.getElementById('qvQtyMinus')?.addEventListener('click', () => {
    const v = parseInt(qtyInput.value);
    if (v > 1) qtyInput.value = v - 1;
  });
  document.getElementById('qvQtyPlus')?.addEventListener('click', () => {
    const v = parseInt(qtyInput.value);
    if (v < 10) qtyInput.value = v + 1;
  });

  // Newsletter
  document.getElementById('newsletterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const card = e.target.closest('.newsletter-card');
    if (card) {
      card.innerHTML = `<div style="text-align:center;padding:20px;"><div style="font-size:48px;margin-bottom:16px;">🎉</div><h2 style="margin-bottom:8px;">Thank You!</h2><p style="opacity:0.8;">You've been subscribed. Get ready for exclusive offers and style updates from TN28!</p></div>`;
    }
  });
}

// --- MULTI-STEP CHECKOUT LOGIC ---
window.nextStep = (step) => {
  document.querySelectorAll('.progress-step').forEach(s => s.classList.remove('active', 'completed'));
  
  if (step === 'Address') {
    document.getElementById('progAddress').classList.add('active');
    document.getElementById('checkoutMainTitle').textContent = '1. Select a delivery address';
    document.getElementById('checkoutBackBtn').style.display = 'none';
  } else if (step === 'Summary') {
    const name = document.getElementById('coFullName').value;
    const phone = document.getElementById('coPhone').value;
    const address = document.getElementById('coAddress').value;
    const city = document.getElementById('coCity').value;
    const pincode = document.getElementById('coPincode').value;
    
    if (!name || !phone || !address || !city || !pincode) {
      showToast('Please fill all required delivery fields', 'error');
      document.getElementById('progAddress').classList.add('active');
      return;
    }
    document.getElementById('progAddress').classList.add('completed');
    document.getElementById('progSummary').classList.add('active');
    document.getElementById('checkoutMainTitle').textContent = '2. Review your order';
    document.getElementById('checkoutBackBtn').style.display = 'flex';
  } else if (step === 'Payment') {
    document.getElementById('progAddress').classList.add('completed');
    document.getElementById('progSummary').classList.add('completed');
    document.getElementById('progPayment').classList.add('active');
    document.getElementById('checkoutMainTitle').textContent = '3. Select a payment method';
    document.getElementById('checkoutBackBtn').style.display = 'flex';
  }

  document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`step${step}`).classList.add('active');
};

window.selectPayment = (method) => {
  document.querySelectorAll('.payment-option-item').forEach(item => {
    item.classList.remove('active');
    const arrow = item.querySelector('.payment-arrow i');
    if (arrow) { arrow.className = 'far fa-circle'; arrow.style.color = 'var(--text-light)'; }
  });
  const selected = document.querySelector(`.payment-option-item[onclick="selectPayment('${method}')"]`);
  if (selected) selected.classList.add('active');
  const qrDisplay = document.getElementById('qrCodeDisplay');
  if (qrDisplay) qrDisplay.style.display = method === 'qr_scan' ? 'block' : 'none';
};

window.openCheckoutModal = () => {
  const items = document.getElementById('checkoutOrderItems');
  let total = 0;
  items.innerHTML = cart.map(i => { 
    total += i.price * i.qty; 
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px;background:#F8FAFC;border-radius:8px;margin-bottom:8px"><img src="${i.image}" style="width:48px;height:60px;object-fit:cover;border-radius:6px"><div style="flex:1"><div style="font-weight:600;font-size:13px">${i.name}</div><div style="font-size:11px;color:#64748B">${i.brand} • Size: ${i.size} • Qty: ${i.qty}</div></div><div style="font-weight:700">₹${(i.price*i.qty).toLocaleString()}</div></div>`; 
  }).join('');
  const ship = Math.round(total * 0.10);
  document.getElementById('coSubtotal').textContent = `₹${total.toLocaleString()}`;
  document.getElementById('coShipping').textContent = `₹${ship.toLocaleString()}`;
  document.getElementById('coTotal').textContent = `₹${(total + ship).toLocaleString()}`;
  nextStep('Address');
  openModal('checkout');
};

window.handleCheckoutFinal = async () => {
  const btn = document.querySelector('.btn-checkout-next[style*="background:#000"], .btn-checkout-next[style*="background: black"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> INITIALIZING...'; }
  const orderId = 'TN28-' + Date.now().toString(36).toUpperCase();
  const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  const ship = Math.round(total * 0.10);
  const grandTotal = total + ship;
  const payload = {
    orderId,
    customer: { name: document.getElementById('coFullName').value, phone: document.getElementById('coPhone').value },
    address: { 
      street: document.getElementById('coAddress').value, 
      city: document.getElementById('coCity').value, 
      state: document.getElementById('coState').value, 
      pincode: document.getElementById('coPincode').value 
    },
    items: cart, total, shipping: ship, grandTotal, status: 'pending'
  };
  try {
    await backend.placeOrder(payload);
    const whatsappNumber = "918637489726";
    const upiLink = `upi://pay?pa=9600447624@upi&pn=TN28%20Fashions&am=${grandTotal}&cu=INR&tn=Order%20${orderId}`;
    const itemsText = cart.map(i => `• ${i.name} (${i.size}) x ${i.qty} - ₹${(i.price * i.qty).toLocaleString()}`).join('%0A');
    const message = `🛍️ *NEW ORDER: ${orderId}*%0A━━━━━━━━━━━━━━━━━━%0A%0A📦 *ORDERED ITEMS:*%0A${itemsText}%0A%0A💰 *BILLING SUMMARY:*%0ASubtotal: ₹${total.toLocaleString()}%0AShipping: ₹${ship}%0A*Grand Total: ₹${grandTotal.toLocaleString()}*%0A%0A💳 *PAYMENT METHOD:* UPI%0ARef: Paid to 9600447624%0A%0A👤 *CUSTOMER DETAILS:*%0AName: ${payload.customer.name}%0APhone: ${payload.customer.phone}%0A%0A📍 *DELIVERY ADDRESS:*%0A${payload.address.street}, ${payload.address.city}, ${payload.address.state} - ${payload.address.pincode}%0A%0A━━━━━━━━━━━━━━━━━━%0A✅ *Please share the payment screenshot to confirm your order!*`;
    window.location.href = upiLink;
    setTimeout(() => {
      cart = []; saveCart(); closeModal('checkout');
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
      document.getElementById('successOrderId').textContent = orderId;
      openModal('orderSuccess');
    }, 2000);
  } catch (err) { 
    showToast('Order failed: ' + err.message, 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = 'PLACE ORDER VIA WHATSAPP'; }
  }
};

window.handleSearch = handleSearch;
window.addToCart = addToCart;
window.buyNow = buyNow;
window.removeFromCart = removeFromCart;
window.updateCartQty = updateCartQty;
window.openQuickView = openQuickView;
window.selectSize = selectSize;
window.closeModal = closeModal;
window.openCheckoutModal = openCheckoutModal;
window.filterByCategory = filterByCategory;
window.filterByBrand = filterByBrand;

document.getElementById('checkoutBackBtn')?.addEventListener('click', () => {
  const paymentStep = document.getElementById('stepPayment');
  const summaryStep = document.getElementById('stepSummary');
  if (summaryStep?.classList.contains('active')) nextStep('Address');
  else if (paymentStep?.classList.contains('active')) nextStep('Summary');
});