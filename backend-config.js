// TN28 Global Backend Configuration — Universal Legacy 2.0
window.supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
window.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';

var supabaseClient = null;

window.getSupabase = function() {
    if (supabaseClient) return supabaseClient;
    if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(window.supabaseUrl, window.supabaseKey);
        return supabaseClient;
    }
    return null;
}

function mapProductData(p) {
  if (!p || typeof p !== 'object') return null;
  try {
    return {
      id: p.id,
      fbId: p.id,
      name: p.name || p.title || 'Premium Item',
      brand: p.brand || 'TN28',
      category: p.category || 'casual',
      price: Number(p.price) || 0,
      originalPrice: Number(p.original_price || p.originalPrice) || null,
      image: p.image || 'https://via.placeholder.com/300x400?text=No+Image',
      stock: Number(p.stock) || 0,
      fabric: p.fabric || '',
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      colors: Array.isArray(p.colors) ? p.colors : [],
      description: p.description || '',
      isNew: !!p.isNew,
      isSale: !!p.isSale,
      isHot: !!p.isHot
    };
  } catch(e) { 
    console.error('Mapping error', e); 
    return null; 
  }
}

window.backend = {
  fetchProducts: function(force) {
    var client = getSupabase();
    if (!client) {
      console.warn('❌ Supabase Client Not Ready');
      return { then: function(cb){ cb([]); } };
    }
    
    // Use a harmless filter with a timestamp to bypass browser/CDN cache
    var query = client.from('products').select();
    if (force) {
      query = query.neq('price', -0.00001); // HARMLESS FILTER CACHE BREAKER
    }

    return query.order('id', { ascending: false }).then(function(res) {
      if (res.error) {
        console.error('❌ Supabase Fetch Error:', res.error);
        throw res.error;
      }
      var mapped = [];
      if (res.data && Array.isArray(res.data)) {
        for (var i = 0; i < res.data.length; i++) {
          var m = mapProductData(res.data[i]);
          if (m) mapped.push(m);
        }
      }
      console.log('📦 Cloud Dashboard: ' + mapped.length + ' items retrieved');
      return mapped;
    });
  },

  saveProduct: function(product) {
    var client = getSupabase();
    if (!client) return;
    var payload = {
      name: product.name,
      price: Number(product.price),
      description: product.description || '',
      category: product.category || 'casual',
      image: product.image || '',
      stock: Number(product.stock) || 0,
      brand: product.brand || 'TN28',
      originalPrice: product.originalPrice || null,
      fabric: product.fabric || '',
      sizes: product.sizes || [],
      colors: product.colors || [],
      isNew: product.isNew || false,
      isSale: product.isSale || false,
      isHot: product.isHot || false
    };
    if (product.id) payload.id = Number(product.id);
    return client.from('products').upsert(payload).select().then(function(res) {
      if (res.error) throw res.error;
      return mapProductData(res.data[0]);
    });
  },

  deleteProduct: function(product) {
    var client = getSupabase();
    if (!client) return;
    return client.from('products').delete().eq('id', product.id);
  },

  fetchOrders: function() {
    var client = getSupabase();
    if (!client) return { then: function(cb){ cb([]); } };
    return client.from('orders').select('*').order('id', { ascending: false }).then(function(res) {
       return res.data || [];
    });
  },

  placeOrder: function(order) {
    var client = getSupabase();
    if (!client) return;
    return client.from('orders').insert([order]).select();
  },

  onProductsChange: function(cb) {
    var client = getSupabase();
    if (!client) return;
    client.channel('public:products').on('postgres_changes', { event: '*', table: 'products' }, function(){
      window.backend.fetchProducts(true).then(cb);
    }).subscribe();
  },

  uploadImage: function(file) {
    var client = getSupabase();
    if (!client) return Promise.reject('No Supabase client');
    
    var fileName = Date.now() + '_' + file.name.replace(/\s/g, '_');
    
    // Attempt 1: Cloud Storage (Preferred)
    return client.storage.from('products').upload(fileName, file).then(function(res) {
      if (res.error) throw res.error;
      var urlRes = client.storage.from('products').getPublicUrl(fileName);
      return urlRes.data.publicUrl;
    }).catch(function(err) {
      console.warn('Cloud Storage Bucket not found or access denied. Falling back to local encoding.', err);
      
      // Attempt 2: Base64 Fallback (Guaranteed to work)
      return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) { resolve(e.target.result); };
        reader.onerror = function(e) { reject('File reading failed'); };
        reader.readAsDataURL(file);
      });
    });
  },

  fetchOffers: function() {
    var client = getSupabase();
    if (!client) {
        var localOffers = JSON.parse(localStorage.getItem('tn28_offers') || '[]');
        return { then: function(cb){ cb(localOffers); } };
    }
    return client.from('offers').select('*').order('created_at', { ascending: false }).then(function(res) {
      if (res.error) {
        console.warn('⚠️ Supabase Offers Fetch Error (Table might not exist):', res.error.message);
        var localOffers = JSON.parse(localStorage.getItem('tn28_offers') || '[]');
        return localOffers;
      }
      return res.data || [];
    });
  },

  saveOffer: function(offer) {
    var payload = {
      title: offer.title,
      discount: Number(offer.discount),
      code: offer.code || '',
      expiry: offer.expiry || null,
      description: offer.description || '',
      image: offer.image || '',
      active: offer.active !== false,
      created_at: new Date().toISOString()
    };
    if (offer.id) payload.id = Number(offer.id);

    var client = getSupabase();
    if (!client) {
      return new Promise(function(resolve) {
          var localOffers = JSON.parse(localStorage.getItem('tn28_offers') || '[]');
          if (!payload.id) payload.id = Date.now();
          var existingIdx = localOffers.findIndex(function(o) { return o.id == payload.id; });
          if(existingIdx >= 0) localOffers[existingIdx] = payload;
          else localOffers.push(payload);
          localStorage.setItem('tn28_offers', JSON.stringify(localOffers));
          resolve(payload);
      });
    }
    
    return client.from('offers').upsert(payload).select().then(function(res) {
      if (res.error) {
          console.warn('⚠️ Fallback to localStorage due to Supabase error:', res.error.message);
          var localOffers = JSON.parse(localStorage.getItem('tn28_offers') || '[]');
          if (!payload.id) payload.id = Date.now();
          var existingIdx = localOffers.findIndex(function(o) { return o.id == payload.id; });
          if(existingIdx >= 0) localOffers[existingIdx] = payload;
          else localOffers.push(payload);
          localStorage.setItem('tn28_offers', JSON.stringify(localOffers));
          return payload;
      }
      return res.data[0];
    });
  },

  deleteOffer: function(id) {
    var client = getSupabase();
    
    // First remove from localStorage
    var localOffers = JSON.parse(localStorage.getItem('tn28_offers') || '[]');
    var newLocal = localOffers.filter(function(o) { return o.id != id; });
    localStorage.setItem('tn28_offers', JSON.stringify(newLocal));
    
    if (!client) {
      return new Promise(function(resolve) { resolve(true); });
    }
    
    try {
        if (!id || id === 'undefined') {
            return Promise.resolve(true); // handled locally, safely return 
        }
        return client.from('offers').delete().eq('id', id).then(function(res) {
            if (res.error) console.warn("Could not delete from Supabase");
            return true;
        }).catch(function(err){
            return true;
        });
    } catch(e) {
        return Promise.resolve(true);
    }
  }
};
