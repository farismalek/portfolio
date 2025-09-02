import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';

// Get projects with filters
export async function getProjects(params = {}) {
  const { search, category, skills, budgetMin, budgetMax, complexity, duration,
    companyId, clientId, page = 1, limit = 10, recent, featuredOnly } = params;

  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (companyId) queryParams.append('companyId', companyId);
  if (clientId) queryParams.append('clientId', clientId);
  if (budgetMin) queryParams.append('budgetMin', budgetMin);
  if (budgetMax) queryParams.append('budgetMax', budgetMax);
  if (featuredOnly) queryParams.append('featuredOnly', featuredOnly);
  if (recent) queryParams.append('recent', recent);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  // Handle arrays and complex types
  if (category && category.length) {
    if (Array.isArray(category)) {
      category.forEach(cat => queryParams.append('category', cat));
    } else {
      queryParams.append('category', category);
    }
  }

  if (complexity && complexity.length) {
    if (Array.isArray(complexity)) {
      complexity.forEach(comp => queryParams.append('complexity', comp));
    } else {
      queryParams.append('complexity', complexity);
    }
  }

  if (duration && duration.length) {
    if (Array.isArray(duration)) {
      duration.forEach(dur => queryParams.append('duration', dur));
    } else {
      queryParams.append('duration', duration);
    }
  }

  if (skills && skills.length) {
    if (Array.isArray(skills)) {
      skills.forEach(skill => queryParams.append('skills', skill));
    } else {
      queryParams.append('skills', skills);
    }
  }

  const url = `${API_URL}/freelance/projects?${queryParams.toString()}`;

  const token = get(authToken);
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch projects');
  }

  return response.json();
}

// Get a project by ID or slug
export async function getProject(idOrSlug: string) {
  const token = get(authToken);
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/freelance/projects/${idOrSlug}`, { headers });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch project');
  }

  return response.json();
}

// Create a project
export async function createProject(projectData: any) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/projects`, {
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
export async function updateProject(id: string, projectData: any) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/projects/${id}`, {
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

// Submit a proposal for a project
export async function submitProposal(projectId: string, proposalData: any) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/projects/${projectId}/proposals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(proposalData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit proposal');
  }

  return response.json();
}

// Get proposals for a project (for project owner)
export async function getProjectProposals(projectId: string, params = {}) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const { status, page = 1, limit = 10 } = params;

  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  const url = `${API_URL}/freelance/projects/${projectId}/proposals?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch proposals');
  }

  return response.json();
}

// Get proposals submitted by freelancer
export async function getFreelancerProposals(params = {}) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const { status, page = 1, limit = 10 } = params;

  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  const url = `${API_URL}/freelance/proposals/me?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch proposals');
  }

  return response.json();
}

// Update proposal status
export async function updateProposalStatus(proposalId: string, status: string) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/proposals/${proposalId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update proposal status');
  }

  return response.json();
}

// Accept a proposal and create contract
export async function acceptProposal(proposalId: string) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/proposals/${proposalId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to accept proposal');
  }

  return response.json();
}