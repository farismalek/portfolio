import { writable, derived, get } from 'svelte/store';
import type { Conversation, Message } from '$lib/types/network';
import { getAllConversations, getConversation } from '$lib/services/conversationService';
import { authUser } from './authStore';
import { messagingSocket } from '$lib/services/messagingSocket';
import { NotificationType } from '$lib/types/notifications';
import { notificationStore } from './notificationStore';

export interface ConversationsState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

function createConversationsStore() {
  const initialState: ConversationsState = {
    conversations: [],
    activeConversationId: null,
    isLoading: false,
    error: null
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,

    // Load all conversations
    loadConversations: async () => {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const conversations = await getAllConversations();

        update(state => ({
          ...state,
          conversations,
          isLoading: false
        }));
      } catch (error) {
        console.error('Error loading conversations:', error);

        update(state => ({
          ...state,
          isLoading: false,
          error: error.message || 'Failed to load conversations'
        }));
      }
    },

    // Set active conversation
    setActiveConversation: (conversationId: string) => {
      update(state => ({ ...state, activeConversationId: conversationId }));
    },

    // Add a new conversation to the store
    addConversation: (conversation: Conversation) => {
      update(state => {
        // Check if conversation already exists
        const exists = state.conversations.some(c => c.id === conversation.id);

        if (exists) {
          // Update existing conversation
          return {
            ...state,
            conversations: state.conversations.map(c =>
              c.id === conversation.id ? conversation : c
            )
          };
        } else {
          // Add new conversation at the top
          return {
            ...state,
            conversations: [conversation, ...state.conversations]
          };
        }
      });
    },

    // Update a conversation in the store
    updateConversation: (conversation: Conversation) => {
      update(state => ({
        ...state,
        conversations: state.conversations.map(c =>
          c.id === conversation.id ? conversation : c
        )
      }));
    },

    // Remove a conversation from the store
    removeConversation: (conversationId: string) => {
      update(state => ({
        ...state,
        conversations: state.conversations.filter(c => c.id !== conversationId),
        activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId
      }));
    },

    // Update conversation with a new message
    updateWithMessage: (message: Message) => {
      update(state => {
        // Find the conversation
        const conversationIndex = state.conversations.findIndex(c => c.id === message.conversationId);

        if (conversationIndex === -1) {
          // If conversation doesn't exist in store, we'll need to fetch it
          getConversation(message.conversationId).then(conversation => {
            conversationsStore.addConversation(conversation);
          });
          return state;
        }

        // Update the conversation with new message
        const conversation = { ...state.conversations[conversationIndex] };
        conversation.lastMessage = message;
        conversation.lastMessageAt = message.createdAt;

        // If this is not the active conversation, increment unread count
        if (conversation.id !== state.activeConversationId && message.senderId !== get(authUser)?.id) {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }

        // Move this conversation to the top of the list
        const updatedConversations = state.conversations.filter(c => c.id !== conversation.id);
        updatedConversations.unshift(conversation);

        return {
          ...state,
          conversations: updatedConversations
        };
      });
    },

    // Mark a conversation as read
    markAsRead: (conversationId: string) => {
      update(state => ({
        ...state,
        conversations: state.conversations.map(c =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      }));
    },

    // Reset the store to initial state
    reset: () => set(initialState)
  };
}

export const conversationsStore = createConversationsStore();

// Derived store for active conversation
export const activeConversation = derived(
  conversationsStore,
  ($conversationsStore) => {
    if (!$conversationsStore.activeConversationId) return null;

    return $conversationsStore.conversations.find(
      c => c.id === $conversationsStore.activeConversationId
    ) || null;
  }
);

// Listen to socket events for real-time updates
messagingSocket.on('conversation:new', (conversation) => {
  conversationsStore.addConversation(conversation);
});

messagingSocket.on('conversation:updated', (conversation) => {
  conversationsStore.updateConversation(conversation);
});

messagingSocket.on('conversation:deleted', (data) => {
  conversationsStore.removeConversation(data.id);
});

messagingSocket.on('message:new', (message) => {
  conversationsStore.updateWithMessage(message);

  // Add notification if not from current user and not in active conversation
  const currentUserId = get(authUser)?.id;
  const activeConversationId = get(conversationsStore).activeConversationId;

  if (message.senderId !== currentUserId && message.conversationId !== activeConversationId) {
    notificationStore.addNotification({
      id: `msg-${message.id}`,
      type: NotificationType.NEW_MESSAGE,
      senderId: message.senderId,
      message: message.content,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }
});

// Reset store when user logs out
authUser.subscribe(user => {
  if (!user) {
    conversationsStore.reset();
  }
});