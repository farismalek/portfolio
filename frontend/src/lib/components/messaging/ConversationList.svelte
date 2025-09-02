<script lang="ts">
  import { page } from "$app/stores";
  import { formatDistanceToNow } from "date-fns";
  import { conversationsStore } from "$lib/stores/conversationsStore";
  import { authUser } from "$lib/stores/authStore";
  import Avatar from "../common/Avatar.svelte";
  import LoadingSpinner from "../common/LoadingSpinner.svelte";

  export let loading = false;
  export let onCreateConversation = () => {};

  $: activeId = $page.params.id;
  $: conversations = $conversationsStore.conversations;

  // Get the other participant for direct conversations
  function getOtherParticipant(conversation) {
    if (!conversation.participants || conversation.participants.length === 0) {
      return null;
    }

    return conversation.participants.find((p) => p.userId !== $authUser?.id)
      ?.user;
  }

  // Get conversation title
  function getConversationTitle(conversation) {
    if (conversation.type === "direct") {
      const otherUser = getOtherParticipant(conversation);
      return otherUser
        ? otherUser.fullName || otherUser.username
        : "Unknown User";
    }

    return conversation.title || "Untitled Conversation";
  }

  // Get conversation avatar
  function getConversationAvatar(conversation) {
    if (conversation.type === "direct") {
      const otherUser = getOtherParticipant(conversation);
      return otherUser?.profiles?.[0]?.avatarUrl || null;
    }

    // For group conversations, we could return a group icon or composite avatar
    return null;
  }

  // Format last message preview
  function formatLastMessage(message) {
    if (!message) return "No messages yet";

    if (message.isDeleted) {
      return "This message was deleted";
    }

    switch (message.type) {
      case "text":
        return message.content;
      case "image":
        return "Sent an image";
      case "file":
        return "Sent a file";
      case "audio":
        return "Sent an audio message";
      case "video":
        return "Sent a video";
      case "system":
        return message.content;
      case "task":
        return "Sent a task";
      default:
        return "Sent a message";
    }
  }

  // Format timestamp
  function formatTime(dateString) {
    if (!dateString) return "";
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  }
</script>

{#if loading}
  <div class="flex items-center justify-center h-48">
    <LoadingSpinner size="md" />
  </div>
{:else if conversations.length === 0}
  <div class="p-6 text-center">
    <svg
      class="w-16 h-16 text-neutral-300 mx-auto mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
      />
    </svg>
    <h3 class="text-lg font-medium text-neutral-700 mb-2">
      No conversations yet
    </h3>
    <p class="text-neutral-500 mb-4">
      Start a conversation to connect with others in the Portfolia community.
    </p>
    <button
      class="text-primary-600 hover:text-primary-800 font-medium"
      on:click={onCreateConversation}
    >
      Start a conversation
    </button>
  </div>
{:else}
  <ul>
    {#each conversations as conversation (conversation.id)}
      <li>
        <a
          href="/messages/{conversation.id}"
          class="flex p-3 hover:bg-neutral-50 {activeId === conversation.id
            ? 'bg-primary-50'
            : ''} relative"
        >
          <div class="flex-shrink-0 relative">
            <Avatar
              src={getConversationAvatar(conversation)}
              alt={getConversationTitle(conversation)}
              size="md"
            />
            {#if conversation.type === "direct" && getOtherParticipant(conversation)?.presence?.status === "online"}
              <div
                class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
              ></div>
            {/if}
          </div>

          <div class="ml-3 flex-1 min-w-0">
            <div class="flex justify-between items-baseline">
              <h3 class="font-medium text-neutral-900 truncate">
                {getConversationTitle(conversation)}
              </h3>
              <span class="text-xs text-neutral-500 ml-1 flex-shrink-0">
                {formatTime(
                  conversation.lastMessageAt || conversation.createdAt,
                )}
              </span>
            </div>

            <p class="text-sm text-neutral-600 truncate">
              {#if conversation.lastMessage?.senderId === $authUser?.id}
                <span class="text-neutral-500">You: </span>
              {/if}
              {formatLastMessage(conversation.lastMessage)}
            </p>
          </div>

          {#if conversation.unreadCount > 0}
            <div class="absolute right-3 top-3">
              <div
                class="bg-primary-600 text-white text-xs font-medium rounded-full h-5 min-w-5 flex items-center justify-center px-1"
              >
                {conversation.unreadCount}
              </div>
            </div>
          {/if}
        </a>
      </li>
    {/each}
  </ul>
{/if}
