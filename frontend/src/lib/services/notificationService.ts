import { API_URL } from '$lib/config';
import type { Notification } from '$lib/types/network';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';

// Get all notifications for current user
export async function getNotifications(page = 1, limit = 20): Promise<{ notifications: Notification[], total: number }> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/notifications?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get notifications');
  }

  return response.json();
}

// Get unread notifications count
export async function getUnreadCount(): Promise<number> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/notifications/unread-count`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get unread count');
  }

  const data = await response.json();
  return data.count;
}

// Mark specific notifications as read
export async function markAsRead(notificationIds: string[]): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/notifications/mark-read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ ids: notificationIds })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to mark notifications as read');
  }

  return true;
}

// Mark all notifications as read
export async function markAllAsRead(): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to mark all notifications as read');
  }

  return true;
}

// Delete a notification
export async function deleteNotification(id: string): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/notifications/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete notification');
  }

  return true;
}