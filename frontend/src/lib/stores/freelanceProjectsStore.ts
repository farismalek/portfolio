import { writable } from 'svelte/store';
import { getProjects } from '$lib/services/freelanceService';
import type { FreelanceProject } from '$lib/types/freelance';

export interface FreelanceProjectsState {
  projects: FreelanceProject[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  facets: any;
}

function createFreelanceProjectsStore() {
  const initialState: FreelanceProjectsState = {
    projects: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    facets: null
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,

    fetchProjects: async (params = {}) => {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const { items, totalCount, facets } = await getProjects(params);

        update(state => ({
          ...state,
          projects: items,
          totalCount,
          facets,
          isLoading: false
        }));
      } catch (error) {
        console.error('Error fetching projects:', error);

        update(state => ({
          ...state,
          error: error.message || 'Failed to load projects',
          isLoading: false
        }));
      }
    },

    reset: () => set(initialState)
  };
}

export const freelanceProjectsStore = createFreelanceProjectsStore();