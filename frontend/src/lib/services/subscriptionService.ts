import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken, authStore } from '$lib/stores/authStore';
import type { SubscriptionPlan, Subscription, Invoice, PaymentMethod } from '$lib/types/subscription';

/**
 * Fetch available subscription plans
 */
export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await fetch(`${API_URL}/subscriptions/plans`);

  if (!response.ok) {
    throw new Error('Failed to fetch subscription plans');
  }

  return await response.json();
}

/**
 * Fetch current user's active subscription
 */
export async function fetchCurrentSubscription(): Promise<Subscription | null> {
  const token = get(authToken);
  if (!token) return null;

  const response = await fetch(`${API_URL}/subscriptions/current`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch subscription');
  }

  return await response.json();
}

/**
 * Create a new subscription
 */
export async function createSubscription(
  planId: string,
  paymentMethodId: string,
  couponCode?: string
): Promise<Subscription> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      planId,
      paymentMethodId,
      couponCode
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create subscription');
  }

  return await response.json();
}

/**
 * Update an existing subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  planId: string
): Promise<Subscription> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/subscriptions/${subscriptionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      planId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update subscription');
  }

  return await response.json();
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason?: string
): Promise<void> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      reason
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to cancel subscription');
  }
}

/**
 * Fetch user's payment methods
 */
export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/payments/methods`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch payment methods');
  }

  return await response.json();
}

/**
 * Add a new payment method
 */
export async function addPaymentMethod(
  paymentMethodToken: string
): Promise<PaymentMethod> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/payments/methods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      paymentMethodToken
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add payment method');
  }

  return await response.json();
}

/**
 * Remove a payment method
 */
export async function removePaymentMethod(paymentMethodId: string): Promise<void> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/payments/methods/${paymentMethodId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to remove payment method');
  }
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/payments/methods/${paymentMethodId}/default`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to set default payment method');
  }
}

/**
 * Fetch user's invoice history
 */
export async function fetchInvoices(): Promise<Invoice[]> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/payments/invoices`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch invoices');
  }

  return await response.json();
}

/**
 * Download invoice as PDF
 */
export async function downloadInvoice(invoiceId: string): Promise<Blob> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/payments/invoices/${invoiceId}/pdf`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to download invoice');
  }

  return await response.blob();
}

/**
 * Validate a coupon code
 */
export async function validateCoupon(
  code: string,
  planId?: string
): Promise<{ valid: boolean; discount?: number; message?: string }> {
  const url = new URL(`${API_URL}/payments/coupons/validate`);
  url.searchParams.append('code', code);
  if (planId) url.searchParams.append('planId', planId);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Failed to validate coupon');
  }

  return await response.json();
}

/**
 * Check if a feature is available on user's subscription
 */
export async function checkFeatureAccess(featureKey: string): Promise<boolean> {
  const token = get(authToken);
  if (!token) return false;

  const response = await fetch(`${API_URL}/subscriptions/features/${featureKey}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return false;
  }

  const result = await response.json();
  return result.hasAccess;
}

/**
 * Get subscription recommendations based on user profile
 */
export async function getSubscriptionRecommendations(): Promise<SubscriptionPlan[]> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/subscriptions/recommendations`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get subscription recommendations');
  }

  return await response.json();
}