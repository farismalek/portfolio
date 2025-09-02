import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';
import type { Message, MessageType } from '$lib/types/network';
import { messagingSocket } from './messagingSocket';

// Get messages for a conversation
export async function getMessages(
  conversationId: string,
  options: { limit?: number; before?: string } = {}
): Promise<Message[]> {
  const token = await get(authToken);

  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.before) params.append('before', options.before);

  const url = `${API_URL}/conversations/${conversationId}/messages?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch messages');
  }

  return response.json();
}

// Get thread messages (replies to a parent message)
export async function getThreadMessages(
  parentMessageId: string,
  options: { limit?: number; skip?: number } = {}
): Promise<Message[]> {
  const token = await get(authToken);

  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.skip) params.append('skip', options.skip.toString());

  const url = `${API_URL}/messages/${parentMessageId}/thread?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch thread messages');
  }

  return response.json();
}

// Send a message
export async function sendMessage(messageData: {
  conversationId: string;
  senderId: string;
  content?: string;
  type?: MessageType;
  media?: {
    url?: string;
    filename?: string;
    filesize?: number;
    fileType?: string;
  };
  parentId?: string;
}): Promise<Message> {
  const token = await get(authToken);

  // Check if socket is connected and working - use socket for better real-time experience
  if (messagingSocket.connected) {
    return new Promise((resolve, reject) => {
      messagingSocket.emit('message:send', messageData, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data);
        }
      });
    });
  }

  // Fallback to REST API if socket is not connected
  const response = await fetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(messageData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send message');
  }

  return response.json();
}

// Update a message
export async function updateMessage(
  id: string,
  messageData: {
    content: string;
  }
): Promise<Message> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/messages/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(messageData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update message');
  }

  return response.json();
}

// Delete a message
export async function deleteMessage(id: string): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/messages/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete message');
  }

  return true;
}

// Add a reaction to a message
export async function addMessageReaction(
  messageId: string,
  userId: string,
  reaction: string
): Promise<any> {
  const token = await get(authToken);

  // Try to use socket first
  if (messagingSocket.connected) {
    return new Promise((resolve, reject) => {
      messagingSocket.emit('message:reaction', { messageId, userId, reaction }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data);
        }
      });
    });
  }

  // Fallback to REST API
  const response = await fetch(`${API_URL}/messages/${messageId}/reactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, reaction })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add reaction');
  }

  return response.json();
}

// Mark a message as read
export async function markMessageAsRead(messageId: string): Promise<boolean> {
  const token = await get(authToken);

  // Try to use socket first for better real-time experience
  if (messagingSocket.connected) {
    messagingSocket.emit('message:read', { messageId });
    return true;
  }

  // Fallback to REST API
  const response = await fetch(`${API_URL}/messages/${messageId}/read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to mark message as read');
  }

  return true;
}