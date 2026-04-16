(function() {
  var products = [];
  var orders = [];
  var offers = [];
  var mediaLibrary = [];

  window.initAdmin = function() {
    console.log('🛡️ TN28 Admin Engine v7.0 Initialized');
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

    // Bind Image Upload
    var fileInput = document.getElementById('imageFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', function() {
        window.handleImageUpload(this);
      });
    }

    var btnBrowse = document.getElementById('btnBrowse');
    if (btnBrowse) {
      btnBrowse.addEventListener('click', function() {
        if (fileInput) fileInput.click();
      });
    }
    
    var btnRemove = document.getElementById('removeImage');
    if (btnRemove) {
        btnRemove.addEventListener('click', window.clearImagePreview);
    }

    // Bind URL Load
    var btnLoadUrl = document.getElementById('btnLoadUrl');
    var pImageUrl = document.getElementById('pImageUrl');
    if (btnLoadUrl && pImageUrl) {
      btnLoadUrl.addEventListener('click', function() {
          var url = pImageUrl.value.trim();
          if (url) {
              document.getElementById('pImage').value = url;
              document.getElementById('previewImg').src = url;
              document.getElementById('uploadPlaceholder').style.display = 'none';
              document.getElementById('uploadPreview').style.display = 'block';
              window.showToast('Image loaded from URL', 'success');
          }
      });
    }

    // Bind Media Library Button
    var btnMediaLib = document.getElementById('btnMediaLib');
    if (btnMediaLib) {
      btnMediaLib.addEventListener('click', function() {
          window.switchTab('media');
      });
    }

    // Bind Drag & Drop
    var dropzone = document.getElementById('uploadDropzone');
    if (dropzone) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
          dropzone.addEventListener(eventName, e => {
              e.preventDefault();
              e.stopPropagation();
          }, false);
      });

      ['dragenter', 'dragover'].forEach(eventName => {
          dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
          dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
      });

      dropzone.addEventListener('drop', e => {
          var dt = e.dataTransfer;
          var files = dt.files;
          if (files && files[0]) {
              window.handleImageUpload({ files: files });
          }
      }, false);
    }

    var btnSync = document.getElementById('btnRefreshData');
    if (btnSync) {
        btnSync.addEventListener('click', function() {
            window.showToast('Synchronizing...', 'info');
            loadProducts();
            loadOrders();
        });
    }
    
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

  function renderProducts() {
    var container = document.getElementById('productsTable');
    if(!container) return;
    
    if (!products || products.length === 0) {
      container.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#666">No products found in database.</td></tr>';
      return;
    }

    container.innerHTML = products.map(function(p) {
      var pid = p.id || '';
      return '<tr>' +
        '<td><img src="'+(p.image || '')+'" onerror="this.src=\'https://via.placeholder.com/40\'" style="width:40px;height:50px;object-fit:cover;border-radius:4px"></td>' +
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
      image: document.getElementById('pImage').value,
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
    document.getElementById('editId').value = p.id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pBrand').value = p.brand || '';
    document.getElementById('pCategory').value = p.category;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pOriginalPrice').value = p.originalPrice || '';
    document.getElementById('pStock').value = p.stock || '';
    document.getElementById('pFabric').value = p.fabric || '';
    document.getElementById('pDescription').value = p.description || '';
    document.getElementById('pImage').value = p.image;
    document.getElementById('pSizes').value = (p.sizes || []).join(', ');
    document.getElementById('pColors').value = (p.colors || []).join(', ');
    document.getElementById('pIsNew').checked = p.isNew;
    document.getElementById('pIsSale').checked = p.isSale;
    document.getElementById('pIsHot').checked = p.isHot;
    
    document.getElementById('formTitle').textContent = 'Edit Product';
    if(p.image) {
       document.getElementById('previewImg').src = p.image;
       document.getElementById('uploadPlaceholder').style.display = 'none';
       document.getElementById('uploadPreview').style.display = 'block';
    }
    window.switchTab('add-product');
  };

  window.deleteProduct = function(id) {
    if(!confirm('Are you sure you want to delete this product?')) return;
    window.backend.deleteProduct({id: id}).then(function(){
      window.showToast('Product Deleted', 'info');
      loadProducts();
    });
  };

  window.handleImageUpload = function(input) {
    var file = input.files[0];
    if(!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
        window.showToast('Optimizing large image...', 'info');
    } else {
        window.showToast('Processing image...', 'info');
    }

    // Client-side resizing logic
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
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get lower quality JPEG to save space
            var dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            // Now "upload" this optimized dataUrl
            // Convert back to file if we want to use backend.uploadImage or just use dataUrl
            // Since uploadImage has a Base64 fallback, we can just use the dataUrl directly if it fails storage
            
            // For now, let's try to pass the optimized file to uploadImage or just use it
            document.getElementById('pImage').value = dataUrl;
            document.getElementById('previewImg').src = dataUrl;
            document.getElementById('uploadPlaceholder').style.display='none';
            document.getElementById('uploadPreview').style.display='block';
            window.showToast('Image optimized successfully', 'success');
            saveToMedia(dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.clearImagePreview = function() {
    document.getElementById('uploadPlaceholder').style.display='block';
    document.getElementById('uploadPreview').style.display='none';
    document.getElementById('pImage').value = '';
    var input = document.getElementById('imageFileInput');
    if (input) input.value = '';
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
            '<button class="btn-edit" onclick="window.editOffer('+o.id+')"><i class="fas fa-edit"></i></button>' +
            '<button class="btn-delete" onclick="window.deleteOffer('+o.id+')"><i class="fas fa-trash"></i></button>' +
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
    document.getElementById('formTitle').textContent='Add New Product'; 
  };

  // Sidebar listeners
  document.addEventListener('click', function(e) {
    var nav = e.target.closest('.nav-item');
    if (nav && nav.hasAttribute('data-tab')) {
      e.preventDefault();
      window.switchTab(nav.getAttribute('data-tab'));
    }
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.initAdmin();
  } else {
    document.addEventListener('DOMContentLoaded', window.initAdmin);
  }
})();
