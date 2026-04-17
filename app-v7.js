// TN28 Main Storefront Engine — Maximum Device Compatibility (Legacy 1.0)
(function() {
  // --- DEFAULT FALLBACK DATA ---
  var defaultProducts = [];

  // --- STATE (Old-Style Array Cloning) ---
  console.log('🚀 TN28 Storefront Engine v7.0 (Deep-Logic) Active');
  window.products = defaultProducts.slice();
  window.cart = [];
  var currentQuickViewId = null; 
  var currentQuickViewProduct = null;
  var selectedSize = null;
  var heroSlideIndex = 0;
  var heroInterval = null;
  var selectedPaymentMethod = 'phonepe';
  window.offers = []; // ADDED: Offers state
  
  // Global Error Logger for diagnostics
  window.onerror = function(msg, url, line) {
    console.error('Captured Error:', msg, 'at', line);
    if (window.showToast) window.showToast('App Error: ' + msg.split(':')[0], 'error');
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
        if (f === 'all') {
            filteredList = window.products;
        } else {
            for(var i=0; i<window.products.length; i++) {
                var pCat = (window.products[i].category || '').toLowerCase();
                if(pCat === f.toLowerCase()) filteredList.push(window.products[i]);
            }
        }
        og.innerHTML = filteredList.map(window.createProductCard).join('');
      }
    } catch (e) { console.warn('Render issue:', e); }
  };

  window.renderNewArrivals = function() { 
    var g = document.getElementById('newArrivalsGrid'); 
    if (!g) return; 
    try {
      var news = [];
      // Show up to 20 latest products in New Arrivals
      var displayList = window.products.slice(0, 20);
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
              var val = (window.products[i][t] || '').toString().toLowerCase();
              if(val === filter.toLowerCase()) f.push(window.products[i]);
          }
      }
      
      if (f.length === 0) {
        g.innerHTML = '<div class="no-products-msg" style="padding:40px;text-align:center;grid-column:1/-1;color:#666;">No products found in this category.</div>';
        return;
      }

      g.innerHTML = f.slice(0, 48).map(window.createProductCard).join(''); 
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
      var image = (product.image || 'https://placehold.co/400x500?text=TN28+Fashion').split(',')[0].trim();
      
      var html = '<div class="product-card active" data-id="'+pid+'">';
      html += '<div class="product-image" data-action="quickview">';
      html += '<img src="'+image+'" alt="'+name+'" onerror="this.src=\'https://placehold.co/400x500?text=Image+Loading...\'" loading="lazy">';
      html += '<div class="product-badges">';
      if(product.isNew) html += '<span class="product-badge new">NEW</span>';
      if(product.isSale && discount > 0) html += '<span class="product-badge sale">'+discount+'% OFF</span>';
      html += '</div></div>';
      html += '<div class="product-info"><div class="product-brand">'+(product.brand || 'TN28')+'</div>';
      html += '<h3 class="product-name" data-action="quickview">'+name+'</h3>';
      html += '<div class="product-price">₹'+price.toLocaleString()+'</div></div>';
      html += '<div class="product-card-footer">';
      html += '<button class="product-add-cart" data-id="'+pid+'">Cart</button>';
      html += '<button class="product-buy-now" data-id="'+pid+'">Buy Now</button>';
      html += '</div></div>';
      return html;
    } catch(e) { return ''; }
  };

  // --- DATA LOADING ---
  window.handleLoadProducts = function(force) {
    if (!window.backend || !window.backend.fetchProducts) return;
    
    window.backend.fetchProducts(force).then(function(fetched) {
      if (fetched) {
        // Quick check if data changed (naive length check + first element check)
        var changed = force || !window.products || fetched.length !== window.products.length || (fetched.length > 0 && fetched[0].id !== window.products[0].id);
        
        if (changed) {
          window.products = fetched;
          window.renderAll('all');
          console.log('🔄 Data Synchronized: ' + fetched.length + ' products active');
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
    
    if (window.initEventListeners) window.initEventListeners();
    if (window.loadCart) window.loadCart();
    if (window.updateCartBadge) window.updateCartBadge();
    if (window.initHeroSlider) window.initHeroSlider();
    if (window.detectLocation) window.detectLocation();
    
    window.renderAll('all');
    window.handleLoadProducts(true);
    window.handleLoadOffers(); // ADDED: load offers
    
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
    fBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        fBtns.forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        window.renderFeatured(this.dataset.filter, 'category');
      });
    });

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
      
      var hits = window.products.filter(function(p) {
        return (p.name||'').toLowerCase().indexOf(q) !== -1 || 
               (p.brand||'').toLowerCase().indexOf(q) !== -1 ||
               (p.category||'').toLowerCase().indexOf(q) !== -1;
      });
      
      if(hits.length === 0) {
        if(sResults) sResults.innerHTML = '<p style="text-align:center;padding:20px;color:#999">No products found for "'+q+'"</p>';
        return;
      }
      
      if(sResults) sResults.innerHTML = '<div class="search-results-grid">' + hits.map(function(p) {
        var pImg = (p.image||'').split(',')[0];
        return '<div class="search-result-item" data-id="'+(p.id||p.fbId)+'" data-action="quickview" onclick="document.getElementById(\'searchOverlay\').classList.remove(\'active\')">' +
               '<img src="'+pImg+'">' +
               '<div class="search-result-name">'+p.name+'</div>' +
               '<div class="search-result-price">₹'+p.price.toLocaleString()+'</div></div>';
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
      var target = e.target;
      
      // Look for parent product-card or item with data-id
      var card = target.closest('.product-card') || target.closest('.search-result-item');
      var pid = target.getAttribute('data-id') || (card ? card.getAttribute('data-id') : null);
      
      if (!pid) return;

      if (target.classList.contains('product-add-cart')) {
        window.addToCart(pid);
      } else if (target.classList.contains('product-buy-now')) {
        window.buyNow(pid);
      } else if (target.closest('[data-action="quickview"]')) {
        window.openQuickView(pid);
      }
    });
  };

  window.loadCart = function() { 
    var saved = localStorage.getItem('tn28_cart');
    window.cart = saved ? JSON.parse(saved) : []; 
  };
  window.saveCart = function() { localStorage.setItem('tn28_cart', JSON.stringify(window.cart)); window.updateCartBadge(); window.renderCart(); };
  window.updateCartBadge = function() { var b = document.getElementById('cartBadge'); if (b) b.textContent = window.cart.length; };

  window.addToCart = function(pid) {
    var p = null;
    for(var i=0; i<window.products.length; i++) {
        var pCheck = window.products[i];
        if((pCheck.id||'').toString() == pid.toString() || (pCheck.fbId||'').toString() == pid.toString()) { p = pCheck; break; }
    }
    if (p) { window.cart.push(p); window.saveCart(); window.showToast('Added to cart', 'success'); }
  };

  window.buyNow = function(pid) {
    var p = null;
    for(var i=0; i<window.products.length; i++) {
        var pCheck = window.products[i];
        if((pCheck.id||'').toString() == pid.toString() || (pCheck.fbId||'').toString() == pid.toString()) { p = pCheck; break; }
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
    var p = null;
    for(var i=0; i<window.products.length; i++) {
        var pCheck = window.products[i];
        if((pCheck.id||'').toString() == pid.toString() || (pCheck.fbId||'').toString() == pid.toString()) { p = pCheck; break; }
    }
    if (!p) {
        console.warn('Product not found:', pid);
        return;
    }
    
    currentQuickViewProduct = p;
    selectedSize = null;
    
    var imgs = (p.image||'').split(',');
    document.getElementById('qvImage').src = imgs[0] || '';
    
    var thumbHtml = '';
    if(imgs.length > 1 && imgs[1]) {
       for(var k=0; k<imgs.length; k++) {
           if(imgs[k]) thumbHtml += '<img src="'+imgs[k]+'" class="qv-thumb '+(k===0?'active':'')+'" onclick="document.getElementById(\'qvImage\').src=this.src; var th=document.querySelectorAll(\'.qv-thumb\'); for(var t=0;t<th.length;t++) th[t].classList.remove(\'active\'); this.classList.add(\'active\');">';
       }
    }
    var qvThumb = document.getElementById('qvThumbnails');
    if(qvThumb) qvThumb.innerHTML = thumbHtml;

    document.getElementById('qvBrand').textContent = p.brand || 'TN28';
    document.getElementById('qvName').textContent = p.name;
    document.getElementById('qvPrice').textContent = '₹' + p.price.toLocaleString();
    document.getElementById('qvDescription').textContent = p.description || 'Premium quality menswear from TN28.';
    
    var orig = document.getElementById('qvOriginal');
    if (orig) {
      orig.textContent = p.originalPrice ? '₹' + p.originalPrice.toLocaleString() : '';
      orig.style.display = p.originalPrice ? 'inline' : 'none';
    }

    var sizeContainer = document.getElementById('qvSizes');
    if (sizeContainer) {
      var sArr = [];
      try {
        if (Array.isArray(p.sizes)) {
          sArr = p.sizes;
        } else if (typeof p.sizes === 'string' && p.sizes.trim().length > 0) {
          // Handle both comma-separated and JSON string formats
          if (p.sizes.indexOf('[') !== -1) sArr = JSON.parse(p.sizes);
          else sArr = p.sizes.split(',').map(function(s){ return s.trim(); });
        }
      } catch(e) { sArr = []; }
      
      // Filter out any empty strings
      sArr = sArr.filter(function(s){ return s && s.toString().trim() !== ''; });

      if (sArr.length > 0) {
        sizeContainer.innerHTML = sArr.map(function(s) {
          return '<div class="size-option" onclick="window.selectSize(\''+s+'\', this)">' + s + '</div>';
        }).join('');
      } else {
        sizeContainer.innerHTML = '<div class="size-selected-msg" style="font-size:13px;color:#ef4444;font-weight:700;padding:5px;border:1px solid #ef4444;border-radius:4px;display:inline-block;">Standard Size (Free Size)</div>';
        window.selectedSize = 'Standard';
      }
    }

    var qvQty = document.getElementById('qvQty');
    if (qvQty) qvQty.value = 1;

    window.openModal('quickView');
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
    var c = document.getElementById('toastContainer'); if (!c) return;
    var e = document.createElement('div'); e.className = 'toast '+t;
    e.textContent = m; c.appendChild(e); setTimeout(function(){e.remove();}, 3000);
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
      var itemImg = (it.image||'').split(',')[0];
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
    var c = document.getElementById('dynamicOfferContainer');
    if (!c) return;
    if (!window.offers || window.offers.length === 0) {
      c.innerHTML = '';
      return;
    }
    
    var html = '<section class="section" style="background:#fefce8; padding:40px 0; margin-bottom: 30px;"><div class="container">';
    html += '<h2 style="text-align:center; margin-bottom: 30px; font-family:\'Playfair Display\', serif;">Active Offers</h2>';
    html += '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">';
    
    var activeOffers = window.offers.filter(function(o){ return o.active !== false; });
    
    for(var i=0; i<activeOffers.length; i++) {
        var o = activeOffers[i];
        html += '<div style="background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display:flex; flex-direction:column;">';
        if (o.image) {
            html += '<img src="'+o.image+'" style="width:100%; height:160px; object-fit:cover;" onerror="this.style.display=\'none\'">';
        } else {
            html += '<div style="width:100%; height:10px; background:var(--amazon-yellow);"></div>';
        }
        html += '<div style="padding: 20px; flex: 1; display:flex; flex-direction:column;">';
        html += '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">';
        html += '<h3 style="margin:0; font-size:18px; color:var(--navy);">'+o.title+'</h3>';
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
  };
})();