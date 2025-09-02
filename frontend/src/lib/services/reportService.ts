import { API_URL } from '$lib/config';
import { authStore } from '$lib/stores/authStore';
import type { ReportDefinition } from '$lib/types/analytics';

/**
 * Fetch all custom reports for the current user
 */
export async function fetchReports(): Promise<ReportDefinition[]> {
  const token = authStore.getToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/analytics/reports`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch reports');
  }

  return response.json();
}

/**
 * Fetch a specific report by ID
 */
export async function fetchReport(reportId: string): Promise<ReportDefinition> {
  const token = authStore.getToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/analytics/reports/${reportId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch report');
  }

  return response.json();
}

/**
 * Create a new custom report
 */
export async function createReport(report: Omit<ReportDefinition, 'id'>): Promise<ReportDefinition> {
  const token = authStore.getToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/analytics/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(report)
  });

  if (!response.ok) {
    throw new Error('Failed to create report');
  }

  return response.json();
}

/**
 * Update an existing report
 */
export async function updateReport(reportId: string, report: Partial<ReportDefinition>): Promise<ReportDefinition> {
  const token = authStore.getToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/analytics/reports/${reportId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(report)
  });

  if (!response.ok) {
    throw new Error('Failed to update report');
  }

  return response.json();
}

/**
 * Delete a report
 */
export async function deleteReport(reportId: string): Promise<void> {
  const token = authStore.getToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/analytics/reports/${reportId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete report');
  }
}

/**
 * Run a report manually
 */
export async function runReport(reportId: string): Promise<any> {
  const token = authStore.getToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/analytics/reports/${reportId}/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to run report');
  }

  return response.json();
}

/**
 * Export a report in the specified format
 */
export async function exportReport(reportId: string, format: 'pdf' | 'csv' | 'excel'): Promise<Blob> {
  const token = authStore.getToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/analytics/reports/${reportId}/export?format=${format}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to export report as ${format}`);
  }

  return response.blob();
}

/**
 * Get available metrics for report building
 */
export async function getAvailableMetrics(): Promise<{
  category: string;
  metrics: Array<{ id: string; name: string; description: string }>
}[]> {
  const token = authStore.getToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/analytics/metrics`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch available metrics');
  }

  return response.json();
}