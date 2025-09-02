import { writable, get } from 'svelte/store';
import type { Workspace } from '$lib/types/workspace';
import { getWorkspace, updateWorkspace } from '$lib/services/workspaceService';
import { authUser } from './authStore';
import { workspacesStore } from './workspacesStore';

export interface WorkspaceState {
  workspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
}

function createWorkspaceStore() {
  const initialState: WorkspaceState = {
    workspace: null,
    isLoading: false,
    error: null
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,

    // Load a specific workspace
    loadWorkspace: async (workspaceId: string) => {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const workspace = await getWorkspace(workspaceId);

        update(state => ({
          ...state,
          workspace,
          isLoading: false
        }));
      } catch (error) {
        console.error('Error loading workspace:', error);

        update(state => ({
          ...state,
          isLoading: false,
          error: error.message || 'Failed to load workspace'
        }));
      }
    },

    // Update the current workspace
    updateWorkspace: async (workspaceData: Partial<Workspace>) => {
      const state = get({ subscribe });
      if (!state.workspace) return;

      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const updatedWorkspace = await updateWorkspace(
          state.workspace.id,
          workspaceData
        );

        update(state => ({
          ...state,
          workspace: updatedWorkspace,
          isLoading: false
        }));

        // Also update in workspaces store
        workspacesStore.updateWorkspace(updatedWorkspace);
      } catch (error) {
        console.error('Error updating workspace:', error);

        update(state => ({
          ...state,
          isLoading: false,
          error: error.message || 'Failed to update workspace'
        }));
      }
    },

    // Update workspace members
    addMember: (member: any) => {
      update(state => {
        if (!state.workspace) return state;

        return {
          ...state,
          workspace: {
            ...state.workspace,
            members: [...(state.workspace.members || []), member],
            memberCount: (state.workspace.memberCount || 0) + 1
          }
        };
      });
    },

    removeMember: (memberId: string) => {
      update(state => {
        if (!state.workspace) return state;

        const updatedMembers = state.workspace.members.filter(m => m.id !== memberId);

        return {
          ...state,
          workspace: {
            ...state.workspace,
            members: updatedMembers,
            memberCount: updatedMembers.length
          }
        };
      });
    },

    // Reset the store
    reset: () => set(initialState)
  };
}

export const workspaceStore = createWorkspaceStore();

// Reset store when user logs out
authUser.subscribe(user => {
  if (!user) {
    workspaceStore.reset();
  }
});