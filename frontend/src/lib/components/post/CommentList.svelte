<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { formatDistanceToNow } from "date-fns";
  import Avatar from "../common/Button.svelte";
  import Button from "../common/Button.svelte";
  import { getComments } from "$lib/services/postService";
  import type { Comment } from "$lib/types/network";
  import { authUser } from "$lib/stores/authStore";

  export let postId: string;
  export let comments: Comment[] = [];

  let page = 1;
  let isLoading = false;
  let hasMore = true;
  let error: string | null = null;

  const dispatch = createEventDispatcher();
  const PAGE_SIZE = 10;

  onMount(() => {
    loadComments();
  });

  async function loadComments() {
    if (isLoading || !hasMore) return;

    isLoading = true;
    error = null;

    try {
      const response = await getComments(postId, page, PAGE_SIZE);

      if (page === 1) {
        comments = response.comments;
      } else {
        comments = [...comments, ...response.comments];
      }

      hasMore = response.comments.length === PAGE_SIZE;
      page++;
    } catch (err) {
      console.error("Failed to load comments:", err);
      error = "Failed to load comments";
    } finally {
      isLoading = false;
    }
  }

  function formatDate(dateString: string): string {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  }
</script>

<div class="space-y-4">
  {#if comments.length === 0 && !isLoading}
    <div class="text-center text-neutral-500 py-4">
      No comments yet. Be the first to comment!
    </div>
  {/if}

  {#each comments as comment (comment.id)}
    <div class="flex space-x-3">
      <Avatar
        src={comment.user?.profiles?.[0]?.avatarUrl}
        alt={comment.user?.fullName || "User"}
        size="sm"
      />

      <div class="flex-1">
        <div class="bg-neutral-50 rounded-lg px-3 py-2">
          <div class="flex items-center justify-between mb-1">
            <span class="font-medium text-sm text-neutral-900">
              {comment.user?.fullName || comment.user?.username || "User"}
            </span>
            <span class="text-xs text-neutral-500">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          <p class="text-neutral-700 text-sm whitespace-pre-line">
            {comment.content}
          </p>
        </div>

        <div class="flex items-center mt-1 text-xs space-x-4 pl-2">
          <button class="text-neutral-500 hover:text-primary-600">Like</button>
          <button class="text-neutral-500 hover:text-primary-600">Reply</button>

          {#if $authUser && comment.userId === $authUser.id}
            <button class="text-neutral-500 hover:text-red-600">Delete</button>
          {/if}
        </div>
      </div>
    </div>
  {/each}

  {#if isLoading}
    <div class="flex justify-center py-4">
      <div
        class="w-6 h-6 border-t-2 border-primary-500 border-solid rounded-full animate-spin"
      ></div>
    </div>
  {/if}

  {#if hasMore && !isLoading && comments.length > 0}
    <div class="flex justify-center pt-2">
      <Button variant="outline" size="sm" on:click={loadComments}>
        Load more comments
      </Button>
    </div>
  {/if}

  {#if error}
    <div class="bg-red-50 text-red-700 p-3 rounded-md text-sm">
      {error}
      <button
        class="ml-2 underline"
        on:click={() => {
          error = null;
          loadComments();
        }}
      >
        Try again
      </button>
    </div>
  {/if}
</div>
