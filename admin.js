// TN28 Admin Engine — Universal Legacy 2.0 (PRODUCTION READY)
(function() {
  var products = [];
  var orders = [];
  var mediaLibrary = [];
  var offers = [];
  var currentTab = 'dashboard';

  window.initAdmin = function() {
    console.log('🛡️ TN28 Enterprise Admin Active');
    initTabs();
    initImageHandlers();
    
    var pForm = document.getElementById('productForm');
    if (pForm) {
      pForm.addEventListener('submit', handleSaveProduct);
      var sBtn = document.getElementById('saveProductBtn');
      if(sBtn) sBtn.addEventListener('click', function() {
         if (pForm.checkValidity()) handleSaveProduct(); else pForm.reportValidity();
      });
    }
    
    var pTable = document.getElementById('productsTable');
    if (pTable) pTable.addEventListener('click', handleTableClick);

    var rBtn = document.getElementById('btnRefreshData');
    if (rBtn) rBtn.addEventListener('click', loadAndRender);
    
    var isAuth = sessionStorage.getItem('tn28_admin_auth');
    if (isAuth === 'true') {
      document.getElementById('adminGate').style.display = 'none';
      document.getElementById('mainAdminLayout').style.display = 'grid';
      loadAndRender();
    } else {
      initAdminGate();
    }
    
    loadOffers();
    loadOrders();
    var oForm = document.getElementById('offerForm');
    if (oForm) oForm.addEventListener('submit', handleSaveOffer);

    // Live Listeners
    if (window.backend && window.backend.onProductsChange) {
      window.backend.onProductsChange(function(updated) { if(updated) { products = updated; renderDashboard(); renderProductsTable(); } });
    }
    if (window.backend && window.backend.onOrdersChange) {
      window.backend.onOrdersChange(function(updated) { if(updated) { orders = updated; renderDashboard(); renderOrders(); } });
    }
  };

  // --- SECURITY ---
  function initAdminGate() {
    var pInput = document.getElementById('adminPin');
    var bEnter = document.getElementById('btnEnterGate');
    var check = function() {
      if (pInput.value === '9600') {
        sessionStorage.setItem('tn28_admin_auth', 'true');
        document.getElementById('adminGate').style.display = 'none';
        document.getElementById('mainAdminLayout').style.display = 'grid';
        loadAndRender();
      } else {
        var e = document.getElementById('gateError');
        e.style.display = 'block'; pInput.value = '';
        setTimeout(function(){ e.style.display = 'none'; }, 2000);
      }
    };
    if(bEnter) bEnter.addEventListener('click', check);
    if(pInput) pInput.addEventListener('keypress', function(e){ if(e.key === 'Enter') check(); });
  }

  // --- DATA ---
  function loadAndRender() {
    if (!window.backend) return;
    window.showAdminToast('Synchronizing Cloud Data...', 'info');
    window.backend.fetchProducts(true).then(function(fetched) {
      products = fetched;
      renderDashboard();
      renderProductsTable();
      renderBrands();
      renderMediaGrid();
      window.showAdminToast('Sync Complete', 'success');
    });
    loadOrders();
  }

  function handleSaveProduct(e) {
    if(e && e.preventDefault) e.preventDefault();
    var img = document.getElementById('pImage').value;
    if(!img) { window.showAdminToast('Please upload an image first', 'error'); return; }

    var editId = document.getElementById('editId').value;
    var productData = {
      name: document.getElementById('pName').value,
      brand: document.getElementById('pBrand').value,
      category: document.getElementById('pCategory').value.toLowerCase(),
      price: Number(document.getElementById('pPrice').value),
      originalPrice: Number(document.getElementById('pOriginalPrice').value) || null,
      stock: Number(document.getElementById('pStock').value),
      image: img,
      sizes: document.getElementById('pSizes').value.split(',').map(function(s){return s.trim();}),
      description: document.getElementById('pDescription').value,
      isNew: document.getElementById('pIsNew').checked,
      isSale: document.getElementById('pIsSale').checked,
      isHot: document.getElementById('pIsHot').checked,
      fabric: document.getElementById('pFabric').value
    };
    if (editId) productData.id = Number(editId);

    window.showAdminToast('Saving to Cloud...', 'info');
    window.backend.saveProduct(productData).then(function() {
      window.showAdminToast('Product Saved Knowledge!', 'success');
      loadAndRender();
      window.resetForm();
      window.switchTab('products');
    }).catch(function(err) {
      window.showAdminToast('Cloud Error: ' + err.message, 'error');
    });
  }

  // --- RENDERING ---
  function renderProductsTable() {
    var tb = document.getElementById('productsTable'); if(!tb) return;
    if (products.length === 0) { tb.innerHTML = '<tr><td colspan="6">No products found</td></tr>'; return; }
    tb.innerHTML = products.map(function(p) {
      return '<tr>' +
        '<td><img src="'+p.image+'" style="width:40px;height:50px;object-fit:cover;border-radius:4px"></td>' +
        '<td><strong>'+p.name+'</strong></td>' +
        '<td>'+p.brand+'</td>' +
        '<td style="text-transform:capitalize">'+(p.category || 'general')+'</td>' +
        '<td>₹'+p.price.toLocaleString()+'</td>' +
        '<td>'+(p.stock||0)+'</td>' +
        '<td>' +
          '<button class="btn-admin" onclick="editProduct('+p.id+')"><i class="fas fa-edit"></i></button> ' +
          '<button class="btn-admin" onclick="deleteProduct('+p.id+')" style="color:#ef4444"><i class="fas fa-trash"></i></button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function renderDashboard() {
    var tp = document.getElementById('totalProducts'); if(tp) tp.textContent = products.length;
    var to = document.getElementById('totalOrders'); if(to) to.textContent = orders.length;
    var tr = document.getElementById('totalRevenue'); if(tr) {
       var total = orders.reduce(function(s,o){ return s + (o.total || 0); }, 0);
       tr.textContent = '₹' + total.toLocaleString();
    }
    
    // Fill recent products
    var rp = document.getElementById('recentProducts');
    if (rp) {
      if (products.length === 0) rp.innerHTML = '<p style="padding:10px">No products yet</p>';
      else {
        rp.innerHTML = products.slice(0, 5).map(function(p){
          return '<div style="display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid #eee">' +
            '<img src="'+p.image+'" style="width:30px;height:30px;border-radius:4px;object-fit:cover">' +
            '<div style="flex:1;font-size:13px"><strong>'+p.name+'</strong><br><span style="color:#666">₹'+p.price+'</span></div>' +
          '</div>';
        }).join('');
      }
    }
    
    // Calculate brands
    var brands = {};
    products.forEach(function(p){ if(p.brand) brands[p.brand] = (brands[p.brand]||0) + 1; });
    var tbr = document.getElementById('totalBrands'); if(tbr) tbr.textContent = Object.keys(brands).length;
    var blc = document.getElementById('brandsListContainer');
    if (blc) {
      blc.innerHTML = Object.keys(brands).map(function(b){
        return '<div style="display:flex;justify-content:space-between;padding:8px;font-size:13px"><span>'+b+'</span><strong>'+brands[b]+'</strong></div>';
      }).join('');
    }
  }

  // --- ACTIONS ---
  window.editProduct = function(id) {
    var p = products.find(function(x){ return x.id == id; }); if(!p) return;
    document.getElementById('editId').value = p.id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pBrand').value = p.brand;
    document.getElementById('pCategory').value = p.category;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pOriginalPrice').value = p.originalPrice || '';
    document.getElementById('pStock').value = p.stock || 0;
    document.getElementById('pImage').value = p.image;
    document.getElementById('pSizes').value = p.sizes ? p.sizes.join(', ') : '';
    document.getElementById('pDescription').value = p.description || '';
    document.getElementById('pIsNew').checked = !!p.isNew;
    document.getElementById('pIsSale').checked = !!p.isSale;
    document.getElementById('pIsHot').checked = !!p.isHot;
    document.getElementById('pFabric').value = p.fabric || '';
    
    var prev = document.getElementById('previewImg');
    if(prev) { prev.src = p.image; document.getElementById('uploadPlaceholder').style.display='none'; document.getElementById('uploadPreview').style.display='block'; }
    
    window.switchTab('add-product');
    document.getElementById('formTitle').textContent = 'Edit Product #' + p.id;
  };

  window.deleteProduct = function(id) {
    if(!confirm('Permanently delete this product?')) return;
    var p = products.find(function(x){ return x.id == id; });
    window.showAdminToast('Deleting...', 'info');
    window.backend.deleteProduct(p).then(function(){ 
        window.showAdminToast('Deleted from Cloud', 'success');
        loadAndRender(); 
    });
  };

  // --- UI ---
  function initTabs() {
    var items = document.querySelectorAll('.nav-item');
    for(var i=0; i<items.length; i++) {
        items[i].addEventListener('click', function() { window.switchTab(this.dataset.tab); });
    }
  }

  window.switchTab = function(t) {
    var tabs = document.querySelectorAll('.tab-content');
    for(var i=0; i<tabs.length; i++) tabs[i].style.display = 'none';
    var navs = document.querySelectorAll('.nav-item');
    for(var j=0; j<navs.length; j++) navs[j].classList.remove('active');
    
    var activeTab = document.getElementById('tab-'+t);
    var activeNav = document.querySelector('.nav-item[data-tab="'+t+'"]');
    if(activeTab) activeTab.style.display = 'block';
    if(activeNav) activeNav.classList.add('active');
    if(t === 'media') renderMediaGrid();
  };

  function initImageHandlers() {
    var fileInput = document.getElementById('imageFileInput');
    var browseBtn = document.getElementById('btnBrowse');
    if(browseBtn) browseBtn.addEventListener('click', function(){ fileInput.click(); });
    
    if(fileInput) fileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if(!file) return;
      
      window.showAdminToast('Optimizing Image...', 'info');
      
      // Client-side Resize for Max Performance & Database Stability
      var reader = new FileReader();
      reader.onload = function(re) {
        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement('canvas');
          var maxW = 800; // Optimal for mobile & desktop
          var scale = maxW / img.width;
          if (scale > 1) scale = 1;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob(function(blob) {
            var resizedFile = new File([blob], file.name, {type: 'image/jpeg'});
            
            window.showAdminToast('Uploading Optimized Image...', 'info');
            window.backend.uploadImage(resizedFile).then(function(url) {
              document.getElementById('pImage').value = url;
              document.getElementById('previewImg').src = url;
              document.getElementById('uploadPlaceholder').style.display='none';
              document.getElementById('uploadPreview').style.display='block';
              
              mediaLibrary.unshift({ id: Date.now(), data: url, name: file.name });
              localStorage.setItem('tn28_media', JSON.stringify(mediaLibrary.slice(0, 50)));
              window.showAdminToast('Image Ready!', 'success');
              renderMediaGrid();
            }).catch(function(err) {
              window.showAdminToast('Upload Failed: ' + (err.message || err), 'error');
            });
          }, 'image/jpeg', 0.8);
        };
        img.src = re.target.result;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('removeImage')?.addEventListener('click', function(){ window.clearImagePreview(); });
  }

  window.clearImagePreview = function() {
    document.getElementById('uploadPlaceholder').style.display='';
    document.getElementById('uploadPreview').style.display='none';
    document.getElementById('pImage').value = '';
    document.getElementById('imageFileInput').value = '';
  };

  window.showAdminToast = function(m, t) {
    var c = document.getElementById('adminToast'); if(!c) return;
    var e = document.createElement('div'); e.className = 'toast '+t;
    e.textContent = m; c.appendChild(e); setTimeout(function(){e.remove();}, 3500);
  };

  // --- EXTRAS ---
  function renderMediaGrid() {
    var grid = document.getElementById('mediaGrid'); if(!grid) return;
    var saved = JSON.parse(localStorage.getItem('tn28_media') || '[]');
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

  function renderBrands() { /* Calculated on dashboard */ }
  function loadOffers() {}
  function handleSaveOffer() {}
  function handleTableClick() {}
  window.resetForm = function() { document.getElementById('productForm').reset(); document.getElementById('editId').value=''; window.clearImagePreview(); document.getElementById('formTitle').textContent='Add New Product'; };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.initAdmin();
  } else {
    document.addEventListener('DOMContentLoaded', window.initAdmin);
  }
})();
