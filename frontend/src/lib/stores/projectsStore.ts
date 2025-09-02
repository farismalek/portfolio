import { writable, get } from 'svelte/store';
import type { Project } from '$lib/types/workspace';
import { getProjectsForWorkspace, createProject, updateProject } from '$lib/services/projectService';
import { authUser } from './authStore';

export interface ProjectsState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  currentWorkspaceId: string | null;
}

function createProjectsStore() {
  const initialState: ProjectsState = {
    projects: [],
    isLoading: false,
    error: null,
    currentWorkspaceId: null
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,

    // Load projects for a workspace
    loadProjects: async (workspaceId: string) => {
      update(state => ({
        ...state,
        isLoading: true,
        error: null,
        currentWorkspaceId: workspaceId
      }));

      try {
        const projects = await getProjectsForWorkspace(workspaceId);

        update(state => ({
          ...state,
          projects,
          isLoading: false
        }));
      } catch (error) {
        console.error('Error loading projects:', error);

        update(state => ({
          ...state,
          isLoading: false,
          error: error.message || 'Failed to load projects'
        }));
      }
    },

    // Add a project to the store
    addProject: (project: Project) => {
      update(state => ({
        ...state,
        projects: [...state.projects, project]
      }));
    },

    // Update a project in the store
    updateProject: (updatedProject: Project) => {
      update(state => ({
        ...state,
        projects: state.projects.map(project =>
          project.id === updatedProject.id ? updatedProject : project
        )
      }));
    },

    // Remove a project from the store
    removeProject: (projectId: string) => {
      update(state => ({
        ...state,
        projects: state.projects.filter(project => project.id !== projectId)
      }));
    },

    // Reset the store to initial state
    reset: () => set(initialState)
  };
}

export const projectsStore = createProjectsStore();

// Reset store when user logs out
authUser.subscribe(user => {
  if (!user) {
    projectsStore.reset();
  }
});