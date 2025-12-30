// Authentication service utilizing Supabase Auth

import { supabaseClient } from './supabase-config.js';

// Get current session/user details
export async function getCurrentUser() {
  if (!supabaseClient) return null;
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }
  return session ? session.user : null;
}

// Check if user is logged in (Sync-like wrapper)
export async function checkSession() {
  if (!supabaseClient) return null;
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
      console.error('Error checking session:', error);
      return null;
    }
    return session;
  } catch (err) {
    console.error('Exception in checkSession:', err);
    return null;
  }
}

// Sign up new user
export async function registerUser(email, password, name) {
  if (!supabaseClient) throw new Error('Database not connected');
  
  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        name: name
      }
    }
  });

  if (error) throw error;
  return data;
}

// Sign in existing user
export async function loginUser(email, password, rememberMe = true) {
  if (!supabaseClient) throw new Error('Database not connected');

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  // Manage persistent session
  if (!rememberMe) {
    // Session is default managed by Supabase client (usually local storage).
    // Note: Supabase handles persistence automatically, but we can store a custom flag if needed.
  }
  
  return data;
}

// Log out user
export async function logoutUser() {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) console.error('Error signing out:', error);
  window.location.href = 'login.html';
}

// Request password reset email
export async function sendPasswordResetEmail(email) {
  if (!supabaseClient) throw new Error('Database not connected');
  
  const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/profile.html?reset=true`
  });

  if (error) throw error;
  return data;
}

// Update user password
export async function updateUserPassword(newPassword) {
  if (!supabaseClient) throw new Error('Database not connected');

  const { data, error } = await supabaseClient.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
  return data;
}

// Route Protection Logic
export async function protectRoute() {
  // Hide body to prevent content flash before session check completes
  document.documentElement.style.opacity = '0';
  
  const session = await checkSession();
  const path = window.location.pathname;
  const currentPage = path.substring(path.lastIndexOf('/') + 1);

  // If we are on the entry gatekeeper pages, redirect based on session presence
  const isGatekeeperPage = ['index.html', ''].includes(currentPage);
  if (isGatekeeperPage) {
    if (session) {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'login.html';
    }
    return;
  }

  const publicPages = ['login.html', 'register.html'];
  const isPublicPage = publicPages.includes(currentPage);

  if (!session && !isPublicPage) {
    // Not logged in, trying to access protected page -> Login
    window.location.href = 'login.html';
  } else if (session && isPublicPage) {
    // Logged in, trying to access login/register -> Dashboard
    window.location.href = 'dashboard.html';
  } else {
    // Make document visible again
    document.documentElement.style.opacity = '1';
    document.documentElement.style.transition = 'opacity 0.25s ease';
  }
}

// Run protection as soon as file is imported
if (supabaseClient) {
  protectRoute();
}
