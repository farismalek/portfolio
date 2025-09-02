import { API_URL } from '$lib/config';
import type { Post, Reaction, Comment } from '$lib/types/network';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';

// Create a new post
export async function createPost(input: {
  userId: string;
  content?: string;
  title?: string;
  type?: string;
  media?: any;
  portfolioId?: string;
  parentId?: string;
  visibility?: string;
}): Promise<Post> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create post');
  }

  return response.json();
}

// Get a single post by ID
export async function getPost(id: string): Promise<Post> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/posts/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get post');
  }

  return response.json();
}

// Get posts with various filters
export async function getPosts(params: {
  userId?: string;
  type?: string;
  visibility?: string;
  portfolioId?: string;
  hashtag?: string;
  page?: number;
  limit?: number;
}): Promise<{ posts: Post[], total: number }> {
  const token = await get(authToken);

  // Build query string
  const queryParams = new URLSearchParams();
  if (params.userId) queryParams.set('userId', params.userId);
  if (params.type) queryParams.set('type', params.type);
  if (params.visibility) queryParams.set('visibility', params.visibility);
  if (params.portfolioId) queryParams.set('portfolioId', params.portfolioId);
  if (params.hashtag) queryParams.set('hashtag', params.hashtag);
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());

  const queryString = queryParams.toString();

  const response = await fetch(`${API_URL}/posts?${queryString}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get posts');
  }

  return response.json();
}

// Update a post
export async function updatePost(id: string, input: {
  title?: string;
  content?: string;
  media?: any;
  status?: string;
  visibility?: string;
}): Promise<Post> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/posts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update post');
  }

  return response.json();
}

// Delete a post
export async function deletePost(id: string): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/posts/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete post');
  }

  return true;
}

// Get comments for a post
export async function getComments(postId: string, page = 1, limit = 20): Promise<{ comments: Comment[], total: number }> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/posts/${postId}/comments?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get comments');
  }

  return response.json();
}

// Create a reaction (like) on a post
export async function createReaction(input: {
  userId: string;
  postId: string;
  type: string;
}): Promise<Reaction> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/posts/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create reaction');
  }

  return response.json();
}

// Create a comment on a post
export async function createComment(input: {
  userId: string;
  postId: string;
  content: string;
  parentId?: string;
}): Promise<Comment> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/posts/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create comment');
  }

  return response.json();
}

// Get trending posts
export async function getTrendingPosts(page = 1, limit = 10): Promise<Post[]> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/posts/trending?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get trending posts');
  }

  return response.json();
}