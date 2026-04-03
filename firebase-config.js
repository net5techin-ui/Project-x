// ============================================
// TN28 Backend Architecture (Firebase + LocalStorage Fallback)
// ============================================
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, limit, where, onSnapshot } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Replace these values with your Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let db, auth, storage, app;
let isFirebaseEnabled = false;

// Initialize Firebase
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    isFirebaseEnabled = true;
    console.log("🔥 Firebase backend connected!");
  } catch (e) {
    console.error("Firebase init error, falling back to LocalStorage:", e);
  }
} else {
  console.log("📍 Firebase not configured. Using LocalStorage mode (Standalone).");
}

// =================== PRODUCT METHODS ===================

export async function fetchProducts() {
  if (isFirebaseEnabled) {
    const q = query(collection(db, "products"), orderBy("id", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ fbId: doc.id, ...doc.data() }));
  } else {
    const local = localStorage.getItem('tn28_products');
    return local ? JSON.parse(local) : [];
  }
}

export async function saveProduct(product) {
  if (isFirebaseEnabled) {
    if (product.fbId) {
      const { fbId, ...data } = product;
      await updateDoc(doc(db, "products", fbId), data);
      return product;
    } else {
      const docRef = await addDoc(collection(db, "products"), product);
      return { fbId: docRef.id, ...product };
    }
  } else {
    let products = JSON.parse(localStorage.getItem('tn28_products') || '[]');
    if (product.id && products.find(p => p.id === product.id)) {
      products = products.map(p => p.id === product.id ? product : p);
    } else {
      product.id = Date.now();
      products.push(product);
    }
    localStorage.setItem('tn28_products', JSON.stringify(products));
    return product;
  }
}

export async function deleteProduct(product) {
  if (isFirebaseEnabled && product.fbId) {
    await deleteDoc(doc(db, "products", product.fbId));
  } else {
    let productsList = JSON.parse(localStorage.getItem('tn28_products') || '[]');
    // Use loose inequality (!=) to handle cases where ID might be string vs number
    const newList = productsList.filter(p => p.id != product.id);
    localStorage.setItem('tn28_products', JSON.stringify(newList));
    // Manually trigger a storage event for the current window if needed
    // (Though normally 'storage' event only fires for other windows)
    window.dispatchEvent(new Event('storage'));
  }
}

// =================== MEDIA METHODS ===================

export async function uploadImage(file) {
  if (isFirebaseEnabled) {
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } else {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }
}

// =================== ORDER METHODS ===================

export async function placeOrder(order) {
  const orderData = {
    ...order,
    orderId: 'TN28-' + Date.now().toString(36).toUpperCase(),
    status: 'pending',
    timestamp: new Date().toISOString()
  };

  if (isFirebaseEnabled) {
    const docRef = await addDoc(collection(db, "orders"), orderData);
    return { fbId: docRef.id, ...orderData };
  } else {
    orderData.id = Date.now();
    let orders = JSON.parse(localStorage.getItem('tn28_orders') || '[]');
    orders.push(orderData);
    localStorage.setItem('tn28_orders', JSON.stringify(orders));
    return orderData;
  }
}

export async function fetchOrders() {
  if (isFirebaseEnabled) {
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ fbId: d.id, ...d.data() }));
  } else {
    const local = localStorage.getItem('tn28_orders');
    const orders = local ? JSON.parse(local) : [];
    return orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

export async function updateOrderStatus(order, newStatus) {
  if (isFirebaseEnabled && order.fbId) {
    await updateDoc(doc(db, "orders", order.fbId), { status: newStatus });
  } else {
    let orders = JSON.parse(localStorage.getItem('tn28_orders') || '[]');
    orders = orders.map(o => o.id === order.id ? { ...o, status: newStatus } : o);
    localStorage.setItem('tn28_orders', JSON.stringify(orders));
  }
}

export async function deleteOrder(order) {
  if (isFirebaseEnabled && order.fbId) {
    await deleteDoc(doc(db, "orders", order.fbId));
  } else {
    let orders = JSON.parse(localStorage.getItem('tn28_orders') || '[]');
    orders = orders.filter(o => o.id !== order.id);
    localStorage.setItem('tn28_orders', JSON.stringify(orders));
  }
}

export function onProductsChange(callback) {
  if (isFirebaseEnabled) {
    const q = query(collection(db, "products"), orderBy("id", "desc"));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({ fbId: doc.id, ...doc.data() }));
      callback(products);
    });
  }
}

export function onOrdersChange(callback) {
  if (isFirebaseEnabled) {
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ fbId: doc.id, ...doc.data() }));
      callback(orders);
    });
  }
}

export { auth, db, storage, isFirebaseEnabled };
