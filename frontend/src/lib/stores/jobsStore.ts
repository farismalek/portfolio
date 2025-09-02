import { writable } from 'svelte/store';
import { getJobs } from '$lib/services/jobService';
import type { Job } from '$lib/types/jobs';

export interface JobsState {
  jobs: Job[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  facets: any;
}

function createJobsStore() {
  const initialState: JobsState = {
    jobs: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    facets: null
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,

    fetchJobs: async (params = {}) => {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const { items, totalCount, facets } = await getJobs(params);

        update(state => ({
          ...state,
          jobs: items,
          totalCount,
          facets,
          isLoading: false
        }));
      } catch (error) {
        console.error('Error fetching jobs:', error);

        update(state => ({
          ...state,
          error: error.message || 'Failed to load jobs',
          isLoading: false
        }));
      }
    },

    reset: () => set(initialState)
  };
}

export const jobsStore = createJobsStore();