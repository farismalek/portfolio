import { subscriptionStore } from '$lib/stores/subscriptionStore';
import { get } from 'svelte/store';

/**
 * Directive to show/hide elements based on feature access
 * Usage: <div use:featureAccess={'premium_templates'}>Premium content</div>
 */
export function featureAccess(node: HTMLElement, featureKey: string) {
  let hasAccess = false;
  let unsubscribe: () => void;

  // Function to check access and update DOM
  async function checkAccess() {
    // First hide the element
    node.style.display = 'none';

    // Check if the user has access to the feature
    hasAccess = await subscriptionStore.checkFeatureAccess(featureKey);

    // Show the element if the user has access
    if (hasAccess) {
      node.style.display = '';
    }
  }

  // Check access on initialization
  checkAccess();

  // Subscribe to subscription store changes
  unsubscribe = subscriptionStore.subscribe(() => {
    checkAccess();
  });

  return {
    update(newFeatureKey: string) {
      featureKey = newFeatureKey;
      checkAccess();
    },
    destroy() {
      if (unsubscribe) unsubscribe();
    }
  };
}

/**
 * Directive to show element only when feature is NOT accessible
 * Usage: <div use:featureUpsell={'premium_templates'}>Upgrade to access</div>
 */
export function featureUpsell(node: HTMLElement, featureKey: string) {
  let hasAccess = false;
  let unsubscribe: () => void;

  // Function to check access and update DOM
  async function checkAccess() {
    // First hide the element
    node.style.display = 'none';

    // Check if the user has access to the feature
    hasAccess = await subscriptionStore.checkFeatureAccess(featureKey);

    // Show the element if the user does NOT have access
    if (!hasAccess) {
      node.style.display = '';
    }
  }

  // Check access on initialization
  checkAccess();

  // Subscribe to subscription store changes
  unsubscribe = subscriptionStore.subscribe(() => {
    checkAccess();
  });

  return {
    update(newFeatureKey: string) {
      featureKey = newFeatureKey;
      checkAccess();
    },
    destroy() {
      if (unsubscribe) unsubscribe();
    }
  };
}