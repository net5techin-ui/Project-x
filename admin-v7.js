(function() {
  var products = [];
  var orders = [];
  var offers = [];
  var mediaLibrary = [];
  var currentFilter = 'all';

  
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
    var cur = el;
    while (cur && cur !== document.body) {
        if (cur.matches && cur.matches(selector)) return cur;
        if (cur.msMatchesSelector && cur.msMatchesSelector(selector)) return cur;
        if (cur.webkitMatchesSelector && cur.webkitMatchesSelector(selector)) return cur;
        cur = cur.parentElement;
    }
    return null;
  };

  // --- UTILITY: Robust Image Splitting (Handles Base64 + Multiple URLs) ---
  window.safeSplitImages = function(imageStr) {
    if (!imageStr) return [];
    if (typeof imageStr !== 'string') return [imageStr];
    var parts = imageStr.split(',');
    var finalParts = [];
    for (var i = 0; i < parts.length; i++) {
        var p = parts[i].trim();
        if (p.startsWith('data:') && p.indexOf(';base64') !== -1 && i < parts.length - 1) {
            finalParts.push(p + ',' + parts[i+1].trim());
            i++; 
        } else if (p) {
            finalParts.push(p);
        }
    }
    return finalParts;
  };

  window.initAdmin = function() {
    console.log('🛡️ TN28 Admin Engine v11.0 Initialized');
    checkSecurity();

    // Hook up PIN Entry
    var gateBtn = document.getElementById('btnEnterGate');
    if (gateBtn) {
      gateBtn.addEventListener('click', window.verifyPIN);
    }
    var pinInput = document.getElementById('adminPin');
    if (pinInput) {
      pinInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') window.verifyPIN();
      });
    }

    // Bind all 4 file inputs to their corresponding URL fields
    var fileSlots = [
      { fileId: 'imageFileInput',  urlId: 'pImageUrl' },
      { fileId: 'imageFileInput2', urlId: 'pImageUrl2' },
      { fileId: 'imageFileInput3', urlId: 'pImageUrl3' },
      { fileId: 'imageFileInput4', urlId: 'pImageUrl4' }
    ];

    fileSlots.forEach(function(slot) {
      var fileEl = document.getElementById(slot.fileId);
      if (fileEl) {
        fileEl.addEventListener('change', function() {
          window.handleImageUploadToSlot(this, slot.urlId);
        });
      }
    });

    // Bind live preview refresh when any URL input changes
    ['pImageUrl','pImageUrl2','pImageUrl3','pImageUrl4'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', window.refreshImagePreviews);
        el.addEventListener('change', window.refreshImagePreviews);
      }
    });

    var btnSync = document.getElementById('btnRefreshData');
    if (btnSync) {
        btnSync.addEventListener('click', function() {
            window.showToast('Synchronizing...', 'info');
            loadProducts();
            loadOrders();
        });
    }
    
    // Clear Digital Assets Library on startup (user requested)
    localStorage.removeItem('tn28_media');

    // Auto-refresh data every 30 seconds
    setInterval(function(){
      if(sessionStorage.getItem('tn28_admin_auth') === 'true') {
        loadProducts();
        loadOrders();
        loadOffers();
      }
    }, 30000);
  };

  function checkSecurity() {
    var auth = sessionStorage.getItem('tn28_admin_auth');
    if (auth === 'true') {
      var gate = document.getElementById('adminGate');
      var layout = document.getElementById('mainAdminLayout');
      if (gate) gate.style.display = 'none';
      if (layout) layout.style.display = 'grid';
      loadProducts();
      loadOrders();
      loadOffers();
      loadMedia();
    }
  }

  window.verifyPIN = function() {
    var pInput = document.getElementById('adminPin');
    if (pInput.value === '9600') {
      sessionStorage.setItem('tn28_admin_auth', 'true');
      checkSecurity();
    } else {
      var err = document.getElementById('gateError');
      if (err) {
        err.style.display = 'block';
        setTimeout(function(){ err.style.display='none'; }, 2000);
      }
    }
  };

  window.switchTab = function(tabId) {
    var tabs = document.querySelectorAll('.tab-content');
    // Using [data-tab] attribute for nav items
    var navs = document.querySelectorAll('.nav-item');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
    for (var j = 0; j < navs.length; j++) navs[j].classList.remove('active');

    var target = document.getElementById('tab-' + tabId);
    if(target) target.classList.add('active');
    
    var nav = document.querySelector('[data-tab="'+tabId+'"]');
    if(nav) nav.classList.add('active');

    var titleMap = {
      'dashboard': 'Dashboard',
      'products': 'All Products',
      'add-product': 'Product Management',
      'orders': 'Customer Orders',
      'media': 'Media Library',
      'offers': 'Promotion Offers'
    };
    var pt = document.getElementById('pageTitle');
    if(pt && titleMap[tabId]) pt.textContent = titleMap[tabId];

    if(tabId === 'add-product') window.resetForm();
    if(tabId === 'add-offer') window.resetOfferForm();
  };

  function loadProducts() {
    if(!window.backend) {
      console.warn('⚠️ Warning: Backend controller not found yet.');
      return;
    }
    window.backend.fetchProducts(true).then(function(fetched){
      products = fetched || [];
      renderProducts();
      renderDashboard();
      console.log('✅ Dashboard synced: ' + products.length + ' products');
    }).catch(function(err) {
      console.error('❌ Data sync failed:', err);
      window.showToast('Sync Failed: Check connection', 'error');
    });
  }

  function renderDashboard() {
    var tp = document.getElementById('totalProducts'); if(tp) tp.textContent = products.length;
    var to = document.getElementById('totalOrders'); if(to) to.textContent = orders.length;
    
    var rev = 0;
    for(var i=0; i<orders.length; i++) rev += (orders[i].total || 0);
    var sr = document.getElementById('totalRevenue'); if(sr) sr.textContent = '₹' + rev.toLocaleString();
    
    var brands = {};
    for(var j=0; j<products.length; j++) { if(products[j].brand) brands[products[j].brand] = true; }
    var sb = document.getElementById('totalBrands'); if(sb) sb.textContent = Object.keys(brands).length;

    // Recent Products
    var recent = products.slice(0, 5);
    var rCont = document.getElementById('recentProducts');
    if(rCont) {
      rCont.innerHTML = recent.map(function(p){
        return '<div class="brand-item" style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee"><span>'+p.name+'</span><span class="brand-count" style="font-weight:700">₹'+p.price+'</span></div>';
      }).join('');
    }

    // Brands List
    var bCont = document.getElementById('brandsListContainer');
    if(bCont) {
      bCont.innerHTML = Object.keys(brands).map(function(b){
        return '<div class="brand-item" style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee"><span>'+b+'</span><i class="fas fa-check-circle" style="color:var(--success)"></i></div>';
      }).join('');
    }
  }

  window.filterAdminProducts = function(type, btn) {
    currentFilter = type;
    var btns = document.querySelectorAll('.filter-pill');
    for(var i=0; i<btns.length; i++) btns[i].classList.remove('active');
    if(btn) btn.classList.add('active');
    renderProducts();
  };

  function renderProducts() {
    var container = document.getElementById('productsTable');
    if(!container) return;
    
    var filtered = products;
    if (currentFilter !== 'all') {
        filtered = products.filter(function(p) {
            var n = (p.name || '').toLowerCase();
            var c = (p.category || '').toLowerCase();
            return n.indexOf(currentFilter) !== -1 || c.indexOf(currentFilter) !== -1;
        });
    }

    if (filtered.length === 0) {
      container.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#666">No products found matching "'+currentFilter+'".</td></tr>';
      return;
    }

    container.innerHTML = filtered.map(function(p) {
      var pid = p.id || p.fbId;
      var imageParts = window.safeSplitImages(p.image);
      return '<tr>' +
        '<td><img src="'+(imageParts[0] || '')+'" onerror="this.src=\'https://via.placeholder.com/40\'" style="width:40px;height:50px;object-fit:cover;border-radius:4px"></td>' +
        '<td>'+p.name+'</td>' +
        '<td>'+(p.brand||'TN28')+'</td>' +
        '<td>'+p.category+'</td>' +
        '<td>₹'+(Number(p.price)||0).toLocaleString()+'</td>' +
        '<td>'+(p.stock||0)+'</td>' +
        '<td>' +
          '<div class="table-actions">' +
            '<button class="btn-edit" onclick="window.editProduct(\''+pid+'\')"><i class="fas fa-edit"></i></button>' +
            '<button class="btn-delete" onclick="window.deleteProduct(\''+pid+'\')"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  window.handleSaveProduct = function(event) {
    if (event && event.preventDefault) event.preventDefault();
    
    var img1 = document.getElementById('pImageUrl').value.trim() || document.getElementById('pImage').value;
    var el2 = document.getElementById('pImageUrl2');
    var el3 = document.getElementById('pImageUrl3');
    var el4 = document.getElementById('pImageUrl4');
    var img2 = el2 ? el2.value.trim() : '';
    var img3 = el3 ? el3.value.trim() : '';
    var img4 = el4 ? el4.value.trim() : '';
    var imgStr = [img1, img2, img3, img4].filter(Boolean).join(',');

    var p = {
      id: document.getElementById('editId').value,
      name: document.getElementById('pName').value,
      brand: document.getElementById('pBrand').value,
      category: document.getElementById('pCategory').value,
      price: document.getElementById('pPrice').value,
      originalPrice: document.getElementById('pOriginalPrice').value,
      stock: document.getElementById('pStock').value,
      fabric: document.getElementById('pFabric').value,
      description: document.getElementById('pDescription').value,
      image: imgStr,
      sizes: document.getElementById('pSizes').value.split(',').map(function(s){return s.trim();}).filter(Boolean),
      colors: document.getElementById('pColors').value.split(',').map(function(s){return s.trim();}).filter(Boolean),
      isNew: document.getElementById('pIsNew').checked,
      isSale: document.getElementById('pIsSale').checked,
      isHot: document.getElementById('pIsHot').checked
    };

    if(!p.name || !p.price) { window.showToast('Name and Price required', 'error'); return; }

    window.backend.saveProduct(p).then(function(){
      window.showToast('Product Saved Successfully', 'success');
      loadProducts();
      window.switchTab('products');
    }).catch(function(err){ 
      console.error('Save failed:', err);
      // Added high-visibility alert for debugging
      alert('❌ FAILED TO SAVE: ' + (err.message || JSON.stringify(err)));
      window.showToast('Save failed: ' + (err.message || 'Check console'), 'error'); 
    });
  };

  window.editProduct = function(id) {
    var p = products.find(function(x){ return x.id == id; });
    if(!p) return;
    
    // IMPORTANT: Switch tab FIRST because switchTab calls resetForm() which clears inputs
    window.switchTab('add-product');
    document.getElementById('formTitle').textContent = 'Edit Product';
    
    document.getElementById('editId').value = p.id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pBrand').value = p.brand || '';
    document.getElementById('pCategory').value = p.category;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pOriginalPrice').value = p.originalPrice || '';
    document.getElementById('pStock').value = p.stock || '';
    document.getElementById('pFabric').value = p.fabric || '';
    document.getElementById('pDescription').value = p.description || '';
    
    var imgs = window.safeSplitImages(p.image);
    document.getElementById('pImage').value = imgs[0] || '';
    var el1 = document.getElementById('pImageUrl'); if(el1) el1.value = imgs[0] || '';
    var el2 = document.getElementById('pImageUrl2'); if(el2) el2.value = imgs[1] || '';
    var el3 = document.getElementById('pImageUrl3'); if(el3) el3.value = imgs[2] || '';
    var el4 = document.getElementById('pImageUrl4'); if(el4) el4.value = imgs[3] || '';
    
    // Support both string and array formats for sizes/colors
    var sz = p.sizes || [];
    document.getElementById('pSizes').value = Array.isArray(sz) ? sz.join(', ') : sz;
    var cl = p.colors || [];
    document.getElementById('pColors').value = Array.isArray(cl) ? cl.join(', ') : cl;
    
    document.getElementById('pIsNew').checked = p.isNew;
    document.getElementById('pIsSale').checked = p.isSale;
    document.getElementById('pIsHot').checked = p.isHot;
    
    if(imgs[0]) {
       window.refreshImagePreviews();
    }
  };

  window.deleteProduct = function(id) {
    if(!confirm('Are you sure you want to delete this product?')) return;
    window.backend.deleteProduct({id: id}).then(function(){
      window.showToast('Product Deleted', 'info');
      loadProducts();
    });
  };

  window.handleImageUploadToSlot = function(input, targetUrlId) {
    var file = input.files[0];
    if(!file) return;
    
    window.showToast('Optimizing image...', 'info');

    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var MAX_WIDTH = 800;
            var MAX_HEIGHT = 1000;
            var width = img.width;
            var height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            var dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            // Set the URL field value to the base64 string
            var targetInput = document.getElementById(targetUrlId);
            if (targetInput) {
                targetInput.value = dataUrl;
                // Trigger preview refresh
                window.refreshImagePreviews();
                window.showToast('Image uploaded and optimized', 'success');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.refreshImagePreviews = function() {
    var gallery = document.getElementById('imagePreviewGallery');
    var strip = document.getElementById('imagePreviewStrip');
    if (!gallery || !strip) return;

    var urls = [
      document.getElementById('pImageUrl').value.trim(),
      document.getElementById('pImageUrl2').value.trim(),
      document.getElementById('pImageUrl3').value.trim(),
      document.getElementById('pImageUrl4').value.trim()
    ].filter(Boolean);

    if (urls.length === 0) {
      gallery.style.display = 'none';
      return;
    }

    gallery.style.display = 'block';
    strip.innerHTML = urls.map(function(url, index) {
      return '<div style="position:relative;aspect-ratio:3/4;background:#fff;border-radius:6px;overflow:hidden;border:1px solid #E2E8F0;">' +
             '<img src="'+url+'" style="width:100%;height:100%;object-fit:cover;">' +
             '<span style="position:absolute;top:4px;left:4px;background:rgba(15,23,42,0.8);color:white;font-size:10px;padding:2px 6px;border-radius:4px;">#'+(index+1)+'</span>' +
             '</div>';
    }).join('');
  };

  window.showToast = function(msg, type) {
    var container = document.getElementById('adminToast');
    if(!container) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (type||'info');
    t.innerHTML = (type==='success'?'<i class="fas fa-check-circle"></i>':(type==='error'?'<i class="fas fa-exclamation-circle"></i>':'<i class="fas fa-info-circle"></i>')) + ' <span>'+msg+'</span>';
    container.appendChild(t);
    setTimeout(function(){ t.remove(); }, 3000);
  };

  function saveToMedia(url) {
    var saved = JSON.parse(localStorage.getItem('tn28_media') || '[]');
    saved.unshift({id: Date.now(), data: url});
    localStorage.setItem('tn28_media', JSON.stringify(saved.slice(0, 50)));
    loadMedia();
  }

  function loadMedia() {
    var saved = JSON.parse(localStorage.getItem('tn28_media') || '[]');
    var grid = document.getElementById('mediaGrid'); if(!grid) return;
    mediaLibrary = saved;
    if(saved.length === 0) { document.getElementById('mediaEmpty').style.display='block'; grid.innerHTML=''; return; }
    document.getElementById('mediaEmpty').style.display='none';
    grid.innerHTML = saved.map(function(m) {
      return '<div class="media-item"><img src="'+m.data+'" onclick="useMediaAsset(\''+m.data+'\')"></div>';
    }).join('');
  }

  window.useMediaAsset = function(data) {
    document.getElementById('pImage').value = data;
    document.getElementById('previewImg').src = data;
    document.getElementById('uploadPlaceholder').style.display='none';
    document.getElementById('uploadPreview').style.display='block';
    window.switchTab('add-product');
  };

  function loadOrders() {
    if(!window.backend) return;
    window.backend.fetchOrders().then(function(fetched){ orders = fetched; renderOrders(); renderDashboard(); });
  }

  function renderOrders() {
    var container = document.getElementById('ordersListContainer'); if(!container) return;
    if(orders.length === 0) { document.getElementById('ordersListEmpty').style.display='block'; container.innerHTML=''; return; }
    document.getElementById('ordersListEmpty').style.display='none';
    container.innerHTML = orders.map(function(o) {
      return '<div class="order-card">' +
        '<h4>Order #'+(o.orderId || o.id)+'</h4>' +
        '<p>Customer: '+(o.customer?o.customer.name:'N/A')+'</p>' +
        '<p>Total: ₹'+(o.total || 0).toLocaleString()+'</p>' +
        '<p>Status: '+(o.status || 'pending')+'</p>' +
      '</div>';
    }).join('');
  }

  function loadOffers() {
    if(!window.backend || !window.backend.fetchOffers) return;
    window.backend.fetchOffers().then(function(fetched){
      offers = fetched;
      renderOffers();
    });
  }

  function renderOffers() {
    var container = document.getElementById('offersTableBody');
    if(!container) return;
    container.innerHTML = offers.map(function(o) {
      return '<tr>' +
        '<td>'+o.title+'</td>' +
        '<td>'+o.discount+'%</td>' +
        '<td>'+(o.code||'N/A')+'</td>' +
        '<td>'+(o.expiry||'Infinite')+'</td>' +
        '<td><span class="badge '+(o.active?'success':'danger')+'">'+(o.active?'Active':'Paused')+'</span></td>' +
        '<td>' +
          '<div class="table-actions">' +
            '<button class="btn-edit" onclick="window.editOffer(\''+o.id+'\')"><i class="fas fa-edit"></i></button>' +
            '<button class="btn-delete" onclick="window.deleteOffer(\''+o.id+'\')"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  window.handleSaveOffer = function(event) {
    if (event && event.preventDefault) event.preventDefault();
    var idEl = document.getElementById('editOfferId');
    var o = {
      id: idEl ? idEl.value : '',
      title: document.getElementById('offerTitle').value,
      discount: document.getElementById('offerDiscount').value,
      code: document.getElementById('offerCode').value,
      expiry: document.getElementById('offerExpiry').value,
      description: document.getElementById('offerDescription').value,
      image: document.getElementById('offerImage').value,
      active: document.getElementById('offerActive').checked
    };

    if(!o.title || !o.discount) { window.showToast('Title and Discount required', 'error'); return; }

    window.backend.saveOffer(o).then(function(){
      window.showToast('Offer Saved Successfully', 'success');
      loadOffers();
      window.switchTab('offers');
      document.getElementById('offerFormCard').style.display = 'none';
    }).catch(function(err){ window.showToast('Save failed: ' + err.message, 'error'); });
  };

  window.editOffer = function(id) {
    var o = offers.find(function(x){ return x.id == id; });
    if(!o) return;
    document.getElementById('editOfferId').value = o.id;
    document.getElementById('offerTitle').value = o.title;
    document.getElementById('offerDiscount').value = o.discount;
    document.getElementById('offerCode').value = o.code || '';
    document.getElementById('offerExpiry').value = o.expiry || '';
    document.getElementById('offerDescription').value = o.description || '';
    document.getElementById('offerImage').value = o.image || '';
    document.getElementById('offerActive').checked = o.active !== false;
    
    document.getElementById('offerFormTitle').textContent = 'Edit Offer';
    document.getElementById('offerFormCard').style.display = 'block';
    window.switchTab('offers');
  };

  window.deleteOffer = function(id) {
    if(!confirm('Are you sure you want to delete this offer?')) return;
    window.backend.deleteOffer(id).then(function(){
      window.showToast('Offer Deleted', 'info');
      loadOffers();
    });
  };

  window.resetOfferForm = function() {
    document.getElementById('offerForm').reset();
    document.getElementById('editOfferId').value = '';
    document.getElementById('offerFormTitle').textContent = 'Create New Offer';
  };

  window.resetForm = function() { 
    document.getElementById('productForm').reset(); 
    document.getElementById('editId').value=''; 
    window.clearImagePreview(); 
    var el1 = document.getElementById('pImageUrl'); if(el1) el1.value = '';
    var el2 = document.getElementById('pImageUrl2'); if(el2) el2.value = '';
    var el3 = document.getElementById('pImageUrl3'); if(el3) el3.value = '';
    var gal = document.getElementById('imagePreviewGallery'); if(gal) gal.style.display = 'none';
    document.getElementById('formTitle').textContent='Add New Product'; 
  };

  // Sidebar listeners
  document.addEventListener('click', function(e) {
    var nav = window.safeClosest(e.target, '.nav-item');
    if (nav && nav.hasAttribute('data-tab')) {
      e.preventDefault();
      window.switchTab(window.safeGetAttr(nav, 'data-tab'));
    }
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.initAdmin();
  } else {
    document.addEventListener('DOMContentLoaded', window.initAdmin);
  }
})();
