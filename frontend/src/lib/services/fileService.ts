import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';
import type { SharedFile, FileVersion } from '$lib/types/files';

// Get files with filtering
export async function getFiles(filters: {
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
  conversationId?: string;
  uploadedById?: string;
  fileType?: string;
}): Promise<SharedFile[]> {
  const token = await get(authToken);

  // Build query parameters
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  const url = `${API_URL}/files?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch files');
  }

  return response.json();
}

// Get a specific file
export async function getFile(id: string): Promise<SharedFile> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/files/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch file');
  }

  return response.json();
}

// Upload a new file
export async function uploadFile(
  file: File,
  fileData: {
    name: string;
    description?: string;
    workspaceId?: string;
    projectId?: string;
    taskId?: string;
    conversationId?: string;
    messageId?: string;
    uploadedById: string;
    metadata?: Record<string, any>;
  }
): Promise<SharedFile> {
  const token = await get(authToken);

  // First, get a pre-signed URL for upload
  const uploadUrlResponse = await fetch(`${API_URL}/files/upload-url`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    })
  });

  if (!uploadUrlResponse.ok) {
    const error = await uploadUrlResponse.json();
    throw new Error(error.message || 'Failed to get upload URL');
  }

  const { uploadUrl, filePath } = await uploadUrlResponse.json();

  // Upload the file to the pre-signed URL
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file');
  }

  // Create file record in database
  const createResponse = await fetch(`${API_URL}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...fileData,
      filePath,
      fileType: file.type,
      fileSize: file.size
    })
  });

  if (!createResponse.ok) {
    const error = await createResponse.json();
    throw new Error(error.message || 'Failed to create file record');
  }

  return createResponse.json();
}

// Update file metadata
export async function updateFile(
  id: string,
  fileData: {
    name?: string;
    description?: string;
    metadata?: Record<string, any>;
  }
): Promise<SharedFile> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/files/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fileData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update file');
  }

  return response.json();
}

// Upload a new version of a file
export async function uploadFileVersion(
  fileId: string,
  file: File,
  notes?: string
): Promise<FileVersion> {
  const token = await get(authToken);

  // First, get a pre-signed URL for upload
  const uploadUrlResponse = await fetch(`${API_URL}/files/upload-url`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      isVersion: true
    })
  });

  if (!uploadUrlResponse.ok) {
    const error = await uploadUrlResponse.json();
    throw new Error(error.message || 'Failed to get upload URL');
  }

  const { uploadUrl, filePath } = await uploadUrlResponse.json();

  // Upload the file to the pre-signed URL
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file');
  }

  // Create version record
  const createVersionResponse = await fetch(`${API_URL}/files/${fileId}/versions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filePath,
      fileSize: file.size,
      notes
    })
  });

  if (!createVersionResponse.ok) {
    const error = await createVersionResponse.json();
    throw new Error(error.message || 'Failed to create file version');
  }

  return createVersionResponse.json();
}

// Get versions of a file
export async function getFileVersions(fileId: string): Promise<FileVersion[]> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/files/${fileId}/versions`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch file versions');
  }

  return response.json();
}

// Delete a file
export async function deleteFile(id: string): Promise<boolean> {
  const token = await get(authToken);

  const response = await fetch(`${API_URL}/files/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete file');
  }

  return true;
}