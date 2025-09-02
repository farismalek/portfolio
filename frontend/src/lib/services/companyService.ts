import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';

// Get all companies with filters
export async function getCompanies(params = {}) {
  const { search, industry, verificationStatus, page = 1, limit = 10 } = params;

  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (industry) queryParams.append('industry', industry);
  if (verificationStatus) queryParams.append('verificationStatus', verificationStatus);
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  const url = `${API_URL}/companies?${queryParams.toString()}`;

  const token = get(authToken);
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch companies');
  }

  return response.json();
}

// Get a company by ID or slug
export async function getCompany(idOrSlug: string) {
  const token = get(authToken);
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/companies/${idOrSlug}`, { headers });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch company');
  }

  return response.json();
}

// Create a company
export async function createCompany(companyData: any) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/companies`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(companyData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create company');
  }

  return response.json();
}

// Update a company
export async function updateCompany(id: string, companyData: any) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/companies/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(companyData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update company');
  }

  return response.json();
}

// Add company admin
export async function addCompanyAdmin(companyId: string, data: { userId: string, role: string, isPrimary?: boolean }) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/companies/${companyId}/admins`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add company admin');
  }

  return response.json();
}

// Remove company admin
export async function removeCompanyAdmin(companyId: string, adminId: string) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/companies/${companyId}/admins/${adminId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove company admin');
  }

  return true;
}

// Upload verification document
export async function uploadVerificationDocument(companyId: string, documentData: { documentType: string, documentUrl: string, notes?: string }) {
  const token = get(authToken);
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/companies/${companyId}/verification-documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(documentData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload verification document');
  }

  return response.json();
}