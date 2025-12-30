// User Interface & Utility helper script (Toasts, dialogs, quick-add modal, swipe handlers, keyboard shortcuts)

import { createTransaction, getCategories } from './database.js';

// =========================================================================
// 1. TOAST NOTIFICATIONS
// =========================================================================
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconClass = 'fa-circle-check';
  if (type === 'error') iconClass = 'fa-circle-xmark';
  if (type === 'warning') iconClass = 'fa-circle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Remove toast after duration
  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.25s reverse ease-out';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3500);
}

// =========================================================================
// 2. CONFIRMATION DIALOGS
// =========================================================================
export function showConfirmDialog(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
  return new Promise((resolve) => {
    let overlay = document.getElementById('dialog-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'dialog-overlay';
      overlay.className = 'dialog-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="dialog-box">
        <h4 class="dialog-title">${title}</h4>
        <p class="dialog-desc">${message}</p>
        <div class="btn-row">
          <button id="dialog-cancel" class="btn btn-secondary">${cancelText}</button>
          <button id="dialog-confirm" class="btn btn-danger">${confirmText}</button>
        </div>
      </div>
    `;

    overlay.classList.add('active');

    const handleCancel = () => {
      overlay.classList.remove('active');
      resolve(false);
    };

    const handleConfirm = () => {
      overlay.classList.remove('active');
      resolve(true);
    };

    document.getElementById('dialog-cancel').onclick = handleCancel;
    document.getElementById('dialog-confirm').onclick = handleConfirm;
  });
}

// =========================================================================
// 3. QUICK-ADD TRANSACTION MODAL INITIATOR
// =========================================================================
export async function initQuickAddModal(onSuccessCallback = null) {
  const fab = document.getElementById('fab-btn');
  if (!fab) return;

  // Check if quick add modal exists, if not, inject it
  let modalOverlay = document.getElementById('quick-add-modal');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'quick-add-modal';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Add Transaction</h3>
          <button class="modal-close-btn" id="close-quick-add-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <form id="quick-add-form" style="display:flex; flex-direction:column; gap:14px;">
          <!-- Income / Expense Toggle -->
          <div class="btn-row" style="background:#E2E8F0; padding:4px; border-radius:12px;">
            <button type="button" id="toggle-expense-btn" class="btn btn-primary" style="flex:1; padding:8px; border-radius:10px; font-size:12px; box-shadow:none;">Expense</button>
            <button type="button" id="toggle-income-btn" class="btn btn-outline" style="flex:1; padding:8px; border-radius:10px; font-size:12px; border:none;">Income</button>
          </div>

          <div class="input-group">
            <label class="input-label">Amount</label>
            <div class="input-field-icon">
              <i class="fa-solid fa-indian-rupee-sign"></i>
              <input type="number" id="qa-amount" step="any" min="0.01" class="input-field" placeholder="0.00" required>
            </div>
          </div>

          <!-- Category Dynamic Selector Grid -->
          <div class="input-group">
            <label class="input-label">Category</label>
            <div id="qa-categories-grid" class="category-grid">
              <!-- Dynamically populated -->
            </div>
            <input type="hidden" id="qa-category" required>
          </div>

          <div class="input-group">
            <label class="input-label">Account Source</label>
            <select id="qa-source" class="input-field" required>
              <option value="IOB Bank">IOB Bank</option>
              <option value="Jio Payments Bank">Jio Payments Bank</option>
              <option value="Cash" selected>Cash</option>
            </select>
          </div>

          <div class="btn-row">
            <div class="input-group" style="flex:1;">
              <label class="input-label">Date</label>
              <input type="date" id="qa-date" class="input-field" required>
            </div>
            <div class="input-group" style="flex:1;">
              <label class="input-label">Time</label>
              <input type="time" id="qa-time" class="input-field" required>
            </div>
          </div>

          <div class="input-group">
            <label class="input-label">Description (Optional)</label>
            <input type="text" id="qa-description" class="input-field" placeholder="e.g. Dinner, Grocery list">
          </div>

          <button type="submit" class="btn btn-primary" style="margin-top:10px;">
            <i class="fa-solid fa-check"></i> Save Transaction
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    // Initializer values
    const now = new Date();
    document.getElementById('qa-date').value = now.toISOString().split('T')[0];
    document.getElementById('qa-time').value = now.toTimeString().split(' ')[0].substring(0, 5);
  }

  const closeBtn = document.getElementById('close-quick-add-btn');
  const form = document.getElementById('quick-add-form');
  const toggleExpense = document.getElementById('toggle-expense-btn');
  const toggleIncome = document.getElementById('toggle-income-btn');
  const amountInput = document.getElementById('qa-amount');

  let activeType = 'expense';

  // Fetch and show categories in grid
  async function populateCategoryGrid(type) {
    const grid = document.getElementById('qa-categories-grid');
    grid.innerHTML = '<div class="skeleton-text skeleton" style="grid-column: span 4;"></div>';
    
    const categories = await getCategories();
    const filtered = categories.filter(c => c.type === type);
    
    grid.innerHTML = '';
    filtered.forEach(cat => {
      const item = document.createElement('div');
      item.className = 'category-select-item';
      item.dataset.category = cat.name;
      item.innerHTML = `
        <div class="icon-box" style="background-color: ${cat.color}">
          <i class="${cat.icon}"></i>
        </div>
        <span>${cat.name}</span>
      `;
      item.addEventListener('click', () => {
        document.querySelectorAll('.category-select-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        document.getElementById('qa-category').value = cat.name;
      });
      grid.appendChild(item);
    });

    // Auto-select first category if available
    if (filtered.length > 0) {
      grid.firstChild.click();
    }
  }

  // Event handlers for Modal Toggle
  fab.addEventListener('click', () => {
    modalOverlay.classList.add('active');
    populateCategoryGrid(activeType);
    const now = new Date();
    document.getElementById('qa-date').value = now.toISOString().split('T')[0];
    document.getElementById('qa-time').value = now.toTimeString().split(' ')[0].substring(0, 5);
  });

  closeBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
  });

  toggleExpense.addEventListener('click', () => {
    activeType = 'expense';
    toggleExpense.className = 'btn btn-primary';
    toggleExpense.style.boxShadow = 'none';
    toggleIncome.className = 'btn btn-outline';
    toggleIncome.style.border = 'none';
    populateCategoryGrid('expense');
  });

  toggleIncome.addEventListener('click', () => {
    activeType = 'income';
    toggleIncome.className = 'btn btn-primary';
    toggleIncome.style.boxShadow = 'none';
    toggleExpense.className = 'btn btn-outline';
    toggleExpense.style.border = 'none';
    populateCategoryGrid('income');
  });

  // Handle submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
      showToast('Amount must be positive and greater than zero.', 'error');
      return;
    }

    const tx = {
      type: activeType,
      amount: amount,
      category: document.getElementById('qa-category').value,
      source: document.getElementById('qa-source').value,
      date: document.getElementById('qa-date').value,
      time: document.getElementById('qa-time').value,
      description: document.getElementById('qa-description').value.trim()
    };

    try {
      await createTransaction(tx);
      showToast('Transaction saved successfully!', 'success');
      modalOverlay.classList.remove('active');
      form.reset();
      
      // Reset defaults
      const now = new Date();
      document.getElementById('qa-date').value = now.toISOString().split('T')[0];
      document.getElementById('qa-time').value = now.toTimeString().split(' ')[0].substring(0, 5);
      
      if (onSuccessCallback) {
        onSuccessCallback();
      } else {
        // Auto-refresh active page content if callback is not passed
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error saving transaction', 'error');
    }
  });
}

// =========================================================================
// 4. KEYBOARD SHORTCUTS
// =========================================================================
export function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Alt + N -> Open Quick Add Modal
    if (e.altKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      const fab = document.getElementById('fab-btn');
      if (fab) fab.click();
    }
    
    // Escape -> Close Modals
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-overlay.active');
      if (activeModal) {
        const closeBtn = activeModal.querySelector('.modal-close-btn');
        if (closeBtn) closeBtn.click();
        else activeModal.classList.remove('active');
      }
    }

    // Navigation shortcuts (Alt + D/T/R/S/P)
    if (e.altKey) {
      const char = e.key.toLowerCase();
      if (char === 'd') { e.preventDefault(); window.location.href = 'dashboard.html'; }
      if (char === 't') { e.preventDefault(); window.location.href = 'transactions.html'; }
      if (char === 'r') { e.preventDefault(); window.location.href = 'reports.html'; }
      if (char === 's') { e.preventDefault(); window.location.href = 'settings.html'; }
      if (char === 'p') { e.preventDefault(); window.location.href = 'profile.html'; }
    }
  });
}

// =========================================================================
// 5. MOBILE SWIPE NAVIGATION GESTURES
// =========================================================================
export function setupSwipeNavigation() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const threshold = 100; // Min distance (px) to trigger swipe
  const restirctY = 50; // Max vertical deviation (px) to prevent vertical scrolling triggering swipes

  const pages = ['dashboard.html', 'transactions.html', 'reports.html', 'settings.html', 'profile.html'];
  const path = window.location.pathname;
  const currentPage = path.substring(path.lastIndexOf('/') + 1) || 'dashboard.html';
  const currentIndex = pages.indexOf(currentPage === '' ? 'dashboard.html' : currentPage);

  if (currentIndex === -1) return; // Not in core tabs

  document.addEventListener('touchstart', (e) => {
    // Ignore touch on inputs, select, canvas or modals to prevent interaction issues
    if (e.target.closest('.modal-content') || e.target.closest('input') || e.target.closest('select') || e.target.closest('canvas')) {
      return;
    }
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, false);

  document.addEventListener('touchend', (e) => {
    if (e.target.closest('.modal-content') || e.target.closest('input') || e.target.closest('select') || e.target.closest('canvas')) {
      return;
    }
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }, false);

  function handleSwipe() {
    const diffX = touchEndX - touchStartX;
    const diffY = Math.abs(touchEndY - touchStartY);

    if (Math.abs(diffX) > threshold && diffY < restirctY) {
      if (diffX > 0) {
        // Swipe Right -> Go to previous page
        if (currentIndex > 0) {
          window.location.href = pages[currentIndex - 1];
        }
      } else {
        // Swipe Left -> Go to next page
        if (currentIndex < pages.length - 1) {
          window.location.href = pages[currentIndex + 1];
        }
      }
    }
  }
}

// Setup common elements on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  setupKeyboardShortcuts();
  setupSwipeNavigation();
});
