import { API_URL } from '$lib/config';
import type { Connection, FollowStatus } from '$lib/types/network';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';

export async function createConnection(input: {
  followerId: string;
  followingId: string;
  type: string;
}): Promise<Connection> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/connections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create connection');
  }

  return response.json();
}

export async function updateConnection(
  connectionId: string,
  input: { status: string }
): Promise<Connection> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/connections/${connectionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update connection');
  }

  return response.json();
}

export async function removeConnection(connectionId: string): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/connections/${connectionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove connection');
  }

  return true;
}

export async function checkFollowStatus(followerId: string, followingId: string): Promise<FollowStatus> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/connections/status?followerId=${followerId}&followingId=${followingId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to check follow status');
  }

  return response.json();
}

export async function getFollowers(userId: string, page = 1, limit = 20): Promise<{ connections: Connection[], total: number }> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/connections/followers/${userId}?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get followers');
  }

  return response.json();
}

export async function getFollowing(userId: string, page = 1, limit = 20): Promise<{ connections: Connection[], total: number }> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/connections/following/${userId}?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get following users');
  }

  return response.json();
}

export async function getSuggestedConnections(limit = 10): Promise<any[]> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/connections/suggestions?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get suggested connections');
  }

  return response.json();
}