<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { fade, slide } from "svelte/transition";
  import { fly } from "svelte/animate";
  import { flip } from "svelte/animate";
  import { authUser } from "$lib/stores/authStore";
  import {
    conversationsStore,
    activeConversation,
  } from "$lib/stores/conversationsStore";
  import { messageStore } from "$lib/stores/messageStore";
  import Avatar from "$lib/components/common/Avatar.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Menu from "$lib/components/common/Menu.svelte";
  import MenuItem from "$lib/components/common/MenuItem.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import MessageBubble from "$lib/components/messaging/MessageBubble.svelte";
  import MessageComposer from "$lib/components/messaging/MessageComposer.svelte";
  import { markConversationAsRead } from "$lib/services/conversationService";

  // Get the conversation ID from the URL
  $: conversationId = $page.params.id;

  let isInitialLoading = true;
  let isLoadingMore = false;
  let messagesContainer;
  let hasScrolledToBottom = false;
  let showScrollToBottom = false;

  // Set active conversation when route changes
  $: if (conversationId) {
    conversationsStore.setActiveConversation(conversationId);
    loadMessages(conversationId);
  }

  onMount(() => {
    // Initialize message store
    messageStore.initialize(conversationId);

    // Mark conversation as read
    markConversationRead();
  });

  onDestroy(() => {
    // Reset active conversation when leaving
    conversationsStore.setActiveConversation(null);
    messageStore.reset();
  });

  // Load messages for the conversation
  async function loadMessages(conversationId) {
    isInitialLoading = true;

    try {
      await messageStore.loadMessages(conversationId);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      isInitialLoading = false;

      // Scroll to bottom after loading initial messages
      setTimeout(() => {
        scrollToBottom();
        hasScrolledToBottom = true;
      }, 100);
    }
  }

  // Load more messages when scrolling up
  async function loadMoreMessages() {
    if (isLoadingMore || !messageStore.hasMore || messageStore.isLoading)
      return;

    isLoadingMore = true;
    const oldScrollHeight = messagesContainer.scrollHeight;

    try {
      await messageStore.loadMore();

      // Maintain scroll position when loading more messages
      setTimeout(() => {
        const newScrollHeight = messagesContainer.scrollHeight;
        messagesContainer.scrollTop = newScrollHeight - oldScrollHeight;
      }, 100);
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      isLoadingMore = false;
    }
  }

  // Handle new message sent
  function handleMessageSent(event) {
    const message = event.detail;

    // Scroll to bottom when sending a message
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }

  // Scroll to bottom of messages
  function scrollToBottom() {
    if (!messagesContainer) return;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    showScrollToBottom = false;
  }

  // Handle scroll events
  function handleScroll(event) {
    const { scrollTop, scrollHeight, clientHeight } = event.target;

    // Check if we need to load more messages
    if (scrollTop < 50 && messageStore.hasMore && !isLoadingMore) {
      loadMoreMessages();
    }

    // Show/hide scroll to bottom button
    showScrollToBottom = scrollHeight - scrollTop - clientHeight > 200;

    // Mark as read when scrolled to bottom
    if (scrollHeight - scrollTop - clientHeight < 50) {
      markConversationRead();
    }
  }

  // Mark conversation as read
  async function markConversationRead() {
    if (conversationId && $authUser) {
      try {
        await markConversationAsRead(conversationId);
        conversationsStore.markAsRead(conversationId);
      } catch (error) {
        console.error("Error marking conversation as read:", error);
      }
    }
  }

  // Group messages by date
  $: groupedMessages = messageStore.groupMessagesByDate($messageStore.messages);

  // Get other participant for direct conversations
  $: otherParticipant =
    $activeConversation?.type === "direct"
      ? $activeConversation?.participants?.find(
          (p) => p.userId !== $authUser?.id,
        )?.user
      : null;

  // Get conversation title
  $: conversationTitle =
    $activeConversation?.type === "direct"
      ? otherParticipant?.fullName || otherParticipant?.username || "User"
      : $activeConversation?.title || "Conversation";

  // Get user online status
  $: isOnline = otherParticipant?.presence?.status === "online";
</script>

