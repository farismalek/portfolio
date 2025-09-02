import { writable } from 'svelte/store';
import { API_URL } from '$lib/config';
import { authStore } from './authStore';
import type { DateRange } from '$lib/types/analytics';

interface AnalyticsState {
  portfolioStats: PortfolioStats | null;
  profileStats: ProfileStats | null;
  jobStats: JobStats | null;
  engagementStats: EngagementStats | null;
  monetizationStats: MonetizationStats | null;
  isLoading: boolean;
  error: string | null;
}

export interface PortfolioStats {
  totalViews: number;
  uniqueVisitors: number;
  averageTimeOnPage: number;
  topReferrers: Array<{ source: string; count: number }>;
  viewsByDate: Array<{ date: string; count: number }>;
  viewsByLocation: Array<{ location: string; count: number }>;
  conversionRate: number;
}

export interface ProfileStats {
  profileViews: number;
  profileVisitors: number;
  connectionRequests: number;
  connectionRate: number;
  profileCompleteness: number;
  skillEndorsements: number;
}

export interface JobStats {
  applicationsSubmitted: number;
  applicationsViewed: number;
  interviewInvites: number;
  jobOffers: number;
  conversionRate: number;
  applicationsByCompany: Array<{ company: string; count: number }>;
  applicationsByStatus: Array<{ status: string; count: number }>;
}

export interface EngagementStats {
  postsCreated: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageEngagementRate: number;
  engagementByPost: Array<{ postId: string; title: string; engagement: number }>;
  engagementByDate: Array<{ date: string; likes: number; comments: number; shares: number }>;
}

export interface MonetizationStats {
  totalRevenue: number;
  subscriptionRevenue: number;
  productSales: number;
  transactionsByDate: Array<{ date: string; amount: number }>;
  revenueByProduct: Array<{ product: string; revenue: number }>;
  customerLifetimeValue: number;
}

function createAnalyticsStore() {
  const initialState: AnalyticsState = {
    portfolioStats: null,
    profileStats: null,
    jobStats: null,
    engagementStats: null,
    monetizationStats: null,
    isLoading: false,
    error: null
  };

  const { subscribe, set, update } = writable<AnalyticsState>(initialState);

  return {
    subscribe,

    /**
     * Fetch portfolio analytics
     */
    fetchPortfolioStats: async (portfolioId: string, dateRange: DateRange) => {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const token = authStore.getToken();
        if (!token) throw new Error('Authentication required');

        const params = new URLSearchParams({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        });

        const response = await fetch(
          `${API_URL}/analytics/portfolio/${portfolioId}?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch portfolio statistics');
        }

        const data = await response.json();

        update(state => ({
          ...state,
          portfolioStats: data,
          isLoading: false
        }));

        return data;
      } catch (error) {
        update(state => ({
          ...state,
          error: error.message || 'An error occurred while fetching portfolio stats',
          isLoading: false
        }));
        throw error;
      }
    },

    /**
     * Fetch profile analytics
     */
    fetchProfileStats: async (dateRange: DateRange) => {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const token = authStore.getToken();
        if (!token) throw new Error('Authentication required');

        const params = new URLSearchParams({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        });

        const response = await fetch(
          `${API_URL}/analytics/profile?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch profile statistics');
        }

        const data = await response.json();

        update(state => ({
          ...state,
          profileStats: data,
          isLoading: false
        }));

        return data;
      } catch (error) {
        update(state => ({
          ...state,
          error: error.message || 'An error occurred while fetching profile stats',
          isLoading: false
        }));
        throw error;
      }
    },

    /**
     * Fetch job application analytics
     */
    fetchJobStats: async (dateRange: DateRange) => {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const token = authStore.getToken();
        if (!token) throw new Error('Authentication required');

        const params = new URLSearchParams({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        });

        const response = await fetch(
          `${API_URL}/analytics/jobs?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch job application statistics');
        }

        const data = await response.json();

        update(state => ({
          ...state,
          jobStats: data,
          isLoading: false
        }));

        return data;
      } catch (error) {
        update(state => ({
          ...state,
          error: error.message || 'An error occurred while fetching job stats',
          isLoading: false
        }));
        throw error;
      }
    },

    /**
     * Fetch social engagement analytics
     */
    fetchEngagementStats: async (dateRange: DateRange) => {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const token = authStore.getToken();
        if (!token) throw new Error('Authentication required');

        const params = new URLSearchParams({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        });

        const response = await fetch(
          `${API_URL}/analytics/engagement?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch engagement statistics');
        }

        const data = await response.json();

        update(state => ({
          ...state,
          engagementStats: data,
          isLoading: false
        }));

        return data;
      } catch (error) {
        update(state => ({
          ...state,
          error: error.message || 'An error occurred while fetching engagement stats',
          isLoading: false
        }));
        throw error;
      }
    },

    /**
     * Fetch monetization analytics
     */
    fetchMonetizationStats: async (dateRange: DateRange) => {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const token = authStore.getToken();
        if (!token) throw new Error('Authentication required');

        const params = new URLSearchParams({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        });

        const response = await fetch(
          `${API_URL}/analytics/monetization?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch monetization statistics');
        }

        const data = await response.json();

        update(state => ({
          ...state,
          monetizationStats: data,
          isLoading: false
        }));

        return data;
      } catch (error) {
        update(state => ({
          ...state,
          error: error.message || 'An error occurred while fetching monetization stats',
          isLoading: false
        }));
        throw error;
      }
    },

    /**
     * Reset analytics store
     */
    reset: () => {
      set(initialState);
    }
  };
}

export const analyticsStore = createAnalyticsStore();