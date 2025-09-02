import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';
import type {
  AdCampaign,
  AdCreative,
  AdStats,
  AdGroup,
  AdAudience,
  AdPlacement
} from '$lib/types/advertising';

/**
 * Fetch user's ad campaigns
 */
export async function fetchAdCampaigns(): Promise<AdCampaign[]> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/ads/campaigns`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch ad campaigns');
  }

  return await response.json();
}

/**
 * Fetch a specific ad campaign
 */
export async function fetchAdCampaign(campaignId: string): Promise<AdCampaign> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/ads/campaigns/${campaignId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch ad campaign');
  }

  return await response.json();
}

/**
 * Create a new ad campaign
 */
export async function createAdCampaign(campaign: Partial<AdCampaign>): Promise<AdCampaign> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/ads/campaigns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(campaign)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create ad campaign');
  }

  return await response.json();
}

/**
 * Update an ad campaign
 */
export async function updateAdCampaign(
  campaignId: string,
  updates: Partial<AdCampaign>
): Promise<AdCampaign> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/ads/campaigns/${campaignId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update ad campaign');
  }

  return await response.json();
}

/**
 * Delete an ad campaign
 */
export async function deleteAdCampaign(campaignId: string): Promise<void> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/ads/campaigns/${campaignId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete ad campaign');
  }
}

/**
 * Fetch ad groups for a campaign
 */
export async function fetchAdGroups(campaignId: string): Promise<AdGroup[]> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/ads/campaigns/${campaignId}/groups`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch ad groups');
  }

  return await response.json();
}

/**
 * Create an ad group
 */
export async function createAdGroup(
  campaignId: string,
  adGroup: Partial<AdGroup>
): Promise<AdGroup> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/ads/campaigns/${campaignId}/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(adGroup)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create ad group');
  }

  return await response.json();
}

/**
 * Fetch ad creatives for a group
 */
export async function fetchAdCreatives(
  campaignId: string,
  groupId: string
): Promise<AdCreative[]> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/ads/campaigns/${campaignId}/groups/${groupId}/creatives`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch ad creatives');
  }

  return await response.json();
}

/**
 * Create an ad creative
 */
export async function createAdCreative(
  campaignId: string,
  groupId: string,
  creative: Partial<AdCreative>
): Promise<AdCreative> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/ads/campaigns/${campaignId}/groups/${groupId}/creatives`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(creative)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create ad creative');
  }

  return await response.json();
}

/**
 * Upload ad creative image
 */
export async function uploadAdCreativeImage(
  campaignId: string,
  groupId: string,
  file: File
): Promise<{ url: string; width: number; height: number }> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_URL}/ads/campaigns/${campaignId}/groups/${groupId}/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload ad image');
  }

  return await response.json();
}

/**
 * Fetch ad audiences
 */
export async function fetchAdAudiences(): Promise<AdAudience[]> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/ads/audiences`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch ad audiences');
  }

  return await response.json();
}

/**
 * Create an ad audience
 */
export async function createAdAudience(audience: Partial<AdAudience>): Promise<AdAudience> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/ads/audiences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(audience)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create ad audience');
  }

  return await response.json();
}

/**
 * Fetch available ad placements
 */
export async function fetchAdPlacements(): Promise<AdPlacement[]> {
  const response = await fetch(`${API_URL}/ads/placements`);

  if (!response.ok) {
    throw new Error('Failed to fetch ad placements');
  }

  return await response.json();
}

/**
 * Fetch ad campaign stats
 */
export async function fetchAdCampaignStats(
  campaignId: string,
  startDate?: string,
  endDate?: string
): Promise<AdStats> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  let url = `${API_URL}/ads/campaigns/${campaignId}/stats`;
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch ad stats');
  }

  return await response.json();
}

/**
 * Get ad campaign budget recommendation
 */
export async function getAdBudgetRecommendation(
  targetAudience: string[],
  objectives: string[]
): Promise<{
  minimumBudget: number;
  recommendedBudget: number;
  estimatedReach: { min: number; max: number };
  estimatedClicks: { min: number; max: number };
  estimatedCPC: number;
}> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/ads/budget-recommendation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      targetAudience,
      objectives
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get budget recommendation');
  }

  return await response.json();
}