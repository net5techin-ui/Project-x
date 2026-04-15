import { supabase } from './supabase-config.js';

/**
 * TN28 Supabase Authentication Logic
 */

const authForm = document.getElementById('authForm');
const authTabs = document.getElementById('authTabs');
const submitBtn = document.getElementById('submitBtn');
const btnGoogle = document.getElementById('btnGoogle');
const nameGroup = document.getElementById('nameGroup');
const toastEl = document.getElementById('toast');

let mode = 'login';

// Tab Switching
if (authTabs) {
    authTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            authTabs.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            mode = e.target.dataset.mode;
            nameGroup.style.display = mode === 'signup' ? 'block' : 'none';
            submitBtn.textContent = mode === 'signup' ? 'CREATE ACCOUNT' : 'LOG IN';
        }
    });
}

// Toast Helper
function showToast(msg, color = '#1a1a1a') {
  if (!toastEl) return console.log('Toast:', msg);
  toastEl.textContent = msg;
  toastEl.style.backgroundColor = color;
  toastEl.style.opacity = '1';
  setTimeout(() => { toastEl.style.opacity = '0'; }, 3000);
}

// Form Submission
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const fullName = document.getElementById('fullName')?.value.trim();

        if (!email || !password) return;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } }
                });
                if (error) throw error;
                showToast('Registration successful! Please check your email.', '#22C55E');
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                
                showToast('Welcome back!', '#22C55E');
                setTimeout(() => {
                    const isAdmin = email.includes('admin');
                    window.location.href = isAdmin ? 'admin.html' : 'index.html';
                }, 1000);
            }

        } catch (err) {
            console.error('Auth Error:', err);
            showToast(err.message || 'Authentication failed', '#EF4444');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'signup' ? 'CREATE ACCOUNT' : 'LOG IN';
        }
    });
}

// Google Login
if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/login.html` }
            });
            if (error) throw error;
        } catch (err) {
            showToast(err.message, '#EF4444');
        }
    });
}

// Check Session on Load
window.addEventListener('load', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && window.location.pathname.includes('login.html')) {
        const isAdmin = session.user.email.includes('admin');
        window.location.href = isAdmin ? 'admin.html' : 'index.html';
    }
});
