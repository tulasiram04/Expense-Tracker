// Polyfill script to dynamically map FontAwesome classes to Lucide icons

const faToLucideMap = {
  'fa-wallet': 'wallet',
  'fa-building-columns': 'landmark',
  'fa-mobile-retro': 'smartphone',
  'fa-money-bill-1': 'banknote',
  'fa-money-bill-wave': 'banknote',
  'fa-gift': 'gift',
  'fa-chart-line': 'trending-up',
  'fa-utensils': 'utensils',
  'fa-plane': 'plane',
  'fa-gas-pump': 'fuel',
  'fa-bag-shopping': 'shopping-bag',
  'fa-cart-shopping': 'shopping-cart',
  'fa-file-invoice-dollar': 'receipt',
  'fa-heart-pulse': 'heart-pulse',
  'fa-film': 'film',
  'fa-graduation-cap': 'graduation-cap',
  'fa-mobile-screen-button': 'smartphone',
  'fa-house': 'home',
  'fa-house-chimney': 'home',
  'fa-money-bill-transfer': 'arrow-left-right',
  'fa-shield-halved': 'shield',
  'fa-credit-card': 'credit-card',
  'fa-ellipsis': 'more-horizontal',
  'fa-arrow-trend-up': 'trending-up',
  'fa-arrow-trend-down': 'trending-down',
  'fa-plus': 'plus',
  'fa-trash-can': 'trash-2',
  'fa-trash': 'trash-2',
  'fa-sliders': 'sliders',
  'fa-chart-pie': 'pie-chart',
  'fa-list-ul': 'list',
  'fa-user': 'user',
  'fa-right-from-bracket': 'log-out',
  'fa-right-to-bracket': 'log-in',
  'fa-envelope': 'mail',
  'fa-lock': 'lock',
  'fa-xmark': 'x',
  'fa-check': 'check',
  'fa-clone': 'copy',
  'fa-file-import': 'file-input',
  'fa-file-export': 'file-output',
  'fa-magnifying-glass': 'search',
  'fa-print': 'printer',
  'fa-file-csv': 'file-spreadsheet',
  'fa-file-excel': 'file-spreadsheet',
  'fa-cloud-arrow-down': 'download-cloud',
  'fa-cloud-arrow-up': 'upload-cloud',
  'fa-palette': 'palette',
  'fa-bullseye': 'target',
  'fa-server': 'database',
  'fa-key': 'key',
  'fa-lock-open': 'lock',
  'fa-circle-check': 'check-circle',
  'fa-circle-xmark': 'x-circle',
  'fa-circle-exclamation': 'alert-circle',
  'fa-star': 'star',
  'fa-gamepad': 'gamepad-2',
  'fa-mug-hot': 'coffee',
  'fa-laptop': 'laptop',
  'fa-dumbbell': 'dumbbell',
  'fa-car': 'car',
  'fa-music': 'music',
  'fa-baby': 'baby',
  'fa-scissors': 'scissors',
  'fa-chevron-down': 'chevron-down',
  'fa-plug': 'plug',
  'fa-floppy-disk': 'save',
  'fa-indian-rupee-sign': 'indian-rupee'
};

function convertIcons(root = document) {
  const elements = root.querySelectorAll('i[class*="fa-"]');
  let changed = false;

  elements.forEach(el => {
    let faName = null;
    el.classList.forEach(cls => {
      if (cls.startsWith('fa-') && cls !== 'fa-solid' && cls !== 'fa-regular' && cls !== 'fa-brands') {
        faName = cls;
      }
    });

    if (faName) {
      const lucideName = faToLucideMap[faName] || 'circle-dot';
      
      // Save existing style & class names that are not FA
      const style = el.getAttribute('style');
      const extraClasses = Array.from(el.classList).filter(cls => 
        !cls.startsWith('fa-') && cls !== 'fa-solid' && cls !== 'fa-regular' && cls !== 'fa-brands'
      );

      // Mutate element to Lucide representation
      el.removeAttribute('class');
      if (extraClasses.length > 0) {
        el.className = extraClasses.join(' ');
      }
      el.dataset.lucide = lucideName;
      if (style) el.setAttribute('style', style);
      changed = true;
    }
  });

  if (changed && window.lucide) {
    window.lucide.createIcons();
  }
}

// Run immediately on script load, on DOMContentLoaded, and window load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => convertIcons());
} else {
  convertIcons();
}

window.addEventListener('load', () => {
  convertIcons();
  
  // Watch for dynamic DOM changes (dynamic category loading, modal open, new transaction rendering)
  const observer = new MutationObserver((mutations) => {
    let hasNewFa = false;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.matches('i[class*="fa-"]') || node.querySelector('i[class*="fa-"]')) {
            hasNewFa = true;
          }
        }
      });
    });
    if (hasNewFa) {
      convertIcons();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
