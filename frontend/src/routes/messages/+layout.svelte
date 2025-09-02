<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { fade, slide } from "svelte/transition";
  import { authUser } from "$lib/stores/authStore";
  import { conversationsStore } from "$lib/stores/conversationsStore";
  import Button from "$lib/components/common/Button.svelte";
  import ConversationList from "$lib/components/messaging/ConversationList.svelte";
  import CreateConversationModal from "$lib/components/messaging/CreateConversationModal.svelte";
  import {
    connectMessaging,
    disconnectMessaging,
  } from "$lib/services/messagingSocket";

  let isConversationsLoading = true;
  let showCreateModal = false;
  let mobileNavOpen = false;

  // Responsive behavior
  $: isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false;
  $: isConversationSelected = !!$page.params.id;
  $: showSidebar = !isMobile || (isMobile && !isConversationSelected);

  onMount(async () => {
    if (!$authUser) {
      goto("/login");
      return;
    }

    // Initialize conversations
    isConversationsLoading = true;
    await conversationsStore.loadConversations();
    isConversationsLoading = false;

    // Connect to messaging socket
    connectMessaging();

    // Handle resize events for responsive behavior
    const handleResize = () => {
      isMobile = window.innerWidth < 768;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  onDestroy(() => {
    // Disconnect from socket when leaving messages
    disconnectMessaging();
  });

  function handleCreateConversation() {
    showCreateModal = true;
  }

  function handleConversationCreated(event) {
    const conversation = event.detail;
    showCreateModal = false;
    // Navigate to the new conversation
    goto(`/messages/${conversation.id}`);
  }

  function toggleMobileNav() {
    mobileNavOpen = !mobileNavOpen;
  }
</script>

<svelte:head>
  <title>Messages | Portfolia</title>
</svelte:head>

<div class="h-full flex flex-col">
  <header
    class="bg-white border-b border-neutral-200 py-3 px-4 flex items-center justify-between"
  >
    <div class="flex items-center">
      {#if isMobile && isConversationSelected}
        <button
          class="mr-3 p-1 rounded-md hover:bg-neutral-100"
          on:click={() => goto("/messages")}
        >
          <svg
            class="w-6 h-6 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      {/if}
      <h1 class="text-xl font-bold text-neutral-900">Messages</h1>
    </div>

    <div>
      <Button variant="primary" size="sm" on:click={handleCreateConversation}>
        <svg
          class="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        New Message
      </Button>
    </div>
  </header>

  <div class="flex-1 flex overflow-hidden">
    <!-- Conversations sidebar -->
    {#if showSidebar}
      <div
        class="w-full md:w-80 h-full border-r border-neutral-200 bg-white flex-shrink-0 flex flex-col"
        transition:slide={{ axis: "x", duration: isMobile ? 200 : 0 }}
      >
        <div class="p-3">
          <div class="relative">
            <input
              type="text"
              placeholder="Search conversations"
              class="w-full py-2 pl-9 pr-4 rounded-lg border border-neutral-300 focus:ring-primary-500 focus:border-primary-500"
            />
            <svg
              class="w-5 h-5 text-neutral-400 absolute left-2.5 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <ConversationList
            loading={isConversationsLoading}
            onCreateConversation={handleCreateConversation}
          />
        </div>
      </div>
    {/if}

    <!-- Conversation content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <slot />
    </div>
  </div>
</div>

<!-- Create conversation modal -->
<CreateConversationModal
  open={showCreateModal}
  on:close={() => (showCreateModal = false)}
  on:created={handleConversationCreated}
/>
