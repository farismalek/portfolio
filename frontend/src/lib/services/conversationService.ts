import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';
import type { Conversation, ConversationType } from '$lib/types/network';

// Get all conversations for current user
export async function getAllConversations(): Promise<Conversation[]> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/conversations`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch conversations');
  }

  return response.json();
}

// Get a single conversation
export async function getConversation(id: string): Promise<Conversation> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/conversations/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch conversation');
  }

  return response.json();
}

// Create a new conversation
export async function createConversation(conversationData: {
  type: ConversationType;
  title?: string;
  createdById: string;
  participantIds: string[];
  metadata?: Record<string, any>;
}): Promise<Conversation> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/conversations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(conversationData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create conversation');
  }

  return response.json();
}

// Update a conversation
export async function updateConversation(
  id: string,
  conversationData: {
    title?: string;
    metadata?: Record<string, any>;
  }
): Promise<Conversation> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/conversations/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(conversationData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update conversation');
  }

  return response.json();
}

// Add participants to a conversation
export async function addConversationParticipants(
  conversationId: string,
  participantIds: string[]
): Promise<Conversation> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/conversations/${conversationId}/participants`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ participantIds })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add participants');
  }

  return response.json();
}

// Remove a participant from a conversation
export async function removeConversationParticipant(
  conversationId: string,
  participantUserId: string
): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/conversations/${conversationId}/participants/${participantUserId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove participant');
  }

  return true;
}

// Mark a conversation as read
export async function markConversationAsRead(conversationId: string): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to mark conversation as read');
  }

  return true;
}

// Delete a conversation
export async function deleteConversation(id: string): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/conversations/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete conversation');
  }

  return true;
}