<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { format } from "date-fns";
  import Avatar from "../common/Avatar.svelte";
  import Menu from "../common/Menu.svelte";
  import MenuItem from "../common/MenuItem.svelte";
  import MessageReactions from "./MessageReactions.svelte";

  export let message;
  export let isCurrentUser = false;
  export let showAvatar = true;
  export let otherUserAvatar = null;

  let showOptions = false;
  let showReactionPicker = false;
  let menuPosition = isCurrentUser ? "left" : "right";

  const dispatch = createEventDispatcher();

  // Format timestamp
  function formatTime(dateString) {
    if (!dateString) return "";
    return format(new Date(dateString), "h:mm a");
  }

  function handleReact(emoji) {
    dispatch("react", { messageId: message.id, emoji });
    showReactionPicker = false;
  }

  function handleReply() {
    dispatch("reply", { message });
  }

  function handleEdit() {
    if (isCurrentUser && !message.isDeleted) {
      dispatch("edit", { message });
    }
  }

  function handleDelete() {
    if (isCurrentUser && !message.isDeleted) {
      dispatch("delete", { messageId: message.id });
    }
  }

  function handleMouseEnter() {
    showOptions = true;
  }

  function handleMouseLeave() {
    showOptions = false;
    showReactionPicker = false;
  }

  // Get message content based on type
  function getMessageContent(message) {
    if (message.isDeleted) {
      return "This message was deleted";
    }

    switch (message.type) {
      case "text":
        return message.content;
      case "image":
        return null; // Handled in template
      case "file":
        return null; // Handled in template
      case "system":
        return message.content;
      default:
        return message.content;
    }
  }
</script>

<div
  class="mb-3 group relative {isCurrentUser ? 'flex justify-end' : 'flex'}"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  {#if showAvatar && !isCurrentUser}
    <div class="flex-shrink-0 mr-2">
      <Avatar src={otherUserAvatar} alt="User" size="sm" className="mt-1" />
    </div>
  {/if}

  <div class="{isCurrentUser ? 'items-end' : 'items-start'} max-w-[75%]">
    <!-- Message bubble -->
    <div
      class="rounded-lg px-3 py-2 shadow-sm {message.type === 'system'
        ? 'bg-neutral-100 text-neutral-600 text-center mx-auto text-sm italic'
        : isCurrentUser
          ? 'bg-primary-500 text-white'
          : 'bg-white border border-neutral-200'} {message.isDeleted
        ? 'italic opacity-70'
        : ''}"
    >
      <!-- Message content -->
      {#if message.type === "text" || message.type === "system"}
        <p class="whitespace-pre-line break-words">
          {getMessageContent(message)}
        </p>
      {:else if message.type === "image"}
        <div class="mb-1">
          <img
            src={message.media?.url}
            alt="Shared image"
            class="max-w-full rounded max-h-60 object-contain cursor-pointer"
            on:click={() => dispatch("viewImage", message.media)}
          />
        </div>
        {#if message.content}
          <p class="whitespace-pre-line break-words mt-1 text-sm">
            {message.content}
          </p>
        {/if}
      {:else if message.type === "file"}
        <div class="bg-neutral-100 rounded p-2 flex items-center mb-1">
          <div class="bg-neutral-200 rounded p-1 mr-2">
            <svg
              class="w-5 h-5 text-neutral-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate">
              {message.media?.filename || "Document"}
            </div>
            <div class="text-xs text-neutral-500">
              {message.media?.filesize
                ? `${Math.round(message.media.filesize / 1024)} KB`
                : ""}
            </div>
          </div>
          <button
            class="ml-2 p-1 rounded-full hover:bg-neutral-200 text-neutral-700"
            on:click={() => window.open(message.media?.url, "_blank")}
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        </div>
        {#if message.content}
          <p class="whitespace-pre-line break-words mt-1 text-sm">
            {message.content}
          </p>
        {/if}
      {/if}

      <!-- Editing and read indicator -->
      <div class="flex items-center justify-end mt-1 space-x-1">
        {#if message.isEdited}
          <span class="text-xs opacity-70">Edited</span>
        {/if}
        <span class="text-xs opacity-70">{formatTime(message.createdAt)}</span>
        {#if isCurrentUser && message.isRead}
          <svg
            class="w-3 h-3 text-primary-300"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        {/if}
      </div>
    </div>

    <!-- Reactions -->
    {#if message.reactions && message.reactions.length > 0}
      <MessageReactions
        reactions={message.reactions}
        alignment={isCurrentUser ? "right" : "left"}
        on:react={(e) => handleReact(e.detail)}
      />
    {/if}
  </div>

  <!-- Message actions -->
  {#if showOptions && !message.isDeleted}
    <div
      class="absolute {isCurrentUser
        ? 'left-0 -translate-x-full'
        : 'right-0 translate-x-full'} top-0 flex items-center space-x-1 px-1"
      transition:fade={{ duration: 100 }}
    >
      <!-- React -->
      <button
        class="p-1.5 bg-white rounded-full shadow hover:bg-neutral-100 text-neutral-600"
        on:click={() => (showReactionPicker = !showReactionPicker)}
        title="React"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      <!-- Reply -->
      <button
        class="p-1.5 bg-white rounded-full shadow hover:bg-neutral-100 text-neutral-600"
        on:click={handleReply}
        title="Reply"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        </svg>
      </button>

      <!-- More actions -->
      <div class="relative">
        <Menu position={menuPosition}>
          <svelte:fragment slot="trigger">
            <button
              class="p-1.5 bg-white rounded-full shadow hover:bg-neutral-100 text-neutral-600"
              title="More actions"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                />
              </svg>
            </button>
          </svelte:fragment>

          {#if isCurrentUser}
            <MenuItem on:click={handleEdit}>
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
              Edit
            </MenuItem>
            <MenuItem on:click={handleDelete} class="text-red-600">
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
              Delete
            </MenuItem>
          {:else}
            <MenuItem on:click={() => dispatch("copy", message.content)}>
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
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              Copy text
            </MenuItem>
            <MenuItem on:click={() => dispatch("report", message)}>
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Report message
            </MenuItem>
          {/if}
        </Menu>
      </div>
    </div>
  {/if}

  <!-- Reaction picker -->
  {#if showReactionPicker}
    <div
      class="absolute {isCurrentUser
        ? 'left-0 -translate-x-full -translate-y-full'
        : 'right-0 translate-x-full -translate-y-full'} top-0 bg-white rounded-lg shadow-lg border border-neutral-200 p-2 z-10"
      transition:scale={{ duration: 100, start: 0.95 }}
    >
      <div class="flex space-x-2">
        {#each ["👍", "❤️", "😂", "😮", "😢", "🙏"] as emoji}
          <button
            class="p-1 hover:bg-neutral-100 rounded text-lg"
            on:click={() => handleReact(emoji)}
          >
            {emoji}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
