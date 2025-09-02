import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';
import type {
  CreatorProfile,
  CreatorStats,
  CreatorProduct,
  CreatorPayout,
  CreatorEarning,
  CreatorSponsor,
  AffiliateLink
} from '$lib/types/creator';

/**
 * Fetch creator profile for the current user
 */
export async function fetchMyCreatorProfile(): Promise<CreatorProfile> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/creators/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 404) {
    throw new Error('Creator profile not found');
  }

  if (!response.ok) {
    throw new Error('Failed to fetch creator profile');
  }

  return await response.json();
}

/**
 * Create or update creator profile
 */
export async function updateCreatorProfile(profile: Partial<CreatorProfile>): Promise<CreatorProfile> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/creators/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profile)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update creator profile');
  }

  return await response.json();
}

/**
 * Fetch creator earnings statistics
 */
export async function fetchCreatorStats(
  period: 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<CreatorStats> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/creators/stats?period=${period}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch creator stats');
  }

  return await response.json();
}

/**
 * Fetch creator products
 */
export async function fetchCreatorProducts(): Promise<CreatorProduct[]> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/creators/products`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch creator products');
  }

  return await response.json();
}

/**
 * Create a new product
 */
export async function createProduct(product: Partial<CreatorProduct>): Promise<CreatorProduct> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/creators/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(product)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create product');
  }

  return await response.json();
}

/**
 * Update a product
 */
export async function updateProduct(
  productId: string,
  updates: Partial<CreatorProduct>
): Promise<CreatorProduct> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/creators/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update product');
  }

  return await response.json();
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string): Promise<void> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/creators/products/${productId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete product');
  }
}

/**
 * Upload product file
 */
export async function uploadProductFile(
  productId: string,
  file: File
): Promise<{ fileUrl: string; fileSize: number }> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/creators/products/${productId}/file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload product file');
  }

  return await response.json();
}

/**
 * Upload product preview image
 */
export async function uploadProductPreview(
  productId: string,
  file: File
): Promise<{ id: string; url: string; thumbnailUrl: string }> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const formData = new FormData();
  formData.append('preview', file);

  const response = await fetch(`${API_URL}/creators/products/${productId}/previews`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload product preview');
  }

  return await response.json();
}

/**
 * Fetch creator earnings
 */
export async function fetchCreatorEarnings(
  startDate?: string,
  endDate?: string
): Promise<CreatorEarning[]> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  let url = `${API_URL}/creators/earnings`;
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch earnings');
  }

  return await response.json();
}

/**
 * Fetch creator payouts
 */
export async function fetchCreatorPayouts(): Promise<CreatorPayout[]> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/creators/payouts`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch payouts');
  }

  return await response.json();
}

/**
 * Request a payout
 */
export async function requestPayout(
  amount: number,
  paymentMethod: string
): Promise<CreatorPayout> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/creators/payouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      amount,
      paymentMethod
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request payout');
  }

  return await response.json();
}

/**
 * Fetch creator payout methods
 */
export async function fetchPayoutMethods(): Promise<Array<{
  id: string;
  type: string;
  details: Record<string, any>;
  isDefault: boolean;
}>> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/creators/payout-methods`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch payout methods');
  }

  return await response.json();
}

/**
 * Add payout method
 */
export async function addPayoutMethod(
  type: 'paypal' | 'bank' | 'stripe',
  details: Record<string, any>
): Promise<{ id: string; type: string; details: Record<string, any>; isDefault: boolean }> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/creators/payout-methods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      type,
      details
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add payout method');
  }

  return await response.json();
}

/**
 * Fetch creator sponsors
 */
export async function fetchSponsors(): Promise<CreatorSponsor[]> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/creators/sponsors`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch sponsors');
  }

  return await response.json();
}

/**
 * Generate affiliate link
 */
export async function generateAffiliateLink(
  type: 'product' | 'profile',
  targetId: string,
  customSlug?: string
): Promise<AffiliateLink> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/creators/affiliate-links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      type,
      targetId,
      customSlug
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate affiliate link');
  }

  return await response.json();
}

/**
 * Fetch affiliate links
 */
export async function fetchAffiliateLinks(): Promise<AffiliateLink[]> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/creators/affiliate-links`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch affiliate links');
  }

  return await response.json();
}