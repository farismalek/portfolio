<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import { createComment } from "$lib/services/postService";
  import { authUser } from "$lib/stores/authStore";
  import Avatar from "../common/Avatar.svelte";
  import Button from "../common/Button.svelte";
  import { goto } from "$app/navigation";

  export let postId: string;
  export let parentId: string | null = null;
  export let placeholder: string = "Write a comment...";

  let content = "";
  let isSubmitting = false;
  let error: string | null = null;
  let textareaEl: HTMLTextAreaElement;

  const dispatch = createEventDispatcher();

  // Auto-resize textarea as content grows
  function adjustTextareaHeight() {
    if (textareaEl) {
      textareaEl.style.height = "auto";
      textareaEl.style.height = textareaEl.scrollHeight + "px";
    }
  }

  async function submitComment() {
    if (!$authUser) {
      goto("/login");
      return;
    }

    if (!content.trim()) return;

    isSubmitting = true;
    error = null;

    try {
      const comment = await createComment({
        userId: $authUser.id,
        postId,
        content: content.trim(),
        parentId: parentId || undefined,
      });

      content = "";
      adjustTextareaHeight();
      dispatch("comment", comment);
    } catch (err) {
      console.error("Failed to post comment:", err);
      error = err.message || "Failed to post comment. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      submitComment();
    }
  }
</script>

<div class="flex items-start space-x-3">
  {#if $authUser}
    <Avatar
      src={$authUser.profiles?.[0]?.avatarUrl}
      alt={$authUser.fullName || $authUser.username || "User"}
      size="sm"
    />
  {:else}
    <Avatar size="sm" />
  {/if}

  <div class="flex-1 relative">
    <textarea
      bind:this={textareaEl}
      bind:value={content}
      on:input={adjustTextareaHeight}
      on:keydown={handleKeyDown}
      class="w-full min-h-10 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
      rows="1"
      {placeholder}
      disabled={isSubmitting}
    ></textarea>

    <div class="absolute right-2 bottom-2">
      <Button
        variant="primary"
        size="xs"
        on:click={submitComment}
        disabled={!content.trim() || isSubmitting}
        loading={isSubmitting}
      >
        Post
      </Button>
    </div>
  </div>
</div>

{#if error}
  <div
    class="ml-10 mt-1 text-sm text-red-600"
    transition:fade={{ duration: 200 }}
  >
    {error}
  </div>
{/if}
