import { writable, derived } from 'svelte/store';
import type { User } from '@auth0/auth0-spa-js';
import { browser } from '$app/environment';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

const createAuthStore = () => {
  const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: !browser, // Start with loading true if on the client
    error: null
  };

  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,
    setUser: (user: User | null) =>
      update(state => ({ ...state, user, isAuthenticated: !!user })),
    setLoading: (isLoading: boolean) =>
      update(state => ({ ...state, isLoading })),
    setError: (error: Error | null) =>
      update(state => ({ ...state, error })),
    reset: () => set(initialState)
  };
};

export const authStore = createAuthStore();

// Create derived stores for common auth state checks
export const isAuthenticated = derived(
  authStore,
  $authStore => $authStore.isAuthenticated
);

export const isLoading = derived(
  authStore,
  $authStore => $authStore.isLoading
);

export const currentUser = derived(
  authStore,
  $authStore => $authStore.user
);