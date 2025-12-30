// Database Service for Supabase Queries (Transactions, Budgets, Categories, Profiles)

import { supabaseClient } from './supabase-config.js';
import { getCurrentUser } from './auth.js';

// Default categories template
const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income', icon: 'fa-solid fa-money-bill-wave', color: '#22C55E' },
  { name: 'Gift', type: 'income', icon: 'fa-solid fa-gift', color: '#EC4899' },
  { name: 'Investment', type: 'income', icon: 'fa-solid fa-chart-line', color: '#06B6D4' },
  { name: 'Food', type: 'expense', icon: 'fa-solid fa-utensils', color: '#EF4444' },
  { name: 'Travel', type: 'expense', icon: 'fa-solid fa-plane', color: '#3B82F6' },
  { name: 'Fuel', type: 'expense', icon: 'fa-solid fa-gas-pump', color: '#F59E0B' },
  { name: 'Shopping', type: 'expense', icon: 'fa-solid fa-bag-shopping', color: '#EC4899' },
  { name: 'Groceries', type: 'expense', icon: 'fa-solid fa-cart-shopping', color: '#10B981' },
  { name: 'Bills', type: 'expense', icon: 'fa-solid fa-file-invoice-dollar', color: '#8B5CF6' },
  { name: 'Medical', type: 'expense', icon: 'fa-solid fa-heart-pulse', color: '#14B8A6' },
  { name: 'Entertainment', type: 'expense', icon: 'fa-solid fa-film', color: '#F97316' },
  { name: 'Education', type: 'expense', icon: 'fa-solid fa-graduation-cap', color: '#6366F1' },
  { name: 'Recharge', type: 'expense', icon: 'fa-solid fa-mobile-screen-button', color: '#0D9488' },
  { name: 'Rent', type: 'expense', icon: 'fa-solid fa-house', color: '#78716C' },
  { name: 'Transfer', type: 'expense', icon: 'fa-solid fa-money-bill-transfer', color: '#4F46E5' },
  { name: 'Insurance', type: 'expense', icon: 'fa-solid fa-shield-halved', color: '#475569' },
  { name: 'EMI', type: 'expense', icon: 'fa-solid fa-credit-card', color: '#EA580C' },
  { name: 'Others', type: 'expense', icon: 'fa-solid fa-ellipsis', color: '#94A3B8' }
];

// =========================================================================
// 1. PROFILE METHODS
// =========================================================================

export async function getUserProfile() {
  if (!supabaseClient) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      return data;
    }

    // Profile doesn't exist or query failed, try to auto-create it
    console.warn('Profile not found, attempting to create default profile...', error);
    const defaultName = user.user_metadata?.name || (user.email ? user.email.split('@')[0] : 'User');
    const newProfile = {
      id: user.id,
      name: defaultName,
      currency: 'INR',
      theme_color: '#2563EB',
      notifications_enabled: true,
      last_login: new Date().toISOString()
    };

    const { data: insertedData, error: insertError } = await supabaseClient
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to auto-create profile in database:', insertError);
      // Fallback: return the in-memory object so the app functions correctly
      return newProfile;
    }

    return insertedData;
  } catch (e) {
    console.error('Exception in getUserProfile:', e);
    // Fallback: return default profile object
    return {
      id: user.id,
      name: user.user_metadata?.name || (user.email ? user.email.split('@')[0] : 'User'),
      currency: 'INR',
      theme_color: '#2563EB',
      notifications_enabled: true,
      last_login: new Date().toISOString()
    };
  }
}

export async function updateUserProfile(profileData) {
  if (!supabaseClient) throw new Error('Database not connected');
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabaseClient
    .from('profiles')
    .update({
      ...profileData,
      last_login: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Clear user data (simulates account delete due to client-side RLS limitations)
export async function clearUserAccountData() {
  if (!supabaseClient) throw new Error('Database not connected');
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Delete all transactions, budgets, custom categories, then the profile
  await supabaseClient.from('transactions').delete().eq('user_id', user.id);
  await supabaseClient.from('budgets').delete().eq('user_id', user.id);
  await supabaseClient.from('categories').delete().eq('user_id', user.id);
  await supabaseClient.from('profiles').delete().eq('id', user.id);

  // Sign out user
  await supabaseClient.auth.signOut();
  localStorage.clear();
  window.location.href = 'login.html';
}

// =========================================================================
// 2. CATEGORIES METHODS
// =========================================================================

export async function getCategories() {
  if (!supabaseClient) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  // Get categories belonging to this user or default system categories (user_id is null)
  const { data, error } = await supabaseClient
    .from('categories')
    .select('*')
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error loading categories:', error);
    return [];
  }

  // If user has zero categories custom-seeded, seed them automatically
  const userCustomCategories = data.filter(c => c.user_id === user.id);
  const globalCategories = data.filter(c => c.user_id === null);

  if (userCustomCategories.length === 0 && globalCategories.length === 0) {
    return await seedDefaultCategories(user.id);
  }

  return data;
}

export async function createCategory(name, type, icon, color) {
  if (!supabaseClient) throw new Error('Database not connected');
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabaseClient
    .from('categories')
    .insert([{ user_id: user.id, name, type, icon, color }])
    .select();

  if (error) throw error;
  return data[0];
}

export async function deleteCategory(categoryId) {
  if (!supabaseClient) throw new Error('Database not connected');
  const { error } = await supabaseClient
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) throw error;
  return true;
}

async function seedDefaultCategories(userId) {
  const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
    user_id: userId,
    name: cat.name,
    type: cat.type,
    icon: cat.icon,
    color: cat.color
  }));

  const { data, error } = await supabaseClient
    .from('categories')
    .insert(categoriesToInsert)
    .select();

  if (error) {
    console.error('Failed to seed categories:', error);
    return [];
  }
  return data;
}

