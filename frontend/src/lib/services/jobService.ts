import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';

// Get jobs with filters
export async function getJobs(params = {}) {
  const { search, companyId, location, remote, employmentType, experienceLevel, minSalary,
    maxSalary, skillsRequired, featured, recent, page = 1, limit = 10 } = params;

  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (companyId) queryParams.append('companyId', companyId);
  if (location) queryParams.append('location', location);
  if (remote) queryParams.append('remote', remote);
  if (minSalary) queryParams.append('minSalary', minSalary);
  if (maxSalary) queryParams.append('maxSalary', maxSalary);
  if (featured) queryParams.append('featuredOnly', featured);
  if (recent) queryParams.append('recent', recent);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  // Handle arrays
  if (employmentType && employmentType.length) {
    if (Array.isArray(employmentType)) {
      employmentType.forEach(type => queryParams.append('employmentType', type));
    } else {
      queryParams.append('employmentType', employmentType);
    }
  }

  if (experienceLevel && experienceLevel.length) {
    if (Array.isArray(experienceLevel)) {
      experienceLevel.forEach(level => queryParams.append('experienceLevel', level));
    } else {
      queryParams.append('experienceLevel', experienceLevel);
    }
  }

  if (skillsRequired && skillsRequired.length) {
    if (Array.isArray(skillsRequired)) {
      skillsRequired.forEach(skill => queryParams.append('skillsRequired', skill));
    } else {
      queryParams.append('skillsRequired', skillsRequired);
    }
  }

  const url = `${API_URL}/jobs?${queryParams.toString()}`;

  const token = get(authToken);
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch jobs');
  }

  return response.json();
}

// Get a job by ID or slug
export async function getJob(idOrSlug: string) {
  const token = get(authToken);
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/jobs/${idOrSlug}`, { headers });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch job');
  }

  return response.json();
}

// Create a job
export async function createJob(jobData: any) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jobData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create job');
  }

  return response.json();
}

// Update a job
export async function updateJob(id: string, jobData: any) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/jobs/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jobData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update job');
  }

  return response.json();
}

// Delete a job
export async function deleteJob(id: string) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/jobs/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete job');
  }

  return true;
}

// Save/bookmark a job
export async function saveJob(jobId: string) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/jobs/${jobId}/save`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save job');
  }

  return true;
}

// Unsave/unbookmark a job
export async function unsaveJob(jobId: string) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/jobs/${jobId}/unsave`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to unsave job');
  }

  return true;
}

// Apply to a job
export async function applyToJob(jobId: string, applicationData: any) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/jobs/${jobId}/apply`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(applicationData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to apply to job');
  }

  return response.json();
}

// Get user's job applications
export async function getUserApplications(params = {}) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const { status, page = 1, limit = 10 } = params;

  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  const url = `${API_URL}/jobs/applications/me?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch applications');
  }

  return response.json();
}

// Get applications for a job (for employers)
export async function getJobApplications(jobId: string, params = {}) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const { status, page = 1, limit = 10 } = params;

  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  const url = `${API_URL}/jobs/${jobId}/applications?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch job applications');
  }

  return response.json();
}

// Update application status (for employers)
export async function updateApplicationStatus(applicationId: string, status: string, notes?: string) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/jobs/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status, notes })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update application status');
  }

  return response.json();
}

// Get saved/bookmarked jobs
export async function getSavedJobs(params = {}) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const { page = 1, limit = 10 } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  const url = `${API_URL}/jobs/saved?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch saved jobs');
  }

  return response.json();
}