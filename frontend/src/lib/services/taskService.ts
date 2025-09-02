import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';
import type { Task, TaskStatus, TaskPriority } from '$lib/types/workspace';

// Get tasks for a workspace or project
export async function getTasks(options: {
  workspaceId: string;
  projectId?: string;
  status?: TaskStatus;
  assignedToId?: string;
}): Promise<Task[]> {
  const token = await get(authToken);

  // Build query parameters
  const params = new URLSearchParams();
  if (options.projectId) params.append('projectId', options.projectId);
  if (options.status) params.append('status', options.status);
  if (options.assignedToId) params.append('assignedToId', options.assignedToId);

  const url = `${API_URL}/workspaces/${options.workspaceId}/tasks?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch tasks');
  }

  return response.json();
}

// Get a specific task
export async function getTask(id: string): Promise<Task> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/tasks/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch task');
  }

  return response.json();
}

// Create a new task
export async function createTask(taskData: {
  workspaceId: string;
  projectId?: string;
  parentId?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  createdById: string;
  assignedToId?: string;
  dueDate?: string;
  metadata?: Record<string, any>;
  orderIndex?: number;
}): Promise<Task> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create task');
  }

  return response.json();
}

// Update a task
export async function updateTask(
  id: string,
  taskData: Partial<Task>
): Promise<Task> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update task');
  }

  return response.json();
}

// Delete a task
export async function deleteTask(id: string): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete task');
  }

  return true;
}

// Add a comment to a task
export async function addTaskComment(
  taskId: string,
  userId: string,
  content: string
): Promise<any> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, content })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add comment');
  }

  return response.json();
}

// Get comments for a task
export async function getTaskComments(taskId: string): Promise<any[]> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/tasks/${taskId}/comments`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch comments');
  }

  return response.json();
}

// Reorder tasks
export async function reorderTasks(
  workspaceId: string,
  taskIds: string[],
  status?: TaskStatus
): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/workspaces/${workspaceId}/tasks/reorder`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ taskIds, status })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reorder tasks');
  }

  return true;
}