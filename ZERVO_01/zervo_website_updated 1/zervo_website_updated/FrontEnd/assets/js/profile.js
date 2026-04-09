/**
 * Profile Dropdown Controller — ZERVO
 * ✅ Firebase Auth + Realtime Database integrated
 * ✅ sessionStorage caching for instant load speed
 */

// ── Firebase Setup ──────────────────────────────────────────────────────────
import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged,
         signOut }         from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref,
         get }             from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8ynZXXUV7MJLbZNd42CEUpZDRWXoHM30",
  authDomain: "zervo-9585.firebaseapp.com",
  projectId: "zervo-9585",
  storageBucket: "zervo-9585.firebasestorage.app",
  messagingSenderId: "892339796416",
  appId: "1:892339796416:web:f9810482ae1c40be6b3025",
  databaseURL: "https://zervo-9585-default-rtdb.firebaseio.com"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

// ── Fill profile dropdown with real user data ───────────────────────────────
function fillProfileDropdown(user, extraData) {
  const wrapper = document.querySelector('.zervo-profile-wrapper');
  if (!wrapper) return;

  const name  = (extraData && extraData.name)  || user.displayName || 'User';
  const email = (extraData && extraData.email) || user.email        || '';

  // Update name and email in dropdown header
  const dropdownHeader = wrapper.querySelector('.zervo-profile-rdown .p-4');
  if (dropdownHeader) {
    const allP = dropdownHeader.querySelectorAll('p');
    if (allP[0]) allP[0].textContent = name;
    if (allP[1]) allP[1].textContent = email;
  }

  // Show initials instead of hardcoded avatar image
  const triggerDiv = wrapper.querySelector('.zervo-profile-rtrig > div');
  if (triggerDiv) {
    const initials = name.split(' ').map(function(n){ return n[0]; }).join('').substring(0, 2).toUpperCase();
    triggerDiv.innerHTML   = '';
    triggerDiv.className   = 'w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm';
    triggerDiv.textContent = initials;
  }
}

// ── Logout handler ──────────────────────────────────────────────────────────
function handleLogout() {
  const logoutLink = document.querySelector('.zervo-profile-rdown a[href="login.html"]');
  if (logoutLink && !logoutLink._zervoLogout) {
    logoutLink._zervoLogout = true;
    logoutLink.addEventListener('click', async function(e) {
      e.preventDefault();
      sessionStorage.clear();
      await signOut(auth);
      window.location.href = 'login.html';
    });
  }
}

// ── Auth state + speed-optimized data loading ───────────────────────────────
onAuthStateChanged(auth, async function(user) {
  if (user) {
    var cacheKey = 'zervo_user_' + user.uid;
    var cached   = sessionStorage.getItem(cacheKey);

    // INSTANT: show cached data immediately if available
    if (cached) {
      fillProfileDropdown(user, JSON.parse(cached));
    }

    // Fetch fresh data from DB in background
    try {
      var snapshot  = await get(ref(db, 'users/' + user.uid));
      var extraData = snapshot.exists() ? snapshot.val() : null;
      if (extraData) {
        sessionStorage.setItem(cacheKey, JSON.stringify(extraData));
        fillProfileDropdown(user, extraData);
      } else {
        if (!cached) fillProfileDropdown(user, null);
      }
    } catch (err) {
      if (!cached) fillProfileDropdown(user, null);
    }

    handleLogout();

  } else {
    sessionStorage.clear();
    var page        = window.location.pathname.split('/').pop();
    var publicPages = ['login.html', 'signup.html', 'forgot-password.html', 'index.html', ''];
    if (publicPages.indexOf(page) === -1) {
      window.location.href = 'login.html';
    }
  }
});

// ── Dropdown Controller (design unchanged) ──────────────────────────────────
class ProfileDropdownController {
  constructor() {
    this.isOpen  = false;
    this.wrapper = document.querySelector('.zervo-profile-wrapper');
    if (this.wrapper) {
      this.trigger  = this.wrapper.querySelector('.zervo-profile-rtrig');
      this.dropdown = this.wrapper.querySelector('.zervo-profile-rdown');
      this.bindEvents();
    }
  }

  bindEvents() {
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });
    document.addEventListener('mousedown', (e) => {
      if (this.isOpen && !this.wrapper.contains(e.target)) this.closeDropdown();
    });
    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.closeDropdown();
        this.trigger.focus();
      }
    });
    this.dropdown.querySelectorAll('[role="menuitem"]').forEach(item => {
      item.addEventListener('click', () => this.closeDropdown());
    });
  }

  toggleDropdown() { this.isOpen ? this.closeDropdown() : this.openDropdown(); }

  openDropdown() {
    this.isOpen = true;
    this.trigger.setAttribute('aria-expanded', 'true');
    var viewProfileLink = this.dropdown.querySelector('a[href*="editprofile.html"]');
    if (viewProfileLink) {
      var currentPage = window.location.pathname.split('/').pop() || 'index.html';
      viewProfileLink.href = 'editprofile.html?from=' + currentPage;
    }
    this.dropdown.classList.remove('opacity-0', 'scale-95', '-translate-y-2', 'invisible', 'pointer-events-none');
    this.dropdown.classList.add('opacity-100', 'scale-100', 'translate-y-0', 'visible');
  }

  closeDropdown() {
    this.isOpen = false;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.dropdown.classList.remove('opacity-100', 'scale-100', 'translate-y-0', 'visible');
    this.dropdown.classList.add('opacity-0', 'scale-95', '-translate-y-2', 'invisible', 'pointer-events-none');
  }
}

document.addEventListener('DOMContentLoaded', function() { new ProfileDropdownController(); });
