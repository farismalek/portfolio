import { writable, derived } from 'svelte/store';
import type { Notification } from '$lib/types/network';
import { getNotifications, getUnreadCount } from '$lib/services/notificationService';
import { authUser } from './authStore';

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

const createNotificationStore = () => {
  const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    hasMore: true,
    page: 1
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    initialize: async () => {
      update(state => ({ ...state, isLoading: true, error: null }));
      try {
        // Get initial notifications
        const { notifications, total } = await getNotifications(1, 10);
        const unreadCount = await getUnreadCount();

        set({
          notifications,
          unreadCount,
          isLoading: false,
          error: null,
          hasMore: notifications.length < total,
          page: 1
        });
      } catch (err) {
        update(state => ({
          ...state,
          isLoading: false,
          error: err.message || 'Failed to load notifications'
        }));
      }
    },
    loadMore: async () => {
      update(state => {
        if (!state.hasMore || state.isLoading) return state;
        return { ...state, isLoading: true, error: null };
      });

      try {
        const currentState = get(notificationStore);
        const nextPage = currentState.page + 1;

        const { notifications: newNotifications, total } = await getNotifications(nextPage, 10);

        update(state => ({
          ...state,
          notifications: [...state.notifications, ...newNotifications],
          hasMore: state.notifications.length + newNotifications.length < total,
          page: nextPage,
          isLoading: false
        }));
      } catch (err) {
        update(state => ({
          ...state,
          isLoading: false,
          error: err.message || 'Failed to load more notifications'
        }));
      }
    },
    markAsRead: (id: string) => {
      update(state => ({
        ...state,
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    },
    markAllAsRead: () => {
      update(state => ({
        ...state,
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    },
    addNotification: (notification: Notification) => {
      update(state => ({
        ...state,
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification.isRead ? 0 : 1)
      }));
    },
    removeNotification: (id: string) => {
      update(state => {
        const notification = state.notifications.find(n => n.id === id);
        const unreadAdjustment = notification && !notification.isRead ? 1 : 0;

        return {
          ...state,
          notifications: state.notifications.filter(n => n.id !== id),
          unreadCount: Math.max(0, state.unreadCount - unreadAdjustment)
        };
      });
    },
    updateUnreadCount: async () => {
      try {
        const unreadCount = await getUnreadCount();
        update(state => ({ ...state, unreadCount }));
      } catch (err) {
        console.error('Failed to update unread count:', err);
      }
    },
    reset: () => set(initialState)
  };
};

export const notificationStore = createNotificationStore();

// Subscribe to auth changes to initialize notifications
authUser.subscribe(user => {
  if (user) {
    notificationStore.initialize();
  } else {
    notificationStore.reset();
  }
});