
import * as backend from './backend-config.js';

let cart = [];
let grandTotal = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadCheckoutData();
    document.getElementById('btnPlaceOrder').addEventListener('click', handleCheckout);
});

function loadCheckoutData() {
    // 1. Get cart from local storage (synced with app.js)
    const storedCart = localStorage.getItem('tn28_cart');
    if (!storedCart || JSON.parse(storedCart).length === 0) {
        alert('Your cart is empty!');
        window.location.href = 'index.html';
        return;
    }
    cart = JSON.parse(storedCart);

    // 2. Render Items
    const container = document.getElementById('checkoutItemsList');
    let subtotal = 0;
    
    container.innerHTML = cart.map(item => {
        subtotal += (item.price * item.qty);
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-qty">Qty: ${item.qty} | Size: ${item.size || 'M'}</div>
                    <div class="cart-item-price">₹${(item.price * item.qty).toLocaleString()}</div>
                </div>
            </div>
        `;
    }).join('');

    // 3. Totals
    grandTotal = subtotal + 150; // 150 shipping
    document.getElementById('summarySubtotal').textContent = `₹${subtotal.toLocaleString()}`;
    document.getElementById('summaryGrandTotal').textContent = `₹${grandTotal.toLocaleString()}`;
}

async function handleCheckout() {
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const email = document.getElementById('custEmail').value;
    const street = document.getElementById('custStreet').value;
    const city = document.getElementById('custCity').value;
    const state = document.getElementById('custState').value;
    const zip = document.getElementById('custZip').value;

    if (!name || !phone || !street || !city || !state || !zip) {
        alert('Please fill in all delivery details.');
        return;
    }

    const orderId = 'TN28-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const fullAddress = `${street}, ${city}, ${state} - ${zip}`;
    const itemNames = cart.map(i => `${i.name} (x${i.qty})`).join(', ');

    // Show processing
    showStatus('processing', 'Processing Order...', 'Please wait while we secure your order.');

    try {
        // A. Store in Database (Supabase)
        const orderData = {
            orderId: orderId,
            customer: { name, phone, email },
            address: { street, city, state, pincode: zip, fullAddress },
            items: cart,
            total: grandTotal - 150,
            grandTotal: grandTotal,
            status: 'pending'
        };

        await backend.placeOrder(orderData);

        // B. Route based on Payment Method
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        
        if (paymentMethod === 'razorpay') {
            // Initial WhatsApp Notification for Razorpay
            const initialMsg = `🛒 New Order Received (Online Payment)!
👤 Name: ${name}
📞 Phone: ${phone}
💰 Total: ₹${grandTotal}
🛍 Items: ${itemNames}

Waiting for payment completion...`;
            sendWhatsAppMessage(initialMsg);
            initiatePayment(orderData);
        } else {
            // Handle PhonePe / UPI
            initiateUPIPayment(orderData, paymentMethod);
        }

    } catch (err) {
        console.error('Checkout error:', err);
        showStatus('error', 'Order Failed', 'Something went wrong. Please try again.');
    }
}

function initiateUPIPayment(order, method) {
    const vpa = "9600447624@ybl"; // PhonePe / Universal UPI VPA
    const note = `TN28 Order ${order.orderId}`;
    const upiUrl = `upi://pay?pa=${vpa}&pn=TN28%20STORE&am=${order.grandTotal}&cu=INR&tn=${encodeURIComponent(note)}`;
    
    showStatus('success', 'Order Submitted!', 'Opening payment app... please complete the payment and share the screenshot on WhatsApp.');
    
    const itemNames = order.items.map(i => `${i.name} (x${i.qty})`).join(', ');
    const whatsappMsg = `🛒 *New Order* (${method.toUpperCase()})
━━━━━━━━━━━━━━━━━━
🆔 Order ID: ${order.orderId}
👤 Name: ${order.customer.name}
📞 Contact: ${order.customer.phone}
📍 Address: ${order.address.fullAddress}
━━━━━━━━━━━━━━━━━━
🛍 Items: ${itemNames}
💰 *Total Amount: ₹${order.grandTotal}*
━━━━━━━━━━━━━━━━━━
✅ I have initiated the payment. Please confirm!`;

    // Attempt to launch UPI app
    window.location.href = upiUrl;

    // After 2 seconds, open WhatsApp with order details
    setTimeout(() => {
        sendWhatsAppMessage(whatsappMsg);
        
        // Clear cart as order is submitted
        localStorage.removeItem('tn28_cart');
        document.getElementById('btnCloseStatus').style.display = 'block';
    }, 2000);
}

function initiatePayment(order) {
    const options = {
        "key": "rzp_test_YourKeyHere", // Placeholder - user should replace with live key
        "amount": order.grandTotal * 100, // in paise
        "currency": "INR",
        "name": "TN28 Men's Fashion",
        "description": "Order #" + order.orderId,
        "image": "https://tn28apparels.com/logo.png",
        "handler": function (response){
            handlePaymentSuccess(order, response.razorpay_payment_id);
        },
        "prefill": {
            "name": order.customer.name,
            "email": order.customer.email,
            "contact": order.customer.phone
        },
        "theme": { "color": "#FF9900" },
        "modal": {
            "ondismiss": function(){
                handlePaymentFailure(order, "User cancelled payment");
            }
        }
    };
    const rzp = new Razorpay(options);
    rzp.open();
}

async function handlePaymentSuccess(order, paymentId) {
    showStatus('success', 'Payment Successful!', 'Order Confirmed 🎉. Your order ID is ' + order.orderId);
    
    // Update status in DB
    try {
        await backend.updateOrderStatus(order, 'confirmed');
    } catch (e) { console.error('DB Status update failed', e); }

    // Success WhatsApp
    const successMsg = `✅ Payment Successful!
Order Confirmed 🎉
Customer: ${order.customer.name}
Amount Paid: ₹${order.grandTotal}`;
    
    sendWhatsAppMessage(successMsg);
    
    // Clear cart
    localStorage.removeItem('tn28_cart');
    document.getElementById('btnCloseStatus').style.display = 'block';
}

function handlePaymentFailure(order, reason) {
    showStatus('error', 'Payment Failed', reason || 'The transaction could not be completed.');
    
    const failMsg = `❌ Payment Failed
Customer: ${order.customer.name}
Order Pending`;
    
    sendWhatsAppMessage(failMsg);
    document.getElementById('btnCloseStatus').style.display = 'block';
}

function sendWhatsAppMessage(text) {
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/919600447624?text=${encoded}`;
    window.open(url, '_blank');
}

function showStatus(type, title, desc) {
    const overlay = document.getElementById('statusOverlay');
    const icon = document.getElementById('statusIcon');
    const titleEl = document.getElementById('statusTitle');
    const descEl = document.getElementById('statusDesc');

    overlay.style.display = 'flex';
    titleEl.textContent = title;
    descEl.textContent = desc;

    if (type === 'processing') {
        icon.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        icon.className = 'status-icon';
    } else if (type === 'success') {
        icon.innerHTML = '<i class="fas fa-check-circle"></i>';
        icon.className = 'status-icon success';
    } else if (type === 'error') {
        icon.innerHTML = '<i class="fas fa-times-circle"></i>';
        icon.className = 'status-icon error';
    }
}
