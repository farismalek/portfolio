<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { fade, slide } from "svelte/transition";
  import {
    getPersonalizedFeed,
    getDiscoveryFeed,
  } from "$lib/services/feedService";
  import { getPosts } from "$lib/services/postService";
  import PostCard from "../posts/PostCard.svelte";
  import PostCreator from "../posts/PostCreator.svelte";
  import LoadingSpinner from "../common/LoadingSpinner.svelte";
  import type { Post } from "$lib/types/network";

  export let feedType:
    | "personal"
    | "discovery"
    | "profile"
    | "group"
    | "hashtag" = "personal";
  export let userId: string | null = null; // Used for profile feeds
  export let groupId: string | null = null; // Used for group feeds
  export let hashtag: string | null = null; // Used for hashtag feeds
  export let showPostCreator = true;

  let posts: Post[] = [];
  let isLoading = false;
  let hasMore = true;
  let error: string | null = null;
  let page = 1;
  const PAGE_SIZE = 10;

  const dispatch = createEventDispatcher();

  // Watch for feedType changes and reload
  $: if (feedType) {
    resetFeed();
    loadPosts();
  }

  onMount(() => {
    loadPosts();

    // Set up intersection observer for infinite scrolling
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading && hasMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.5 },
    );

    const loadMoreTrigger = document.querySelector("#load-more-trigger");
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }

    return () => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger);
      }
    };
  });

  function resetFeed() {
    posts = [];
    page = 1;
    hasMore = true;
    error = null;
  }

  async function loadPosts() {
    if (isLoading || !hasMore) return;

    isLoading = true;
    error = null;

    try {
      let newPosts: Post[] = [];

      if (feedType === "personal") {
        newPosts = await getPersonalizedFeed(page, PAGE_SIZE);
      } else if (feedType === "discovery") {
        newPosts = await getDiscoveryFeed(page, PAGE_SIZE);
      } else if (feedType === "profile" && userId) {
        const response = await getPosts({ userId, page, limit: PAGE_SIZE });
        newPosts = response.posts;
      } else if (feedType === "hashtag" && hashtag) {
        const response = await getPosts({ hashtag, page, limit: PAGE_SIZE });
        newPosts = response.posts;
      } else if (feedType === "group" && groupId) {
        // This would call a group-specific API
        const response = await getPosts({ groupId, page, limit: PAGE_SIZE });
        newPosts = response.posts;
      }

      if (page === 1) {
        posts = newPosts;
      } else {
        posts = [...posts, ...newPosts];
      }

      hasMore = newPosts.length === PAGE_SIZE;
    } catch (err) {
      console.error("Failed to load posts:", err);
      error = err.message || "Failed to load feed";
    } finally {
      isLoading = false;
    }
  }

  function loadMorePosts() {
    if (!isLoading && hasMore) {
      page += 1;
      loadPosts();
    }
  }

  function handleNewPost(event) {
    const newPost = event.detail;
    posts = [newPost, ...posts];
    dispatch("post", newPost);
  }

  function handlePostUpdate(event) {
    const updatedPost = event.detail;
    posts = posts.map((post) =>
      post.id === updatedPost.id ? updatedPost : post,
    );
    dispatch("update", updatedPost);
  }

  function handlePostDelete(event) {
    const postId = event.detail;
    posts = posts.filter((post) => post.id !== postId);
    dispatch("delete", postId);
  }
</script>

<div class="space-y-4">
  {#if showPostCreator}
    <div transition:slide={{ duration: 200 }}>
      <PostCreator {feedType} {groupId} on:post={handleNewPost} />
    </div>
  {/if}

  {#if posts.length === 0 && !isLoading}
    <div
      class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center"
      transition:fade
    >
      <svg
        class="w-16 h-16 text-neutral-300 mx-auto"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-neutral-900">No posts yet</h3>
      <p class="mt-2 text-neutral-500 max-w-md mx-auto">
        {#if feedType === "personal"}
          Follow more people or join communities to see content in your feed.
        {:else if feedType === "profile"}
          This user hasn't posted anything yet.
        {:else if feedType === "hashtag"}
          No posts found with this hashtag.
        {:else if feedType === "group"}
          No posts in this group yet. Be the first to post!
        {:else}
          There's no content available right now. Check back later!
        {/if}
      </p>
    </div>
  {/if}

  {#each posts as post (post.id)}
    <div transition:fade={{ duration: 300 }}>
      <PostCard
        {post}
        on:update={handlePostUpdate}
        on:delete={handlePostDelete}
        on:share
        on:bookmark
      />
    </div>
  {/each}

  {#if isLoading}
    <div class="py-8 flex justify-center">
      <LoadingSpinner size="lg" />
    </div>
  {:else if error}
    <div class="bg-red-50 text-red-700 p-4 rounded-md">
      <div class="flex">
        <svg
          class="h-5 w-5 text-red-400 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p>{error}</p>
      </div>
      <div class="mt-3 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          on:click={() => {
            error = null;
            loadPosts();
          }}
        >
          Try Again
        </Button>
      </div>
    </div>
  {/if}

  {#if hasMore && !isLoading}
    <div id="load-more-trigger" class="h-10"></div>
  {/if}
</div>
