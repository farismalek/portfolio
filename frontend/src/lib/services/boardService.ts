import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';
import type { CollaborativeBoard, BoardType } from '$lib/types/workspace';

// Get boards for a workspace or project
export async function getBoards(options: {
  workspaceId?: string;
  projectId?: string;
  type?: BoardType;
}): Promise<CollaborativeBoard[]> {
  const token = await get(authToken);

  // Build query parameters
  const params = new URLSearchParams();
  if (options.workspaceId) params.append('workspaceId', options.workspaceId);
  if (options.projectId) params.append('projectId', options.projectId);
  if (options.type) params.append('type', options.type);

  const url = `${API_URL}/boards?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch boards');
  }

  return response.json();
}

// Get a specific board
export async function getBoard(id: string): Promise<CollaborativeBoard> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/boards/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch board');
  }

  return response.json();
}

// Create a new board
export async function createBoard(boardData: {
  workspaceId?: string;
  projectId?: string;
  title: string;
  description?: string;
  type: BoardType;
  createdById: string;
  content?: any;
  settings?: Record<string, any>;
}): Promise<CollaborativeBoard> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/boards`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(boardData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create board');
  }

  return response.json();
}

// Update a board
export async function updateBoard(
  id: string,
  boardData: Partial<CollaborativeBoard>
): Promise<CollaborativeBoard> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/boards/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(boardData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update board');
  }

  return response.json();
}

// Update board content (real-time)
export async function updateBoardContent(
  id: string,
  content: any
): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/boards/${id}/content`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update board content');
  }

  return true;
}

// Delete a board
export async function deleteBoard(id: string): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/boards/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete board');
  }

  return true;
}