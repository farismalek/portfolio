import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';
import type { Workspace } from '$lib/types/workspace';

// Get all workspaces for the current user
export async function getAllWorkspaces(): Promise<Workspace[]> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/workspaces`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch workspaces');
  }

  return response.json();
}

// Get a specific workspace by ID
export async function getWorkspace(id: string): Promise<Workspace> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/workspaces/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch workspace');
  }

  return response.json();
}

// Create a new workspace
export async function createWorkspace(workspaceData: {
  name: string;
  description?: string;
  ownerId: string;
  avatarUrl?: string;
  settings?: Record<string, any>;
}): Promise<Workspace> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/workspaces`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(workspaceData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create workspace');
  }

  return response.json();
}

// Update a workspace
export async function updateWorkspace(
  id: string,
  workspaceData: Partial<Workspace>
): Promise<Workspace> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/workspaces/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(workspaceData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update workspace');
  }

  return response.json();
}

// Delete a workspace
export async function deleteWorkspace(id: string): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/workspaces/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete workspace');
  }

  return true;
}

// Add members to a workspace
export async function addWorkspaceMembers(
  workspaceId: string,
  data: { userIds: string[]; role: string }
): Promise<any[]> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/workspaces/${workspaceId}/members`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add members to workspace');
  }

  return response.json();
}

// Update a member's role
export async function updateWorkspaceMember(
  workspaceId: string,
  memberId: string,
  role: string
): Promise<any> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/workspaces/${workspaceId}/members/${memberId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update member role');
  }

  return response.json();
}

// Remove a member from a workspace
export async function removeWorkspaceMember(
  workspaceId: string,
  memberId: string
): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/workspaces/${workspaceId}/members/${memberId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove member from workspace');
  }

  return true;
}

// Leave a workspace
export async function leaveWorkspace(workspaceId: string): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/workspaces/${workspaceId}/leave`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to leave workspace');
  }

  return true;
}