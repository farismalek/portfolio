import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';

// Get contracts with filters
export async function getContracts(params = {}) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const { role, status, companyId, page = 1, limit = 10 } = params;

  const queryParams = new URLSearchParams();
  if (role) queryParams.append('role', role);
  if (companyId) queryParams.append('companyId', companyId);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  // Handle array status
  if (status && status.length) {
    if (Array.isArray(status)) {
      status.forEach(s => queryParams.append('status', s));
    } else {
      queryParams.append('status', status);
    }
  }

  const url = `${API_URL}/freelance/contracts?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch contracts');
  }

  return response.json();
}

// Get a contract by ID
export async function getContract(id: string) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/contracts/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch contract');
  }

  return response.json();
}

// Create a contract
export async function createContract(contractData: any) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/contracts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(contractData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create contract');
  }

  return response.json();
}

// Update a contract
export async function updateContract(id: string, contractData: any) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/contracts/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(contractData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update contract');
  }

  return response.json();
}

// Sign a contract
export async function signContract(id: string) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/contracts/${id}/sign`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sign contract');
  }

  return response.json();
}

// Cancel a contract
export async function cancelContract(id: string, reason: string) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/contracts/${id}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to cancel contract');
  }

  return response.json();
}

// Complete a contract
export async function completeContract(id: string) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/contracts/${id}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to complete contract');
  }

  return response.json();
}

// Create a milestone
export async function createMilestone(contractId: string, milestoneData: any) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/contracts/${contractId}/milestones`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(milestoneData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create milestone');
  }

  return response.json();
}

// Update milestone status
export async function updateMilestoneStatus(milestoneId: string, status: string, data: any = {}) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/milestones/${milestoneId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status,
      ...data
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update milestone status');
  }

  return response.json();
}

// Submit a time log
export async function submitTimeLog(contractId: string, timeLogData: any) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/contracts/${contractId}/time-logs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(timeLogData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit time log');
  }

  return response.json();
}

// Get time logs for a contract
export async function getTimeLogs(contractId: string, params = {}) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const { startDate, endDate, status, page = 1, limit = 20 } = params;

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  if (status) queryParams.append('status', status);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  const url = `${API_URL}/freelance/contracts/${contractId}/time-logs?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch time logs');
  }

  return response.json();
}

// Approve or reject time log
export async function updateTimeLogStatus(timeLogId: string, isApproved: boolean, rejectionReason?: string) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/freelance/time-logs/${timeLogId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      isApproved,
      rejectionReason
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update time log status');
  }

  return response.json();
}