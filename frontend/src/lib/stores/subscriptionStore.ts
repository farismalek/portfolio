import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { authStore } from './authStore';
import {
  fetchCurrentSubscription,
  fetchSubscriptionPlans,
  checkFeatureAccess
} from '$lib/services/subscriptionService';
import type {
  Subscription,
  SubscriptionPlan,
  SubscriptionFeature
} from '$lib/types/subscription';

// Initialize the store with default values
function createSubscriptionStore() {
  const { subscribe, set, update } = writable({
    subscription: null as Subscription | null,
    plans: [] as SubscriptionPlan[],
    loading: false,
    error: null as string | null,
    featureAccess: new Map<string, boolean>()
  });

  return {
    subscribe,

    /**
     * Initialize the subscription store
     */
    init: async () => {
      // Only load data in the browser
      if (!browser) return;

      // Check if the user is logged in
      if (!authStore.isAuthenticated()) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        // Fetch subscription plans
        const plans = await fetchSubscriptionPlans();

        // Fetch the user's current subscription
        const subscription = await fetchCurrentSubscription();

        update(state => ({
          ...state,
          subscription,
          plans,
          loading: false
        }));
      } catch (error) {
        console.error('Error initializing subscription store:', error);
        update(state => ({
          ...state,
          error: error.message || 'Failed to load subscription data',
          loading: false
        }));
      }
    },

    /**
     * Refresh the user's current subscription
     */
    refreshSubscription: async () => {
      if (!browser || !authStore.isAuthenticated()) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const subscription = await fetchCurrentSubscription();
        update(state => ({ ...state, subscription, loading: false }));
      } catch (error) {
        console.error('Error refreshing subscription:', error);
        update(state => ({
          ...state,
          error: error.message || 'Failed to refresh subscription',
          loading: false
        }));
      }
    },

    /**
     * Check if the user has access to a specific feature
     */
    checkFeatureAccess: async (featureKey: string) => {
      if (!browser || !authStore.isAuthenticated()) return false;

      update(state => {
        // Check if we already have this feature access cached
        if (state.featureAccess.has(featureKey)) {
          return state;
        }

        return { ...state, loading: true };
      });

      try {
        const hasAccess = await checkFeatureAccess(featureKey);

        update(state => {
          // Cache the feature access result
          const updatedFeatureAccess = new Map(state.featureAccess);
          updatedFeatureAccess.set(featureKey, hasAccess);

          return {
            ...state,
            featureAccess: updatedFeatureAccess,
            loading: false
          };
        });

        return hasAccess;
      } catch (error) {
        console.error(`Error checking access to feature ${featureKey}:`, error);
        update(state => ({ ...state, loading: false }));
        return false;
      }
    },

    /**
     * Clear the subscription store
     */
    reset: () => {
      set({
        subscription: null,
        plans: [],
        loading: false,
        error: null,
        featureAccess: new Map<string, boolean>()
      });
    }
  };
}

// Create the store
export const subscriptionStore = createSubscriptionStore();

// Derived store that returns true if the user has an active subscription
export const hasActiveSubscription = derived(
  subscriptionStore,
  ($subscriptionStore) => {
    return !!$subscriptionStore.subscription &&
      $subscriptionStore.subscription.status === 'active';
  }
);

// Derived store that returns the user's current plan
export const currentPlan = derived(
  subscriptionStore,
  ($subscriptionStore) => {
    if (!$subscriptionStore.subscription) return null;

    // Find the plan details in the plans array
    return $subscriptionStore.plans.find(
      plan => plan.id === $subscriptionStore.subscription?.planId
    ) || null;
  }
);

// Initialize the subscription store when auth state changes
authStore.subscribe(($authStore) => {
  if ($authStore.isAuthenticated) {
    subscriptionStore.init();
  } else {
    subscriptionStore.reset();
  }
});