// =========================================================================
// 3. TRANSACTIONS METHODS
// =========================================================================

export async function getTransactions(filters = {}) {
  if (!supabaseClient) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  let query = supabaseClient
    .from('transactions')
    .select('*')
    .eq('user_id', user.id);

  // Apply filters
  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }
  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }
  if (filters.source && filters.source !== 'all') {
    query = query.eq('source', filters.source);
  }
  if (filters.search) {
    query = query.or(`description.ilike.%${filters.search}%,category.ilike.%${filters.search}%,source.ilike.%${filters.search}%`);
  }

  // Date filters
  const today = new Date();
  if (filters.dateRange) {
    if (filters.dateRange === 'today') {
      const dateStr = today.toISOString().split('T')[0];
      query = query.eq('date', dateStr);
    } else if (filters.dateRange === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      query = query.eq('date', dateStr);
    } else if (filters.dateRange === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      const dateStr = startOfWeek.toISOString().split('T')[0];
      query = query.gte('date', dateStr);
    } else if (filters.dateRange === 'month') {
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      query = query.gte('date', dateStr);
    } else if (filters.dateRange === 'last_month') {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      query = query
        .gte('date', lastMonth.toISOString().split('T')[0])
        .lte('date', lastMonthEnd.toISOString().split('T')[0]);
    } else if (filters.dateRange === 'year') {
      const dateStr = `${today.getFullYear()}-01-01`;
      query = query.gte('date', dateStr);
    } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
      query = query.gte('date', filters.startDate).lte('date', filters.endDate);
    }
  }

  // Sort and limit
  const sortBy = filters.sortBy || 'date';
  const sortOrder = filters.sortOrder || 'desc';
  
  if (sortBy === 'amount') {
    query = query.order('amount', { ascending: sortOrder === 'asc' });
  } else {
    // Default: Sort by date then time desc
    query = query
      .order('date', { ascending: sortOrder === 'asc' })
      .order('time', { ascending: sortOrder === 'asc' });
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  return data;
}

export async function createTransaction(tx) {
  if (!supabaseClient) throw new Error('Database not connected');
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Default values
  const now = new Date();
  const txDate = tx.date || now.toISOString().split('T')[0];
  const txTime = tx.time || now.toTimeString().split(' ')[0];

  const { data, error } = await supabaseClient
    .from('transactions')
    .insert([{
      user_id: user.id,
      date: txDate,
      time: txTime,
      type: tx.type,
      category: tx.category,
      source: tx.source,
      description: tx.description || '',
      amount: parseFloat(tx.amount)
    }])
    .select();

  if (error) throw error;
  return data[0];
}

export async function updateTransaction(id, tx) {
  if (!supabaseClient) throw new Error('Database not connected');
  
  const { data, error } = await supabaseClient
    .from('transactions')
    .update({
      date: tx.date,
      time: tx.time,
      type: tx.type,
      category: tx.category,
      source: tx.source,
      description: tx.description || '',
      amount: parseFloat(tx.amount),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
}

export async function deleteTransaction(id) {
  if (!supabaseClient) throw new Error('Database not connected');
  const { error } = await supabaseClient
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function duplicateTransaction(id) {
  if (!supabaseClient) throw new Error('Database not connected');
  
  // 1. Fetch transaction
  const { data: tx, error: fetchErr } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  // 2. Clone with new dates
  const now = new Date();
  const newTx = {
    type: tx.type,
    category: tx.category,
    source: tx.source,
    description: `${tx.description} (Copy)`,
    amount: tx.amount,
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().split(' ')[0]
  };

  return await createTransaction(newTx);
}

// =========================================================================
// 4. BUDGET METHODS
// =========================================================================

export async function getBudgets(monthStr) {
  if (!supabaseClient) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabaseClient
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', monthStr);

  if (error) {
    console.error('Error fetching budgets:', error);
    return [];
  }
  return data;
}

export async function setBudget(category, amount, monthStr) {
  if (!supabaseClient) throw new Error('Database not connected');
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Try to insert, if conflict on (user_id, category, month) update amount
  const { data, error } = await supabaseClient
    .from('budgets')
    .upsert({
      user_id: user.id,
      category,
      amount: parseFloat(amount),
      month: monthStr
    }, {
      onConflict: 'user_id,category,month'
    })
    .select();

  if (error) throw error;
  return data[0];
}

export async function deleteBudget(budgetId) {
  if (!supabaseClient) throw new Error('Database not connected');
  const { error } = await supabaseClient
    .from('budgets')
    .delete()
    .eq('id', budgetId);

  if (error) throw error;
  return true;
}

// Complex aggregate: returns budget configuration combined with actual spent for a given month
export async function getBudgetSummary(monthStr) {
  const budgets = await getBudgets(monthStr);
  
  // Calculate expenses for this month
  const transactions = await getTransactions({
    type: 'expense',
    dateRange: 'custom',
    startDate: `${monthStr}-01`,
    endDate: `${monthStr}-31` // Query will filter appropriately up to end of month
  });

  const spentByCategory = {};
  transactions.forEach(tx => {
    spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + parseFloat(tx.amount);
  });

  return budgets.map(b => {
    const spent = spentByCategory[b.category] || 0;
    const remaining = b.amount - spent;
    const percentage = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
    
    let status = 'green';
    if (percentage >= 90) status = 'red';
    else if (percentage >= 70) status = 'yellow';

    return {
      id: b.id,
      category: b.category,
      budget: b.amount,
      spent,
      remaining,
      percentage,
      status
    };
  });
}
