import { API_URL } from '$lib/config';
import type { Post } from '$lib/types/network';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';

// Get personalized feed for the current user
export async function getPersonalizedFeed(page = 1, limit = 20): Promise<Post[]> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/feed?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get personalized feed');
  }

  return response.json();
}

// Get discovery feed (trending content from across the platform)
export async function getDiscoveryFeed(page = 1, limit = 20): Promise<Post[]> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/feed/discovery?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get discovery feed');
  }

  return response.json();
}

// Get user's feed preferences
export async function getFeedPreferences(): Promise<any> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/feed/preferences`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get feed preferences');
  }

  return response.json();
}

// Update user's feed preferences
export async function updateFeedPreferences(input: {
  preferredContentTypes?: string[];
  hiddenUsers?: string[];
  prioritizedUsers?: string[];
  hiddenTags?: string[];
  prioritizedTags?: string[];
}): Promise<any> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/feed/preferences`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update feed preferences');
  }

  return response.json();
}