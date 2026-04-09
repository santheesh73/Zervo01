/**
 * ZERVO Notifications Component
 * ✅ Firebase Realtime Database integrated
 * Reads real notifications sent when donors submit food listings
 */

import { initializeApp }               from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  get,
  remove,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

// ── Relative time helper ────────────────────────────────────────────────────
function getRelativeTime(timestamp) {
  const diff    = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1)  return 'Just now';
  if (minutes < 60) return minutes + 'm ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return hours + 'h ago';
  return Math.floor(hours / 24) + 'd ago';
}

// ── Notification Controller ─────────────────────────────────────────────────
class NotificationController {
  constructor() {
    this.isOpen        = false;
    this.notifications = [];
    this.currentUser   = null;

    this.initDOM();
    if (this.wrapper) this.bindEvents();

    // Wait for auth then load real notifications
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.listenForNotifications(user.uid);
      }
    });
  }

  initDOM() {
    this.wrapper    = document.querySelector('.zervo-notifications');
    if (!this.wrapper) return;
    this.btn        = this.wrapper.querySelector('.zervo-notifications-btn');
    this.badge      = this.wrapper.querySelector('.zervo-notifications-badge');
    this.dropdown   = this.wrapper.querySelector('.zervo-notifications-dropdown');
    this.list       = this.wrapper.querySelector('.zervo-notifications-list');
    this.markAllBtn = this.wrapper.querySelector('.zervo-notifications-mark-all');
    this.emptyState = this.wrapper.querySelector('.zervo-notifications-empty');
  }

  bindEvents() {
    this.btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.wrapper.contains(e.target)) this.closeDropdown();
    });
    if (this.markAllBtn) {
      this.markAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.markAllRead();
      });
    }
  }

  // ── Listen for real-time notifications from Firebase ───────────────────
  listenForNotifications(uid) {
    const notifRef = ref(db, 'notifications/' + uid);
    onValue(notifRef, (snapshot) => {
      if (!snapshot.exists()) {
        this.notifications = [];
        this.render();
        return;
      }
      // Convert object to array with stable IDs (fallback to key) and sort newest first
      const data = snapshot.val();
      this.notifications = Object.entries(data)
        .map(([key, value]) => ({
          ...value,
          id: value?.id || key,
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
      this.render();
    });
  }

  // ── Mark single notification as read ───────────────────────────────────
  async markRead(notifId) {
    if (!this.currentUser) return;
    try {
      await update(ref(db, 'notifications/' + this.currentUser.uid + '/' + notifId), { isRead: true });
    } catch (err) { console.error(err); }
  }

  // ── Delete single notification ─────────────────────────────────────────
  async delete(notifId) {
    if (!this.currentUser || !notifId) return;
    try {
      await remove(ref(db, 'notifications/' + this.currentUser.uid + '/' + notifId));
    } catch (err) {
      console.error(err);
    }
  }

  // ── Mark all as read ────────────────────────────────────────────────────
  async markAllRead() {
    if (!this.currentUser) return;
    const updates = {};
    this.notifications.forEach(n => {
      if (!n.isRead) updates[n.id + '/isRead'] = true;
    });
    try {
      await update(ref(db, 'notifications/' + this.currentUser.uid), updates);
    } catch (err) { console.error(err); }
  }

  // ── Render notifications list ───────────────────────────────────────────
  render() {
    if (!this.list) return;

    const unread = this.notifications.filter(n => !n.isRead).length;
    this.updateBadge(unread);

    if (this.notifications.length === 0) {
      this.list.innerHTML = '';
      this.emptyState?.classList.remove('hidden');
      return;
    }

    this.emptyState?.classList.add('hidden');

    this.list.innerHTML = this.notifications.map(n => `
      <div data-id="${n.id}" data-foodid="${n.foodId || ''}" data-type="${n.type || ''}" class="notification-item flex gap-3 p-4 hover:bg-surface-variant/30 
        transition-colors border-b border-outline-variant/10 last:border-0 cursor-pointer group
        ${!n.isRead ? 'bg-primary/5' : ''}">
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <span class="material-symbols-outlined text-[20px]">${n.type === 'delivery_complete' ? 'verified' : n.type === 'request_accepted' ? 'check_circle' : 'food_bank'}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-on-surface ${!n.isRead ? 'font-bold' : ''} leading-snug">
            ${n.title || '🍱 New Food Available!'}
          </p>
          <p class="text-xs text-on-surface-variant mt-1 line-clamp-2">${n.message || ''}</p>
          ${n.photo ? `<img src="${n.photo}" style="width:100%;max-height:120px;object-fit:cover;border-radius:0.5rem;margin-top:0.5rem;border:1px solid rgba(191,202,186,0.3);" />` : ''}
          <p class="text-xs text-outline mt-1 flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px]">schedule</span>
            ${getRelativeTime(n.createdAt)}
          </p>
        </div>
        <button
          class="ml-2 text-outline hover:text-error transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
          data-delete-id="${n.id}"
          title="Delete notification"
          aria-label="Delete notification"
        >
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
        ${!n.isRead ? '<div class="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>' : ''}
      </div>
    `).join('');

    // Click handler for each notification (open)
    this.list.querySelectorAll('.notification-item').forEach(el => {
      el.addEventListener('click', async () => {
        const id     = el.dataset.id;
        const foodId = el.dataset.foodid;
        const type   = el.dataset.type;
        await this.markRead(id);
        // Redirect based on notification type
        if (type === 'delivery_complete') {
          window.location.href = 'impact-dashboard.html';
        } else if (type === 'food_request') {
          window.location.href = 'volunteer-dashboard.html';
        } else if (type === 'request_accepted') {
          // Receiver gets notified their request was accepted
          window.location.href = 'submission-popups.html';
        } else {
          // New food available → go to pickup workflow
          window.location.href = foodId
            ? 'pickup-workflow.html?foodId=' + foodId
            : 'pickup-workflow.html';
        }
      });
    });

    // Delete buttons (stop click bubbling to open handler)
    this.list.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        await this.delete(id);
      });
    });
  }

  updateBadge(count) {
    if (!this.badge) return;
    if (count > 0) {
      this.badge.classList.remove('hidden');
      this.badge.textContent = count > 9 ? '9+' : count;
    } else {
      this.badge.classList.add('hidden');
    }
  }

  toggleDropdown() { this.isOpen ? this.closeDropdown() : this.openDropdown(); }

  openDropdown() {
    this.isOpen = true;
    this.dropdown.classList.remove('hidden', 'opacity-0', 'scale-95', 'pointer-events-none');
    this.dropdown.classList.add('opacity-100', 'scale-100');
  }

  closeDropdown() {
    this.isOpen = false;
    this.dropdown.classList.remove('opacity-100', 'scale-100');
    this.dropdown.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
    setTimeout(() => { if (!this.isOpen) this.dropdown.classList.add('hidden'); }, 200);
  }
}

document.addEventListener('DOMContentLoaded', () => new NotificationController());
