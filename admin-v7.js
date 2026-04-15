(function() {
  var products = [];
  var orders = [];
  var offers = [];
  var mediaLibrary = [];

  window.initAdmin = function() {
    console.log('🛡️ TN28 Admin Engine v7.0 Initialized');
    checkSecurity();
    
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
      document.getElementById('adminGate').style.display = 'none';
      document.getElementById('adminLayout').style.display = 'grid';
      loadProducts();
      loadOrders();
      loadOffers();
      loadMedia();
    }
  }

  window.verifyPIN = function() {
    var pInput = document.getElementById('adminPIN');
    if (pInput.value === '9600') {
      sessionStorage.setItem('tn28_admin_auth', 'true');
      checkSecurity();
    } else {
      var err = document.getElementById('gateError');
      err.style.display = 'block';
      setTimeout(function(){ err.style.display='none'; }, 2000);
    }
  };

  window.switchTab = function(tabId) {
    var tabs = document.querySelectorAll('.tab-content');
    var navs = document.querySelectorAll('.nav-item');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
    for (var j = 0; j < navs.length; j++) navs[j].classList.remove('active');

    var target = document.getElementById('tab-' + tabId);
    if(target) target.classList.add('active');
    
    var nav = document.querySelector('[onclick="window.switchTab(\''+tabId+'\')"]');
    if(nav) nav.classList.add('active');

    if(tabId === 'add-product') window.resetForm();
    if(tabId === 'add-offer') window.resetOfferForm();
  };

  function loadProducts() {
    if(!window.backend) return;
    window.backend.fetchProducts(true).then(function(fetched){
      products = fetched;
      renderProducts();
      renderDashboard();
    });
  }

  function renderDashboard() {
    document.getElementById('statTotalProducts').textContent = products.length;
    document.getElementById('statTotalOrders').textContent = orders.length;
    
    var rev = 0;
    for(var i=0; i<orders.length; i++) rev += (orders[i].total || 0);
    document.getElementById('statRevenue').textContent = '₹' + rev.toLocaleString();
    
    var brands = {};
    for(var j=0; j<products.length; j++) { if(products[j].brand) brands[products[j].brand] = true; }
    document.getElementById('statBrands').textContent = Object.keys(brands).length;

    // Recent Products
    var recent = products.slice(0, 5);
    var rCont = document.getElementById('recentProductsList');
    if(rCont) {
      rCont.innerHTML = recent.map(function(p){
        return '<div class="brand-item"><span>'+p.name+'</span><span class="brand-count">₹'+p.price+'</span></div>';
      }).join('');
    }

    // Brands List
    var bCont = document.getElementById('brandsList');
    if(bCont) {
      bCont.innerHTML = Object.keys(brands).map(function(b){
        return '<div class="brand-item"><span>'+b+'</span><i class="fas fa-check-circle" style="color:var(--success)"></i></div>';
      }).join('');
    }
  }

  function renderProducts() {
    var container = document.getElementById('productsTableBody');
    if(!container) return;
    container.innerHTML = products.map(function(p) {
      return '<tr>' +
        '<td><img src="'+p.image+'" style="width:40px;height:50px;object-fit:cover;border-radius:4px"></td>' +
        '<td>'+p.name+'</td>' +
        '<td>'+(p.brand||'TN28')+'</td>' +
        '<td>'+p.category+'</td>' +
        '<td>₹'+p.price+'</td>' +
        '<td>'+(p.stock||0)+'</td>' +
        '<td>' +
          '<div class="table-actions">' +
            '<button class="btn-edit" onclick="window.editProduct('+p.id+')"><i class="fas fa-edit"></i></button>' +
            '<button class="btn-delete" onclick="window.deleteProduct('+p.id+')"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  window.handleSaveProduct = function() {
    var p = {
      id: document.getElementById('editId').value,
      name: document.getElementById('pName').value,
      brand: document.getElementById('pBrand').value,
      category: document.getElementById('pCategory').value,
      price: document.getElementById('pPrice').value,
      stock: document.getElementById('pStock').value,
      description: document.getElementById('pDesc').value,
      image: document.getElementById('pImage').value,
      sizes: document.getElementById('pSizes').value.split(',').map(function(s){return s.trim();}),
      isNew: document.getElementById('pNew').checked,
      isSale: document.getElementById('pSale').checked,
      isHot: document.getElementById('pHot').checked
    };

    if(!p.name || !p.price) { window.showToast('Name and Price required', 'error'); return; }

    window.backend.saveProduct(p).then(function(){
      window.showToast('Product Saved Successfully', 'success');
      loadProducts();
      window.switchTab('products');
    }).catch(function(err){ window.showToast('Save failed: ' + err.message, 'error'); });
  };

  window.editProduct = function(id) {
    var p = products.find(function(x){ return x.id == id; });
    if(!p) return;
    document.getElementById('editId').value = p.id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pBrand').value = p.brand || '';
    document.getElementById('pCategory').value = p.category;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pStock').value = p.stock || '';
    document.getElementById('pDesc').value = p.description || '';
    document.getElementById('pImage').value = p.image;
    document.getElementById('pSizes').value = (p.sizes || []).join(', ');
    document.getElementById('pNew').checked = p.isNew;
    document.getElementById('pSale').checked = p.isSale;
    document.getElementById('pHot').checked = p.isHot;
    
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
    window.showToast('Uploading image...', 'info');
    window.backend.uploadImage(file).then(function(url){
      document.getElementById('pImage').value = url;
      document.getElementById('previewImg').src = url;
      document.getElementById('uploadPlaceholder').style.display='none';
      document.getElementById('uploadPreview').style.display='block';
      
      // Save to media library
      saveToMedia(url);
    }).catch(function(err){ window.showToast('Upload failed', 'error'); });
  };

  window.clearImagePreview = function() {
    document.getElementById('uploadPlaceholder').style.display='block';
    document.getElementById('uploadPreview').style.display='none';
    document.getElementById('pImage').value = '';
    document.getElementById('imageInput').value = '';
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

  window.handleSaveOffer = function() {
    var o = {
      id: document.getElementById('editOfferId').value,
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
    window.switchTab('add-offer');
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

  window.resetForm = function() { document.getElementById('productForm').reset(); document.getElementById('editId').value=''; window.clearImagePreview(); document.getElementById('formTitle').textContent='Add New Product'; };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.initAdmin();
  } else {
    document.addEventListener('DOMContentLoaded', window.initAdmin);
  }
})();
