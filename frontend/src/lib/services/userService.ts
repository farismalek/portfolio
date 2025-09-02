import { authToken } from '$lib/auth/auth0';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql';

// Type definitions
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  username?: string;
}

// Get the current user's profile
export async function getCurrentUser(): Promise<User> {
  const token = await get(authToken);
  if (!token) throw new Error('Authentication required');

  const query = `
    query GetCurrentUser {
      me {
        id
        email
        username
        firstName
        lastName
        role
        emailVerified
        createdAt
        updatedAt
      }
    }
  `;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query })
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data.me;
}

// Update the current user's profile
export async function updateUser(input: UpdateUserInput): Promise<User> {
  const token = await get(authToken);
  if (!token) throw new Error('Authentication required');

  // First get the current user to get the ID
  const currentUser = await getCurrentUser();

  const query = `
    mutation UpdateUser($input: UpdateUserInput!) {
      updateUser(updateUserInput: $input) {
        id
        email
        username
        firstName
        lastName
        role
        emailVerified
        createdAt
        updatedAt
      }
    }
  `;

  const variables = {
    input: {
      id: currentUser.id,
      ...input
    }
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  // Update the auth store with the new user data
  // This is a simplified approach - in a real app, you would update more fields
  const updatedUser = result.data.updateUser;
  const currentAuthUser = get(authStore).user;

  if (currentAuthUser) {
    authStore.setUser({
      ...currentAuthUser,
      given_name: updatedUser.firstName,
      family_name: updatedUser.lastName,
      nickname: updatedUser.username,
      name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim()
    });
  }

  return updatedUser;
}