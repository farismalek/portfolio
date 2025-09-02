import { writable } from 'svelte/store';
import { getCompanies } from '$lib/services/companyService';
import type { Company } from '$lib/types/companies';

export interface CompaniesState {
  companies: Company[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
}

function createCompaniesStore() {
  const initialState: CompaniesState = {
    companies: [],
    totalCount: 0,
    isLoading: false,
    error: null
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,

    fetchCompanies: async (params = {}) => {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const { items, totalCount } = await getCompanies(params);

        update(state => ({
          ...state,
          companies: items,
          totalCount,
          isLoading: false
        }));
      } catch (error) {
        console.error('Error fetching companies:', error);

        update(state => ({
          ...state,
          error: error.message || 'Failed to load companies',
          isLoading: false
        }));
      }
    },

    reset: () => set(initialState)
  };
}

export const companiesStore = createCompaniesStore();