<div class="h-full flex flex-col bg-neutral-50">
  {#if $activeConversation}
    <!-- Conversation header -->
    <div
      class="bg-white border-b border-neutral-200 py-2 px-4 flex items-center justify-between z-10"
    >
      <div class="flex items-center">
        <div class="relative">
          <Avatar
            src={otherParticipant?.profiles?.[0]?.avatarUrl}
            alt={conversationTitle}
            size="md"
          />
          {#if isOnline}
            <div
              class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
            ></div>
          {/if}
        </div>

        <div class="ml-3">
          <h2 class="font-medium text-neutral-900">
            {conversationTitle}
          </h2>
          {#if $activeConversation.type === "direct"}
            <p class="text-xs text-neutral-500">
              {isOnline ? "Online" : "Offline"}
            </p>
          {:else}
            <p class="text-xs text-neutral-500">
              {$activeConversation.participants?.length || 0} members
            </p>
          {/if}
        </div>
      </div>

      <div>
        <Menu position="bottom-end">
          <svelte:fragment slot="trigger">
            <button
              class="p-2 rounded-full hover:bg-neutral-100 text-neutral-500"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </svelte:fragment>

          {#if $activeConversation.type === "group"}
            <MenuItem>
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              View members
            </MenuItem>

            <MenuItem>
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Add members
            </MenuItem>

            <MenuItem>
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Edit group
            </MenuItem>

            <MenuItem class="text-red-600">
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Leave group
            </MenuItem>
          {:else}
            <MenuItem>
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              View profile
            </MenuItem>

            <MenuItem>
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Shared files
            </MenuItem>

            <MenuItem class="text-red-600">
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete conversation
            </MenuItem>
          {/if}
        </Menu>
      </div>
    </div>

    <!-- Message list -->
    <div
      bind:this={messagesContainer}
      class="flex-1 overflow-y-auto py-4 px-4"
      on:scroll={handleScroll}
    >
      {#if isInitialLoading}
        <div class="flex justify-center items-center h-full">
          <LoadingSpinner size="lg" />
        </div>
      {:else if $messageStore.messages.length === 0}
        <div
          class="flex flex-col items-center justify-center h-full text-center"
        >
          <div
            class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4"
          >
            <svg
              class="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-neutral-900 mb-1">
            Start a conversation
          </h3>
          <p class="text-neutral-500 max-w-xs">
            {#if $activeConversation.type === "direct"}
              Send a message to start chatting with {conversationTitle}.
            {:else}
              Send a message to start chatting with this group.
            {/if}
          </p>
        </div>
      {:else}
        <!-- Loading indicator at the top when fetching more messages -->
        {#if isLoadingMore}
          <div
            class="flex justify-center py-2 mb-2"
            transition:fade={{ duration: 200 }}
          >
            <LoadingSpinner size="sm" />
          </div>
        {/if}

        <!-- Group messages by date -->
        {#each Object.entries(groupedMessages) as [date, messages] (date)}
          <div class="mb-6">
            <div class="flex justify-center mb-4">
              <div
                class="bg-neutral-200 text-neutral-600 text-xs px-2 py-1 rounded-full"
              >
                {date}
              </div>
            </div>

            {#each messages as message (message.id)}
              <div animate:flip={{ duration: 200 }}>
                <MessageBubble
                  {message}
                  isCurrentUser={message.senderId === $authUser?.id}
                  otherUserAvatar={otherParticipant?.profiles?.[0]?.avatarUrl}
                  showAvatar={message.senderId !== $authUser?.id}
                />
              </div>
            {/each}
          </div>
        {/each}
      {/if}

      <!-- Scroll to bottom button -->
      {#if showScrollToBottom}
        <button
          class="fixed bottom-24 right-8 bg-neutral-800 bg-opacity-60 text-white rounded-full p-2 shadow-lg hover:bg-opacity-80 transition-opacity"
          on:click={scrollToBottom}
          transition:fade={{ duration: 200 }}
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      {/if}
    </div>

    <!-- Message composer -->
    <div class="bg-white border-t border-neutral-200 p-3">
      <MessageComposer
        conversationId={$activeConversation.id}
        on:messageSent={handleMessageSent}
      />
    </div>
  {:else}
    <!-- No conversation selected -->
    <div class="flex flex-col items-center justify-center h-full bg-white">
      <div
        class="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-4"
      >
        <svg
          class="w-10 h-10 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h2 class="text-xl font-medium text-neutral-900 mb-2">Your Messages</h2>
      <p class="text-neutral-500 max-w-md text-center mb-6">
        Select a conversation to start messaging or create a new one.
      </p>
      <Button variant="primary" on:click={() => dispatch("newConversation")}>
        New Conversation
      </Button>
    </div>
  {/if}
</div>
