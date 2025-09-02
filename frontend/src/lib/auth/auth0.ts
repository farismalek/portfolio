import { createAuth0Client, Auth0Client, User } from '@auth0/auth0-spa-js';
import { writable, derived } from 'svelte/store';
import { goto } from '$app/navigation';

const AUTH0_DOMAIN = 'portfolia.us.auth0.com';
const AUTH0_CLIENT_ID = 'YOUR_AUTH0_CLIENT_ID';
const AUTH0_CALLBACK_URL = 'http://localhost:5173/auth/callback';
const AUTH0_AUDIENCE = 'https://api.portfolia.com';

// Store for the Auth0 client
export const auth0Client = writable<Auth0Client | null>(null);

// Store for the authenticated state
export const isAuthenticated = writable(false);

// Store for the user profile
export const user = writable<User | null>(null);

// Store for loading state
export const authLoading = writable(true);

// Store for authentication error
export const authError = writable<Error | null>(null);

// Derived store that returns the auth token
export const authToken = derived([auth0Client, isAuthenticated], async ([$auth0Client, $isAuthenticated]) => {
  if (!$isAuthenticated || !$auth0Client) return null;
  return await $auth0Client.getTokenSilently();
});

// Initialize the Auth0 client
export const initAuth0 = async () => {
  try {
    authLoading.set(true);
    const client = await createAuth0Client({
      domain: AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      authorizationParams: {
        redirect_uri: AUTH0_CALLBACK_URL,
        audience: AUTH0_AUDIENCE,
      },
      cacheLocation: 'localstorage',
      useRefreshTokens: true,
    });

    auth0Client.set(client);

    // Check if the user is authenticated
    const isAuthenticatedResult = await client.isAuthenticated();
    isAuthenticated.set(isAuthenticatedResult);

    // If authenticated, fetch the user profile
    if (isAuthenticatedResult) {
      const userProfile = await client.getUser();
      user.set(userProfile);
    }

    // Check for authentication callback
    if (window.location.pathname === '/auth/callback' && window.location.search) {
      await client.handleRedirectCallback();
      isAuthenticated.set(true);
      const userProfile = await client.getUser();
      user.set(userProfile);
      goto('/dashboard');
    }
  } catch (err) {
    authError.set(err as Error);
    console.error('Auth0 initialization error:', err);
  } finally {
    authLoading.set(false);
  }
};

// Login function
export const login = () => {
  auth0Client.subscribe(async (client) => {
    if (!client) return;
    await client.loginWithRedirect();
  });
};

// Logout function
export const logout = () => {
  auth0Client.subscribe(async (client) => {
    if (!client) return;
    await client.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
    user.set(null);
    isAuthenticated.set(false);
  });
};

// Check authentication status
export const checkAuth = async () => {
  auth0Client.subscribe(async (client) => {
    if (!client) return;
    try {
      const isAuthenticatedResult = await client.isAuthenticated();
      isAuthenticated.set(isAuthenticatedResult);
      if (isAuthenticatedResult) {
        const userProfile = await client.getUser();
        user.set(userProfile);
      }
    } catch (err) {
      console.error('Auth check error:', err);
    }
  });
};