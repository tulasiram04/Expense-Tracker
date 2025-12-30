// Supabase client configuration and dynamic initialization module

let supabaseUrl = localStorage.getItem('EXPENSE_TRACKER_SUPABASE_URL') || '';
let supabaseKey = localStorage.getItem('EXPENSE_TRACKER_SUPABASE_KEY') || '';

let supabaseClient = null;

if (supabaseUrl && supabaseKey) {
  try {
    // Check if the global supabase library is loaded
    if (typeof supabase !== 'undefined') {
      supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    } else {
      console.error('Supabase CDN script is not loaded on this page.');
    }
  } catch (error) {
    console.error('Error creating Supabase client:', error);
  }
}

// Automatically inject setup screen if credentials are missing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!supabaseClient) injectSetupOverlay();
  });
} else {
  if (!supabaseClient) injectSetupOverlay();
}

function injectSetupOverlay() {
  // Check if setup overlay already exists
  if (document.getElementById('supabase-setup-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'supabase-setup-overlay';
  overlay.className = 'setup-overlay';
  overlay.innerHTML = `
    <div class="setup-box">
      <div class="setup-logo">
        <i class="fa-solid fa-wallet"></i> My Expense Tracker
      </div>
      <h3 style="font-size: 16px; font-weight: 700; margin-top: 10px;">Connect to Supabase</h3>
      <p class="setup-desc">
        To start using this application, you need to connect your own Supabase database. 
        Go to your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase Project Settings > API</a> to retrieve your API credentials.
      </p>
      
      <form id="supabase-setup-form">
        <div class="input-group">
          <label class="input-label" for="setup-url">SUPABASE_URL</label>
          <input type="url" id="setup-url" class="input-field" placeholder="https://your-project.supabase.co" required>
        </div>
        <div class="input-group" style="margin-bottom: 24px;">
          <label class="input-label" for="setup-key">SUPABASE_ANON_KEY</label>
          <input type="password" id="setup-key" class="input-field" placeholder="your-anon-public-key" required>
        </div>
        <button type="submit" class="btn btn-primary">
          <i class="fa-solid fa-plug"></i> Connect Database
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  // Handle form submission
  const form = document.getElementById('supabase-setup-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('setup-url').value.trim();
    const key = document.getElementById('setup-key').value.trim();

    if (url && key) {
      localStorage.setItem('EXPENSE_TRACKER_SUPABASE_URL', url);
      localStorage.setItem('EXPENSE_TRACKER_SUPABASE_KEY', key);
      
      // Flash a success toast or alert before reloading
      alert('Supabase credentials saved successfully! Reloading...');
      window.location.reload();
    }
  });
}

// Helper functions for settings page to clear/modify configuration
export function saveSupabaseConfig(url, key) {
  localStorage.setItem('EXPENSE_TRACKER_SUPABASE_URL', url.trim());
  localStorage.setItem('EXPENSE_TRACKER_SUPABASE_KEY', key.trim());
  window.location.reload();
}

export function clearSupabaseConfig() {
  localStorage.removeItem('EXPENSE_TRACKER_SUPABASE_URL');
  localStorage.removeItem('EXPENSE_TRACKER_SUPABASE_KEY');
  window.location.reload();
}

export { supabaseClient };
