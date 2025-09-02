import { authToken } from '$lib/auth/auth0';
import { get } from 'svelte/store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql';

// Type definitions
export interface Profile {
  id: string;
  title: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  location?: string;
  websiteUrl?: string;
  skills?: string[];
  isDefault: boolean;
  theme: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileInput {
  title: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  location?: string;
  websiteUrl?: string;
  skills?: string[];
  theme?: string;
}

export interface UpdateProfileInput extends Partial<CreateProfileInput> {
  id: string;
}

// Fetch all profiles for the current user
export async function fetchProfiles(): Promise<Profile[]> {
  const token = await get(authToken);
  if (!token) throw new Error('Authentication required');

  const query = `
    query GetProfiles {
      profiles {
        id
        title
        bio
        avatarUrl
        coverImageUrl
        location
        websiteUrl
        skills
        isDefault
        theme
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

  return result.data.profiles;
}

// Fetch a single profile by ID
export async function fetchProfile(id: string): Promise<Profile> {
  const token = await get(authToken);
  if (!token) throw new Error('Authentication required');

  const query = `
    query GetProfile($id: ID!) {
      profile(id: $id) {
        id
        title
        bio
        avatarUrl
        coverImageUrl
        location
        websiteUrl
        skills
        isDefault
        theme
        createdAt
        updatedAt
        user {
          id
          username
          fullName
        }
      }
    }
  `;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query,
      variables: { id }
    })
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data.profile;
}

// Create a new profile
export async function createProfile(input: CreateProfileInput): Promise<Profile> {
  const token = await get(authToken);
  if (!token) throw new Error('Authentication required');

  const query = `
    mutation CreateProfile($input: CreateProfileInput!) {
      createProfile(createProfileInput: $input) {
        id
        title
        bio
        avatarUrl
        coverImageUrl
        location
        websiteUrl
        skills
        isDefault
        theme
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
    body: JSON.stringify({
      query,
      variables: { input }
    })
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data.createProfile;
}

// Update an existing profile
export async function updateProfile(input: UpdateProfileInput): Promise<Profile> {
  const token = await get(authToken);
  if (!token) throw new Error('Authentication required');

  const query = `
    mutation UpdateProfile($input: UpdateProfileInput!) {
      updateProfile(updateProfileInput: $input) {
        id
        title
        bio
        avatarUrl
        coverImageUrl
        location
        websiteUrl
        skills
        isDefault
        theme
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
    body: JSON.stringify({
      query,
      variables: { input }
    })
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data.updateProfile;
}

// Set a profile as default
export async function setDefaultProfile(id: string): Promise<Profile> {
  const token = await get(authToken);
  if (!token) throw new Error('Authentication required');

  const query = `
    mutation SetDefaultProfile($id: ID!) {
      setDefaultProfile(id: $id) {
        id
        isDefault
      }
    }
  `;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query,
      variables: { id }
    })
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data.setDefaultProfile;
}

// Delete a profile
export async function deleteProfile(id: string): Promise<boolean> {
  const token = await get(authToken);
  if (!token) throw new Error('Authentication required');

  const query = `
    mutation DeleteProfile($id: ID!) {
      removeProfile(id: $id)
    }
  `;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query,
      variables: { id }
    })
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data.removeProfile;
}