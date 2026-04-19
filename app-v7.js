// TN28 Main Storefront Engine — Maximum Device Compatibility (Legacy 1.0)
(function() {
  // --- DEFAULT FALLBACK DATA ---
  var defaultProducts = [];

  // --- STATE (Old-Style Array Cloning) ---
  console.log('🚀 TN28 Storefront Engine v11.0 (Compatibility Active)');
  window.products = defaultProducts.slice();
  window.cart = [];
  var currentQuickViewId = null; 
  var currentQuickViewProduct = null;
  var selectedSize = null;
  var heroSlideIndex = 0;
  var heroInterval = null;
  var selectedPaymentMethod = 'phonepe';
  window.offers = []; // ADDED: Offers state
  
  // --- UTILITY: Robust Device Compatibility Helpers ---
  window.safeGetAttr = function(el, attr) {
    if (!el || !el.getAttribute) return null;
    return el.getAttribute(attr);
  };
  
  window.safeSetAttr = function(el, attr, val) {
    if (el && el.setAttribute) el.setAttribute(attr, val);
  };

  window.safeClosest = function(el, selector) {
    if (!el) return null;
    if (el.closest) {
        try { return el.closest(selector); } catch(e) { /* ignore */ }
    }
    // Manual fallback for very old browsers
    var cur = el;
    while (cur && cur !== document.body) {
        if (cur.matches && cur.matches(selector)) return cur;
        if (cur.msMatchesSelector && cur.msMatchesSelector(selector)) return cur;
        if (cur.webkitMatchesSelector && cur.webkitMatchesSelector(selector)) return cur;
        cur = cur.parentElement;
    }
    return null;
  };

  window.safeSplitImages = function(imageStr) {
    if (!imageStr) return [];
    if (typeof imageStr !== 'string') return [imageStr];
    var parts = imageStr.split(',');
    var finalParts = [];
    for (var i = 0; i < parts.length; i++) {
        var p = parts[i].trim();
        if (p.indexOf('data:') === 0 && p.indexOf(';base64') !== -1 && i < parts.length - 1) {
            finalParts.push(p + ',' + parts[i+1].trim());
            i++; 
        } else if (p) {
            finalParts.push(p);
        }
    }
    return finalParts;
  };
  
  var errorCount = 0;
  window.onerror = function(msg, url, line, col, error) {
    errorCount++;
    var stack = (error && error.stack) ? error.stack.split('\n').slice(0,2).join(' ') : '';
    console.error('Captured Error:', msg, 'at', line, 'col', col, 'stack:', stack);
    
    // Silent mode for minor mobile scroll offsets
    if (msg.indexOf('width') !== -1 || msg.indexOf('getBoundingClientRect') !== -1) return false;
    
    var shortMsg = msg.toString();
    if (shortMsg.indexOf('Uncaught TypeError') !== -1) {
        shortMsg = shortMsg.replace('Uncaught TypeError: ', '').split('\n')[0];
    }
    if (!shortMsg || shortMsg === 'App Error' || shortMsg === 'Uncaught TypeError' || shortMsg.indexOf('script error') !== -1) {
        shortMsg = 'Err [' + line + ':' + col + '] ' + (url ? url.split('/').pop() : 'script');
    }
    shortMsg = shortMsg.substring(0, 100);
    
    // Safety: Stop showing toasts after 6 consecutive errors to avoid flooding
    if (errorCount > 6) {
        console.warn('Too many errors. UI throttling active.');
        return false;
    }
    
    if (window.showToast) window.showToast('App Error: ' + shortMsg, 'error');
    return false;
  };

  // --- CORE RENDER FUNCTIONS (Exposed Globally) ---
  window.renderAll = function(filter) {
    var f = filter || 'all';
    try {
      if (window.renderNewArrivals) window.renderNewArrivals(); 
      if (window.renderFeatured) window.renderFeatured(f); 
      if (window.renderOffers) window.renderOffers();
      
      var og = document.getElementById('offersPageGrid');
      if (og) {
        var filteredList = [];
        var prods = window.products || [];
        if (f === 'all') {
            filteredList = prods;
        } else {
            for(var i=0; i<prods.length; i++) {
                if (!prods[i]) continue;
                var pCat = (prods[i].category || '').toLowerCase();
                if(pCat === f.toLowerCase()) filteredList.push(prods[i]);
            }
        }
        og.innerHTML = filteredList.filter(Boolean).map(window.createProductCard).join('');
      }
    } catch (e) { console.warn('Render issue:', e); }
  };

  window.renderNewArrivals = function() { 
    var g = document.getElementById('newArrivalsGrid'); 
    if (!g) return; 
    try {
      var news = [];
      // Show up to 20 latest products in New Arrivals
      var prods = window.products || [];
      var displayList = prods.slice(0, 20).filter(Boolean);
      g.innerHTML = displayList.map(window.createProductCard).join(''); 
    } catch(e) { console.error('Arrivals failed', e); }
  };

  window.renderFeatured = function(filter, type) {
    var g = document.getElementById('featuredGrid'); 
    if (!g) return;
    try {
      var t = type || 'category';
      
      var f = [];
      if (filter === 'all') {
          f = window.products;
      } else {
          for(var i=0; i<window.products.length; i++) {
              var p = window.products[i];
              var val = (p[t] || '').toString().toLowerCase();
              var name = (p.name || '').toLowerCase();
              
              // Special case for 'shirt' and 'pant' keywords
              if (filter === 'shirt' || filter === 'pant') {
                  if (val.indexOf(filter) !== -1 || name.indexOf(filter) !== -1) f.push(p);
              } else {
                  if(val === filter.toLowerCase()) f.push(p);
              }
          }
      }
      
      if (f.length === 0) {
        g.innerHTML = '<div class="no-products-msg" style="padding:40px;text-align:center;grid-column:1/-1;color:#666;">No products found in this category.</div>';
        return;
      }

      g.innerHTML = f.slice(0, 48).filter(Boolean).map(window.createProductCard).join(''); 
      var cards = document.querySelectorAll('.product-card');
      for (var j = 0; j < cards.length; j++) cards[j].classList.add('active');
    } catch(e) { console.error('Featured failed', e); }
  };

  window.createProductCard = function(product) {
    try {
      var price = Number(product.price) || 0;
      var originalPrice = Number(product.originalPrice) || 0;
      var discount = (originalPrice > price) ? Math.round((1 - price / originalPrice) * 100) : 0;
      var pid = product.id || product.fbId || 'p' + Math.random();
      var name = product.name || 'Premium Item';
      
      var imageParts = window.safeSplitImages(product.image);
      var mainImage = (imageParts.length > 0 ? imageParts[0] : 'https://placehold.co/400x500?text=TN28+Fashion');
      
      var html = '<div class="product-card active" data-id="'+pid+'">';
      html += '<div class="product-image" data-action="quickview">'; 
      
      if (imageParts.length > 1) {
          // Meesho-style slider: Click to advance
          // card-slider-wrap prevents click bubbling issues
          html += '<div class="card-slider" id="slider-'+pid+'" onscroll="window.syncSliderDots(\''+pid+'\')">'; 
          for (var i = 0; i < imageParts.length; i++) {
              if (imageParts[i]) {
                  html += '<div class="card-slide" data-action="quickview"><img src="'+imageParts[i]+'" alt="'+name+'" onerror="this.src=\'https://placehold.co/400x500?text=Image+Loading...\'" loading="lazy"></div>';
              }
          }
          html += '</div>';
          
          // Slider Dots
          html += '<div class="card-dots">';
          for (var j = 0; j < Math.min(imageParts.length, 5); j++) {
              if (imageParts[j]) {
                  html += '<div class="card-dot '+(j===0?'active':'')+'"></div>';
              }
          }
          html += '</div>';
          
          // Slider Navigation Arrows
          html += '<div class="card-slider-nav">';
          html += '<button class="card-nav-btn" onclick="window.scrollSlider(\''+pid+'\', -1, event)"><i class="fas fa-chevron-left"></i></button>';
          html += '<button class="card-nav-btn" onclick="window.scrollSlider(\''+pid+'\', 1, event)"><i class="fas fa-chevron-right"></i></button>';
          html += '</div>';
      } else {
          html += '<div class="card-slide" data-action="quickview"><img src="'+mainImage+'" alt="'+name+'" onerror="this.src=\'https://placehold.co/400x500?text=Image+Loading...\'" loading="lazy"></div>';
      }
      
      html += '<div class="product-badges">';
      if(product.isNew) html += '<span class="product-badge new">NEW</span>';
      if(product.isSale && discount > 0) html += '<span class="product-badge sale">'+discount+'% OFF</span>';
      html += '</div>';
      
      html += '<div class="product-actions"><button class="product-action-btn"><i class="far fa-heart"></i></button></div>';
      
      html += '</div>';
      html += '<div class="product-info"><div class="product-brand">'+(product.brand || 'TN28')+'</div>';
      html += '<h3 class="product-name" data-action="quickview">'+name+'</h3>';
      html += '<div class="product-price"><span class="price-current">₹'+price.toLocaleString()+'</span>';
      if(discount > 0) html += ' <span class="price-original">₹'+originalPrice.toLocaleString()+'</span>';
      html += '</div></div>';
      html += '<div class="product-card-footer">';
      html += '<button class="product-add-cart" data-id="'+pid+'"><i class="fas fa-shopping-bag"></i></button>';
      html += '<button class="product-buy-now" data-id="'+pid+'">BUY NOW</button>';
      html += '</div></div>';
      return html;
    } catch(e) { console.error("Card error", e); return ''; }
  };

  window.syncSliderDots = function(pid) {
    try {
      var s = document.getElementById('slider-' + pid);
      if (!s) return;
      var rect = s.getBoundingClientRect();
      if (!rect || rect.width < 1) return;
      var idx = Math.round(s.scrollLeft / rect.width);
      window.safeSetAttr(s, 'data-current-index', idx);
      var parent = s.parentElement;
      if (!parent) return;
      var dots = parent.querySelectorAll('.card-dot');
      for(var i=0; i<dots.length; i++) if(dots[i]) dots[i].classList.toggle('active', i === idx);
    } catch(err) { console.warn("Sync error", err); }
  };

  window.scrollSlider = function(pid, dir, e) {
    try {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        var s = document.getElementById('slider-' + pid);
        if (!s) return;
        var rect = s.getBoundingClientRect();
        if (!rect || rect.width < 1) return;
        var prevSnap = s.style.scrollSnapType;
        s.style.scrollSnapType = 'none';
        if (s.scrollBy) {
            try { s.scrollBy({ left: rect.width * dir, behavior: 'smooth' }); } 
            catch(e) { s.scrollLeft += rect.width * dir; }
        } else {
            s.scrollLeft += rect.width * dir;
        }
        setTimeout(function() { s.style.scrollSnapType = prevSnap; }, 600);
    } catch(err) {}
  };

  // Removed window.advanceSlider to allow QuickView clicks to bubble up.
  // Sliding is now handled by native touch scroll and the navigation arrows.

  // --- DATA LOADING ---
  window.handleLoadProducts = function(force) {
    if (!window.backend || !window.backend.fetchProducts) return;
    
    window.backend.fetchProducts(force).then(function(fetched) {
      if (fetched) {
        // Quick check if data changed
        var p = window.products || [];
        var changed = (force === true) || !window.products || fetched.length !== p.length;
        if (!changed && fetched.length > 0 && p.length > 0) {
            try {
                if (fetched[0].id !== p[0].id) changed = true;
            } catch(e) { changed = true; }
        }
        
        if (changed) {
          window.products = fetched.filter(Boolean);
          window.renderAll('all');
          console.log('🔄 Data Synchronized: ' + fetched.filter(Boolean).length + ' products active');
        }
      }
    }).catch(function(e){ console.error('Sync failed', e); });
  };

  window.handleLoadOffers = function() {
    if (!window.backend || !window.backend.fetchOffers) return;
    window.backend.fetchOffers().then(function(fetched) {
      window.offers = fetched || [];
      window.renderOffers();
    }).catch(function(e){ console.error('Offers fetch failed', e); });
  };

  // --- INITIALIZATION ---
  window.initApp = function() {
    if (window.appInitialized) return;
    window.appInitialized = true;
    
    // CLEANUP: Clear any legacy cached products to ensure device sync
    localStorage.removeItem('tn28_products');
    
    try {
      if (window.initEventListeners) window.initEventListeners();
      if (window.loadCart) window.loadCart();
      if (window.updateCartBadge) window.updateCartBadge();
      if (window.initHeroSlider) window.initHeroSlider();
      if (window.detectLocation) window.detectLocation();
      
      window.renderAll('all');
      window.handleLoadProducts(true);
      window.handleLoadOffers(); 
    } catch(err) {
      console.error('Boot error', err);
      if (window.onerror) window.onerror(err.message || 'Boot failed', 'app-v7.js', 270);
    }
    
    // Explicitly check for backend
    if (!window.backend) {
      console.warn('Backend controller not found - checking retry...');
      setTimeout(function() { if(!window.backend) window.showToast('Backend connection pending...', 'info'); }, 2000);
    }

    // Periodic Background Sync (Safe for Mobile)
    setInterval(function() { 
      if (!document.hidden) window.handleLoadProducts(false); 
    }, 15000);

    try {
      if (window.backend && window.backend.onProductsChange) {
        window.backend.onProductsChange(function(updated) {
          if (updated && updated.length > 0) { 
            window.products = updated; 
            window.renderAll('all');
          }
        });
      }
    } catch(e) {}

    // SCROLL REVEAL LOGIC
    try {
      var revealCallback = function(entries, observer) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      };
      var revealObserver = new IntersectionObserver(revealCallback, { threshold: 0.1 });
      var reveals = document.querySelectorAll('.reveal');
      for (var k = 0; k < reveals.length; k++) revealObserver.observe(reveals[k]);
    } catch(e) { 
        // Fallback for very old browsers: show everything
        var allReveals = document.querySelectorAll('.reveal');
        for (var m = 0; m < allReveals.length; m++) allReveals[m].classList.add('active');
    }
  };

  window.initEventListeners = function() {
    window.addEventListener('scroll', function() {
      var h = document.getElementById('header'); if (h) h.classList.toggle('scrolled', window.scrollY > 50);
    });

    var mmb = document.getElementById('mobileMenuBtn');
    if(mmb) mmb.addEventListener('click', function() {
      document.getElementById('mobileMenu').classList.add('active');
      document.getElementById('mobileMenuOverlay').classList.add('active');
    });

    var closeMob = function() {
      document.getElementById('mobileMenu').classList.remove('active');
      document.getElementById('mobileMenuOverlay').classList.remove('active');
    };
    var cm = document.getElementById('closeMobileMenu'); if(cm) cm.addEventListener('click', closeMob);
    var mo = document.getElementById('mobileMenuOverlay'); if(mo) mo.addEventListener('click', closeMob);

    var cb = document.getElementById('cartBtn'); if(cb) cb.addEventListener('click', function() {
      window.renderCart();
      document.getElementById('cartSidebar').classList.add('active');
      document.getElementById('cartOverlay').classList.add('active');
    });

    var closeCart = function() {
      document.getElementById('cartSidebar').classList.remove('active');
      document.getElementById('cartOverlay').classList.remove('active');
    };
    var cc = document.getElementById('closeCart'); if(cc) cc.addEventListener('click', closeCart);
    var co = document.getElementById('cartOverlay'); if(co) co.addEventListener('click', closeCart);

    var closeQV = function() {
      window.closeModal('quickView');
    };
    var cqv = document.getElementById('closeQuickView'); if(cqv) cqv.addEventListener('click', closeQV);
    var qvo = document.getElementById('quickViewOverlay'); if(qvo) qvo.addEventListener('click', closeQV);

    var cbt = document.getElementById('checkoutBtn'); if(cbt) cbt.addEventListener('click', window.openCheckoutModal);

    // Filter Bar Listeners
    var fBtns = document.querySelectorAll('.filter-btn');
    for (var i = 0; i < fBtns.length; i++) {
      (function(btn) {
        btn.addEventListener('click', function() {
          for (var j = 0; j < fBtns.length; j++) fBtns[j].classList.remove('active');
          btn.classList.add('active');
          window.renderFeatured(window.safeGetAttr(btn, 'data-filter'), 'category');
        });
      })(fBtns[i]);
    }

    // Search Logic
    var sInput = document.getElementById('searchInput');
    var sResults = document.getElementById('searchResults');
    var sBtn = document.getElementById('searchBtn');
    var sOverlay = document.getElementById('searchOverlay');
    var sClose = document.getElementById('searchClose');

    if(sBtn) sBtn.addEventListener('click', function(){ if(sOverlay) sOverlay.classList.add('active'); if(sInput) sInput.focus(); });
    if(sClose) sClose.addEventListener('click', function(){ if(sOverlay) sOverlay.classList.remove('active'); });
    
    if(sInput) sInput.addEventListener('input', function() {
      var q = this.value.toLowerCase();
      if(q.length < 2) { if(sResults) sResults.innerHTML = ''; return; }
      
      var prods = window.products || [];
      var hits = prods.filter(function(p) {
        if (!p) return false;
        return (p.name||'').toLowerCase().indexOf(q) !== -1 || 
               (p.brand||'').toLowerCase().indexOf(q) !== -1 ||
               (p.category||'').toLowerCase().indexOf(q) !== -1;
      });
      
      if(hits.length === 0) {
        if(sResults) sResults.innerHTML = '<p style="text-align:center;padding:20px;color:#999">No products found for "'+q+'"</p>';
        return;
      }
      
      if(sResults) sResults.innerHTML = '<div class="search-results-grid">' + hits.map(function(p) {
        var imgs = window.safeSplitImages(p.image);
        var pImg = (imgs.length > 0 ? imgs[0] : 'https://placehold.co/400x500?text=No+Image');
        return '<div class="search-result-item" data-id="'+(p.id||p.fbId)+'" data-action="quickview" onclick="document.getElementById(\'searchOverlay\').classList.remove(\'active\')">' +
               '<img src="'+pImg+'" onerror="this.src=\'https://placehold.co/400x500?text=Image+Loading...\'">' +
               '<div class="search-result-name">' + (p.name || 'Item') + '</div>' +
               '<div class="search-result-price">₹' + (Number(p.price) || 0).toLocaleString() + '</div></div>';
      }).join('') + '</div>';
    });

    // Quantity Listeners
    var qm = document.getElementById('qvQtyMinus');
    var qp = document.getElementById('qvQtyPlus');
    var qi = document.getElementById('qvQty');
    if(qm) qm.addEventListener('click', function(){ if(qi.value > 1) qi.value--; });
    if(qp) qp.addEventListener('click', function(){ if(qi.value < 10) qi.value++; });

    // Global Product Action Listener (Event Delegation)
    document.addEventListener('click', function(e) {
      try {
        var target = e.target;
        if (!target) return;
        
        // Look for parent product-card or item with data-id
        var card = window.safeClosest(target, '.product-card') || window.safeClosest(target, '.search-result-item');
        var pid = window.safeGetAttr(target, 'data-id') || (card ? window.safeGetAttr(card, 'data-id') : null);
        
        if (!pid) return;

        if (target.classList && target.classList.contains('product-add-cart')) {
          window.addToCart(pid);
        } else if (target.classList && target.classList.contains('product-buy-now')) {
          window.buyNow(pid);
        } else if (window.safeClosest(target, '[data-action="quickview"]') || window.safeClosest(target, '.product-info') || window.safeClosest(target, '.product-name')) {
          window.openQuickView(pid);
        }
      } catch(err) { console.warn('Click handling error', err); }
    });
  };

  window.loadCart = function() { 
    try {
      var saved = localStorage.getItem('tn28_cart');
      window.cart = saved ? JSON.parse(saved) : []; 
      if (!Array.isArray(window.cart)) window.cart = [];
    } catch(e) { window.cart = []; }
  };
  window.saveCart = function() { 
    try {
      localStorage.setItem('tn28_cart', JSON.stringify(window.cart || [])); 
      window.updateCartBadge(); 
      window.renderCart(); 
    } catch(e) {}
  };
  window.updateCartBadge = function() { 
    var b = document.getElementById('cartBadge'); 
    if (b) b.textContent = (window.cart && window.cart.length) || 0; 
  };

  window.addToCart = function(pid) {
    if (!pid) return;
    var p = null;
    var prods = window.products || [];
    var sPid = pid.toString();
    for(var i=0; i<prods.length; i++) {
        var pCheck = prods[i];
        if(!pCheck) continue;
        var checkId = (pCheck.id || pCheck.fbId || '').toString();
        if(checkId === sPid) { p = pCheck; break; }
    }
    if (p) { window.cart.push(p); window.saveCart(); window.showToast('Added to cart', 'success'); }
  };

  window.buyNow = function(pid) {
    if (!pid) return;
    var p = null;
    var prods = window.products || [];
    var sPid = pid.toString();
    for(var i=0; i<prods.length; i++) {
        var pCheck = prods[i];
        if(!pCheck) continue;
        var checkId = (pCheck.id || pCheck.fbId || '').toString();
        if(checkId === sPid) { p = pCheck; break; }
    }
    if (p) { window.cart = [p]; window.saveCart(); window.openCheckoutModal(); }
  };

  window.renderCart = function() {
    var c = document.getElementById('cartItems'); if (!c) return;
    if (window.cart.length === 0) {
      document.getElementById('cartEmpty').style.display = 'block';
      document.getElementById('cartFooter').style.display = 'none';
      c.innerHTML = ''; return;
    }
    document.getElementById('cartEmpty').style.display = 'none';
    document.getElementById('cartFooter').style.display = 'block';
    var html = '';
    var total = 0;
    for(var i=0; i<window.cart.length; i++) {
        var item = window.cart[i];
        var q = item.qty || 1;
        var p = item.price * q;
        total += p;
        html += '<div class="cart-item" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eee">' +
                '<div><div style="font-weight:600">'+item.name+'</div>' +
                '<div style="font-size:12px;color:#666">Size: '+(item.selectedSize||'Standard')+' | Qty: '+q+'</div></div>' +
                '<div style="font-weight:700">₹'+p+'</div>' +
                '<button onclick="window.removeFromCart('+i+')" style="color:#ff4444;padding:5px">×</button></div>';
    }
    c.innerHTML = html;
    document.getElementById('cartTotal').textContent = '₹' + total;
  };

  window.removeFromCart = function(i) { window.cart.splice(i,1); window.saveCart(); };

  window.openQuickView = function(pid) {
    if (!pid) return;
    var p = null;
    var prods = window.products || [];
    var sPid = pid.toString();
    for(var i=0; i<prods.length; i++) {
        var pCheck = prods[i];
        if(!pCheck) continue;
        var checkId = (pCheck.id || pCheck.fbId || '').toString();
        if(checkId === sPid) { p = pCheck; break; }
    }
    if (!p) return;
    
    currentQuickViewProduct = p;
    selectedSize = null;
    
    var startIdx = 0;
    var cardSlider = document.getElementById('slider-' + pid);
    if (cardSlider) {
        var sIdx = window.safeGetAttr(cardSlider, 'data-current-index');
        if (sIdx) startIdx = parseInt(sIdx) || 0;
    }

    // Setup Side Thumbnails and Main Image
    var imageParts = window.safeSplitImages(p.image).slice(0, 6);
    var thumbContainer = document.getElementById('qvThumbnailsSide');
    var mainDisplay = document.getElementById('qvMainImage');
    
    if (thumbContainer) {
      thumbContainer.innerHTML = imageParts.map(function(img, idx) {
        return '<div class="qv-thumb-circle '+(idx===startIdx?'active':'')+'" onclick="window.changeQVImage(\''+img+'\', this, '+idx+')"><img src="'+img+'"></div>';
      }).join('');
    }
    
    if (mainDisplay) {
        mainDisplay.src = imageParts[startIdx] || 'https://placehold.co/400x500?text=No+Image';
        window.safeSetAttr(mainDisplay, 'data-current-index', startIdx);
        window.safeSetAttr(mainDisplay, 'data-images', JSON.stringify(imageParts));
    }

    document.getElementById('qvBrand').textContent = p.brand || 'URBAN DESIGN';
    document.getElementById('qvName').textContent = p.name;
    document.getElementById('qvPrice').textContent = '₹' + (Number(p.price)||0).toLocaleString();
    if(document.getElementById('qvDescription')) document.getElementById('qvDescription').textContent = p.description || "PREMIUM QUALITY PURE CLASS";
    
    var orig = document.getElementById('qvOriginal');
    if (orig) {
      orig.textContent = p.originalPrice ? '₹' + (Number(p.originalPrice)||0).toLocaleString() : '';
      orig.style.display = p.originalPrice ? 'inline' : 'none';
    }

    var sizeContainer = document.getElementById('qvSizes');
    if (sizeContainer) {
      var sArr = [];
      try {
        if (Array.isArray(p.sizes)) sArr = p.sizes;
        else if (typeof p.sizes === 'string' && p.sizes.trim().length > 0) {
          if (p.sizes.indexOf('[') !== -1) sArr = JSON.parse(p.sizes);
          else sArr = p.sizes.split(',').map(function(s){ return s.trim(); });
        }
      } catch(e) { sArr = []; }
      
      sArr = sArr.filter(function(s){ return s && s.toString().trim() !== ''; });

      if (sArr.length > 0) {
        sizeContainer.innerHTML = sArr.map(function(s) {
          return '<div class="size-option" onclick="window.selectSize(\''+s+'\', this)">' + s + '</div>';
        }).join('');
      } else {
        sizeContainer.innerHTML = '<div class="size-selected-msg" style="font-size:12px;color:#ef4444;font-weight:700;padding:4px 8px;border:1px solid #ef4444;border-radius:4px;">Standard Size</div>';
        window.selectedSize = 'Standard';
      }
    }

    window.openModal('quickView');
  };

  window.changeQVImage = function(url, el, idx) {
    var main = document.getElementById('qvMainImage');
    if (!main) return;
    
    // Smooth transition
    main.classList.add('changing');
    
    var thumbs = document.querySelectorAll('.qv-thumb-circle');
    for(var i=0; i<thumbs.length; i++) thumbs[i].classList.remove('active');
    if(el) el.classList.add('active');

    setTimeout(function() {
        main.src = url;
        window.safeSetAttr(main, 'data-current-index', idx);
        main.classList.remove('changing');
    }, 200);
  };

  window.nextQVImage = function() {
    var main = document.getElementById('qvMainImage');
    if (!main) return;
    var raw = window.safeGetAttr(main, 'data-images');
    if (!raw) return;
    var images = JSON.parse(raw);
    var currentIdx = parseInt(window.safeGetAttr(main, 'data-current-index')) || 0;
    var nextIdx = (currentIdx + 1) % images.length;
    
    var thumbs = document.querySelectorAll('.qv-thumb-circle');
    window.changeQVImage(images[nextIdx], thumbs[nextIdx], nextIdx);
  };

  window.scrollQVSlider = function(dir) {
    var s = document.getElementById('qvSlider');
    if (!s) return;
    s.scrollBy({ left: s.offsetWidth * dir, behavior: 'smooth' });
  };

  window.selectSize = function(s, el) {
    selectedSize = s;
    var opts = document.querySelectorAll('.size-option');
    for (var i = 0; i < opts.length; i++) opts[i].classList.remove('active');
    if (el) el.classList.add('active');
  };

  window.addToCartFromQuickView = function() {
    if (!currentQuickViewProduct) return;
    if (!selectedSize && currentQuickViewProduct.sizes && currentQuickViewProduct.sizes.length > 0) {
      window.showToast('Please select a size', 'error');
      return;
    }

    var qty = parseInt(document.getElementById('qvQty').value) || 1;
    var cartItem = JSON.parse(JSON.stringify(currentQuickViewProduct));
    cartItem.selectedSize = selectedSize || 'Free Size';
    cartItem.qty = qty;

    window.cart.push(cartItem);
    window.saveCart();
    window.closeModal('quickView');
    window.showToast('Added to cart', 'success');
  };

  window.buyNowFromQuickView = function() {
    if (!currentQuickViewProduct) return;
    if (!selectedSize && currentQuickViewProduct.sizes && currentQuickViewProduct.sizes.length > 0) {
      window.showToast('Please select a size', 'error');
      return;
    }

    var qty = parseInt(document.getElementById('qvQty').value) || 1;
    var cartItem = JSON.parse(JSON.stringify(currentQuickViewProduct));
    cartItem.selectedSize = selectedSize || 'Free Size';
    cartItem.qty = qty;

    window.cart = [cartItem];
    window.saveCart();
    window.openCheckoutModal();
  };

  window.openModal = function(n) {
    var ov = document.getElementById(n+'Overlay');
    var md = document.getElementById(n+'Modal');
    if (ov) ov.classList.add('active');
    if (md) md.classList.add('active');
  };
  window.closeModal = function(n) {
    var ov = document.getElementById(n+'Overlay');
    var md = document.getElementById(n+'Modal');
    if (ov) ov.classList.remove('active');
    if (md) md.classList.remove('active');
  };

  window.showToast = function(m, t) {
    console.log('Toast Triggered:', m, t);
    var c = document.getElementById('toastContainer') || document.getElementById('adminToast'); 
    if (!c) { console.warn('No toast container found'); return; }
    var e = document.createElement('div'); 
    e.className = 'toast ' + (t || 'info');
    e.textContent = m; 
    c.appendChild(e); 
    setTimeout(function(){ if(e.parentNode) e.parentNode.removeChild(e); }, 3000);
  };

  window.initHeroSlider = function() {
    var slides = document.querySelectorAll('.hero-bg-image');
    if (!slides.length) return;
    setInterval(function() {
      slides[heroSlideIndex].classList.remove('active');
      heroSlideIndex = (heroSlideIndex + 1) % slides.length;
      slides[heroSlideIndex].classList.add('active');
    }, 5000);
  };

  window.detectLocation = function() {
    var el = document.getElementById('userLocation');
    if (el) el.textContent = "Rasipuram, Namakkal";
  };

  window.openCheckoutModal = function() {
    var ov = document.getElementById('checkoutOverlay');
    var md = document.getElementById('checkoutModal');
    if (ov) ov.classList.add('active');
    if (md) md.classList.add('active');
    window.nextStep('Address');
  };

  window.nextStep = function(s) {
    var steps = document.querySelectorAll('.checkout-step');
    for (var i = 0; i < steps.length; i++) steps[i].style.display = 'none';
    
    var next = document.getElementById('step' + s);
    if (next) {
      next.style.display = 'block';
      
      // Update Progress Tracker UI
      var dots = { 'Address': 'progAddress', 'Review': 'progSummary', 'Payment': 'progPayment', 'Summary': 'progPayment' };
      var targetId = dots[s];
      
      var allDots = document.querySelectorAll('.progress-step');
      var metTarget = false;
      for(var j=0; j<allDots.length; j++) {
        allDots[j].classList.add('active');
        if(allDots[j].id === targetId) { metTarget = true; break; }
      }
      
      if (s === 'Review' || s === 'Summary') {
        window.renderCheckoutReview();
      }
      
      // Scroll to top of modal for mobile
      var md = document.querySelector('.modal.active');
      if (md) md.scrollTop = 0;
    }
  };

  window.renderCheckoutReview = function() {
    var ci = document.getElementById('checkoutOrderItems');
    var cif = document.getElementById('checkoutOrderItemsFinal');
    var containers = [ci, cif];
    
    var subtotal = 0;
    var itemsHtml = '';
    for (var i = 0; i < window.cart.length; i++) {
      var it = window.cart[i];
      var q = it.qty || 1;
      subtotal += (it.price * q);
      var imageParts = window.safeSplitImages(it.image);
      var itemImg = imageParts[0] || '';
      itemsHtml += '<div class="review-item" style="display:flex;gap:12px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #eee">' +
        '<img src="'+itemImg+'" style="width:40px;height:50px;object-fit:cover;border-radius:4px">' +
        '<div><div style="font-size:13px;font-weight:700">'+it.name+'</div>' +
        '<div style="font-size:11px;color:#666">Size: '+(it.selectedSize || 'Standard')+' | Qty: '+q+'</div>' +
        '<div style="font-size:12px;font-weight:700">₹'+(it.price * q).toLocaleString()+'</div></div></div>';
    }
    
    var shipping = subtotal > 999 ? 0 : 70;
    var total = subtotal + shipping;
    
    containers.forEach(function(c) {
      if (c) c.innerHTML = itemsHtml;
    });
    
    var update = function(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = '₹' + val.toLocaleString();
    };
    
    update('coSubtotal', subtotal);
    update('coSubtotalFinal', subtotal);
    update('coShipping', shipping);
    update('coShippingFinal', shipping);
    update('coTotal', total);
    update('coTotalFinal', total);
  };

  window.selectPayment = function(m) {
    selectedPaymentMethod = m;
    var opts = document.querySelectorAll('.payment-option-item');
    for (var i = 0; i < opts.length; i++) {
       opts[i].classList.toggle('active', opts[i].innerHTML.toLowerCase().indexOf(m) !== -1);
    }
    document.getElementById('qrCodeDisplay').style.display = m === 'qr_scan' ? 'block' : 'none';
  };

  window.handleCheckoutFinal = function() {
    var n = document.getElementById('coFullName').value;
    var p = document.getElementById('coPhone').value;
    var pin = document.getElementById('coPincode') ? document.getElementById('coPincode').value : '';
    var state = document.getElementById('coState') ? document.getElementById('coState').value : '';
    var city = document.getElementById('coCity').value;
    var addr = document.getElementById('coAddress').value;
    var landmark = document.getElementById('coLandmark') ? document.getElementById('coLandmark').value : '';
    
    if (!n || !p || !city || !addr || !pin) { window.showToast('Please fill all required address fields', 'error'); return; }
    
    var subtotal = 0;
    var itemsList = '';
    for(var i=0; i<window.cart.length; i++) {
      var it = window.cart[i];
      var q = it.qty || 1;
      var pr = it.price * q;
      subtotal += pr;
      itemsList += '\n- ' + it.name + ' (' + (it.selectedSize || 'Standard') + ') x' + q + ': ₹' + pr;
    }
    
    var shipping = subtotal > 999 ? 0 : 70;
    var grandTotal = subtotal + shipping;
    
    var msgBody = '*NEW ORDER - TN28 FASHIONS*' +
                 '\n━━━━━━━━━━━━━━━━━━' +
                 '\n*Customer:* ' + n +
                 '\n*Phone:* ' + p +
                 '\n*Address:* ' + addr + 
                 (landmark ? '\n*Landmark:* ' + landmark : '') +
                 '\n*City & State:* ' + city + ', ' + state +
                 '\n*Pincode:* ' + pin +
                 '\n━━━━━━━━━━━━━━━━━━' +
                 '\n*Items:*' + itemsList +
                 '\n━━━━━━━━━━━━━━━━━━' +
                 '\n*Subtotal:* ₹' + subtotal +
                 '\n*Shipping:* ₹' + shipping +
                 '\n*GRAND TOTAL: ₹' + grandTotal + '*' +
                 '\n━━━━━━━━━━━━━━━━━━' +
                 '\n*Payment Status:* Initiated (' + selectedPaymentMethod + ')';

    var msg = encodeURIComponent(msgBody);
    window.showToast('Redirecting to WhatsApp...', 'info');
    
    // Save to DB first
    if (window.backend && window.backend.placeOrder) {
      window.backend.placeOrder({
        orderId: 'TN28-' + Date.now().toString().slice(-6),
        customer: { name: n, phone: p },
        address: { 
          city: city, 
          state: state,
          pincode: pin,
          fullAddress: addr + (landmark ? ', Landmark: ' + landmark : '') 
        },
        items: window.cart,
        total: grandTotal,
        status: 'pending'
      });
    }

    setTimeout(function() {
      window.open('https://wa.me/919600447624?text=' + msg, '_blank');
      window.cart = []; 
      window.saveCart();
      window.closeModal('checkout');
      window.openModal('orderSuccess');
    }, 1000);
  };

  window.filterByBrand = function(b) {
    if (window.renderFeatured) window.renderFeatured(b, 'brand');
    window.location.hash = 'featured';
  };

  window.filterByCategory = function(c) {
    if (window.renderFeatured) window.renderFeatured(c, 'category');
    window.location.hash = 'featured';
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.initApp();
  } else {
    document.addEventListener('DOMContentLoaded', window.initApp);
  }

  window.renderOffers = function() {
    try {
      var c = document.getElementById('dynamicOfferContainer');
      if (!c) return;
      if (!window.offers || !Array.isArray(window.offers) || window.offers.length === 0) {
        c.innerHTML = '';
        return;
      }
      
      var html = '<section class="section" style="background:#fefce8; padding:40px 0; margin-bottom: 30px;"><div class="container">';
      html += '<h2 style="text-align:center; margin-bottom: 30px; font-family:\'Playfair Display\', serif;">Active Offers</h2>';
      html += '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">';
      
      var activeOffers = window.offers.filter(function(o){ return o && o.active !== false; });
      
      for(var i=0; i<activeOffers.length; i++) {
          var o = activeOffers[i];
          if (!o) continue;
          html += '<div style="background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display:flex; flex-direction:column;">';
          if (o.image) {
              html += '<img src="'+o.image+'" style="width:100%; height:160px; object-fit:cover;" onerror="this.style.display=\'none\'">';
          } else {
              html += '<div style="width:100%; height:10px; background:var(--amazon-yellow);"></div>';
          }
          html += '<div style="padding: 20px; flex: 1; display:flex; flex-direction:column;">';
          html += '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">';
          html += '<h3 style="margin:0; font-size:18px; color:var(--navy);">'+(o.title || 'Special Offer')+'</h3>';
          if (o.discount) html += '<span style="background:#ef4444; color:white; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:14px;">'+o.discount+'% OFF</span>';
          html += '</div>';
          if (o.description) html += '<p style="margin:0 0 15px; color:#475569; font-size:14px; flex:1;">'+o.description+'</p>';
          html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; border-top:1px dashed #cbd5e1; padding-top:15px;">';
          if (o.code) {
              html += '<div style="font-size:12px; color:#64748b;">USE CODE: <br><strong style="color:var(--navy); font-size:16px;">'+o.code+'</strong></div>';
          } else {
              html += '<div></div>'; 
          }
          if (o.expiry) html += '<div style="font-size:12px; color:#ef4444;">Valid till<br><strong>'+o.expiry+'</strong></div>';
          html += '</div></div></div>';
      }
      
      html += '</div></div></section>';
      c.innerHTML = html;
    } catch(err) { console.warn("Offers render issue", err); }
  };
})();