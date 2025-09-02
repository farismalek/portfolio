import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';
import type { Project } from '$lib/types/workspace';

// Get projects for a workspace
export async function getProjectsForWorkspace(workspaceId: string): Promise<Project[]> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/workspaces/${workspaceId}/projects`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch projects');
  }

  return response.json();
}

// Get a specific project
export async function getProject(id: string): Promise<Project> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/projects/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch project');
  }

  return response.json();
}

// Create a new project
export async function createProject(projectData: {
  workspaceId: string;
  name: string;
  description?: string;
  status: string;
  createdById: string;
  startDate?: string;
  dueDate?: string;
  settings?: Record<string, any>;
}): Promise<Project> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(projectData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create project');
  }

  return response.json();
}

// Update a project
export async function updateProject(
  id: string,
  projectData: Partial<Project>
): Promise<Project> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(projectData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update project');
  }

  return response.json();
}

// Delete a project
export async function deleteProject(id: string): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete project');
  }

  return true;
}