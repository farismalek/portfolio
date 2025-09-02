import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';

// Search users
export async function searchUsers(query: string, page = 1, limit = 10): Promise<{ users: any[], total: number }> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/search/users?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to search users');
  }

  return response.json();
}

// Search posts
export async function searchPosts(query: string, page = 1, limit = 10): Promise<{ posts: any[], total: number }> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/search/posts?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to search posts');
  }

  return response.json();
}

// Search portfolios
export async function searchPortfolios(query: string, page = 1, limit = 10): Promise<{ portfolios: any[], total: number }> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/search/portfolios?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to search portfolios');
  }

  return response.json();
}

// Get trending hashtags
export async function getTrendingHashtags(limit = 5): Promise<any[]> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/hashtags/trending?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get trending hashtags');
  }

  return response.json();
}

// Search hashtags
export async function searchHashtags(query: string, page = 1, limit = 10): Promise<{ hashtags: any[], total: number }> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/hashtags/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to search hashtags');
  }

  return response.json();
}

// General search (all types)
export async function search(query: string, types: string[] = ['users', 'posts', 'portfolios', 'hashtags'], page = 1, limit = 10): Promise<{
  users?: any[],
  posts?: any[],
  portfolios?: any[],
  hashtags?: any[]
}> {
  const token = await get(authToken);

  const typesParam = types.join(',');
  const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&types=${typesParam}&page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to search');
  }

  return response.json();
}