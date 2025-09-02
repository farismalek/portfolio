<script lang="ts">
  import { onMount } from "svelte";
  import { getTrendingHashtags } from "$lib/services/searchService";
  import LoadingSpinner from "../common/LoadingSpinner.svelte";

  export let limit = 5;

  let topics = [];
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    isLoading = true;

    try {
      topics = await getTrendingHashtags(limit);
    } catch (err) {
      console.error("Failed to load trending topics:", err);
      error = "Failed to load trending topics";
    } finally {
      isLoading = false;
    }
  });

  function formatCount(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    } else {
      return count.toString();
    }
  }
</script>

<div class="divide-y divide-neutral-100">
  {#if isLoading}
    <div class="p-6 flex justify-center">
      <LoadingSpinner />
    </div>
  {:else if error}
    <div class="p-6 text-center">
      <p class="text-neutral-500">{error}</p>
    </div>
  {:else if topics.length === 0}
    <div class="p-6 text-center">
      <p class="text-neutral-500">No trending topics at this time.</p>
    </div>
  {:else}
    {#each topics as topic (topic.id)}
      <a
        href="/search?hashtag={encodeURIComponent(topic.name.replace('#', ''))}"
        class="block p-4 hover:bg-neutral-50"
      >
        <div class="flex justify-between items-center">
          <div>
            <p class="font-medium text-primary-600">#{topic.name}</p>
            <p class="text-xs text-neutral-500 mt-1">
              {formatCount(topic.postCount)} posts
            </p>
          </div>
          <div class="flex items-center text-sm text-neutral-500">
            <span>
              <svg
                class="w-4 h-4 mr-1 inline-block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              Trending
            </span>
          </div>
        </div>
      </a>
    {/each}

    <div class="p-4 text-center">
      <a
        href="/trending"
        class="text-primary-600 hover:text-primary-800 text-sm font-medium"
      >
        See more trending topics
      </a>
    </div>
  {/if}
</div>
