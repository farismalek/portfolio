import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get } from 'svelte/store';
import { isAuthenticated, authLoading } from '$lib/stores/authStore';

export async function requireAuth() {
  if (!browser) {
    return { status: 302, redirect: '/auth/login' };
  }

  // Wait for authentication to complete loading
  let loading = get(authLoading);
  const startTime = Date.now();
  const timeout = 5000; // 5 seconds max wait

  while (loading && Date.now() - startTime < timeout) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    loading = get(authLoading);
  }

  const authenticated = get(isAuthenticated);

  if (!authenticated) {
    // Store the intended URL to redirect back after login
    const currentPath = get(page).url.pathname;
    if (currentPath !== '/auth/login' && currentPath !== '/auth/signup') {
      sessionStorage.setItem('authRedirect', currentPath);
    }

    return { status: 302, redirect: '/auth/login' };
  }
}