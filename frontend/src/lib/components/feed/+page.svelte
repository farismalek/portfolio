<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { page } from "$app/stores";
  import { authUser } from "$lib/stores/authStore";
  import FeedContainer from "$lib/components/feed/FeedContainer.svelte";
  import FeedFilter from "$lib/components/feed/FeedFilter.svelte";
  import ConnectionSuggestions from "$lib/components/network/ConnectionSuggestions.svelte";
  import TrendingTopics from "$lib/components/network/TrendingTopics.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";

  let feedType: "personal" | "discovery" = "personal";
  let activeFilter = "all";
  let activeSortOption = "recent";
  let isFilterVisible = true;

  // Check URL params for feed type
  onMount(() => {
    if (browser) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("type") === "discovery") {
        feedType = "discovery";
      }
    }
  });

  function toggleFeedType() {
    feedType = feedType === "personal" ? "discovery" : "personal";

    // Update URL
    if (browser) {
      const url = new URL(window.location.href);
      url.searchParams.set("type", feedType);
      window.history.replaceState({}, "", url);
    }
  }

  function handleFilterChange(event) {
    activeFilter = event.detail.type;
  }

  function handleSortChange(event) {
    activeSortOption = event.detail.sort;
  }

  function toggleFilterVisibility() {
    isFilterVisible = !isFilterVisible;
  }
</script>

<svelte:head>
  <title>
    {feedType === "personal" ? "My Feed" : "Discover"} | Portfolia
  </title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-6">
  {#if !$authUser}
    <div
      class="bg-white rounded-lg shadow-md p-8 text-center mb-8"
      transition:fade
    >
      <h2 class="text-2xl font-bold text-neutral-900 mb-2">
        Join Portfolia to see personalized content
      </h2>
      <p class="text-neutral-600 mb-6">
        Connect with other creators, showcase your work, and discover new
        opportunities.
      </p>
      <div class="flex justify-center gap-4">
        <Button variant="primary" on:click={() => goto("/signup")}>
          Sign Up Now
        </Button>
        <Button variant="outline" on:click={() => goto("/login")}>
          Log In
        </Button>
      </div>
    </div>
  {/if}

  <div class="flex flex-col lg:flex-row gap-6">
    <!-- Main feed column -->
    <div class="flex-1 min-w-0">
      <!-- Feed type selector -->
      <div class="mb-4 flex items-center justify-between">
        <div class="flex border border-neutral-200 rounded-lg overflow-hidden">
          <button
            class="px-4 py-2 text-sm font-medium {feedType === 'personal'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-50'}"
            on:click={() => (feedType = "personal")}
          >
            Personal Feed
          </button>
          <button
            class="px-4 py-2 text-sm font-medium {feedType === 'discovery'
              ? 'bg-primary-500 text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-50'}"
            on:click={() => (feedType = "discovery")}
          >
            Discover
          </button>
        </div>

        <button
          class="text-neutral-500 hover:text-neutral-700 flex items-center text-sm"
          on:click={toggleFilterVisibility}
        >
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
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          {isFilterVisible ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      <!-- Feed filters -->
      <FeedFilter
        {activeFilter}
        showFilterBar={isFilterVisible}
        on:filter={handleFilterChange}
        on:sort={handleSortChange}
      />

      <!-- Feed content -->
      <FeedContainer {feedType} showPostCreator={!!$authUser} />
    </div>

    <!-- Right sidebar -->
    <div class="lg:w-80 flex-shrink-0 space-y-4">
      {#if $authUser}
        <!-- Connection suggestions -->
        <div
          class="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden"
        >
          <div class="p-4 border-b border-neutral-100">
            <h3 class="font-medium">People to Follow</h3>
          </div>
          <ConnectionSuggestions />
        </div>
      {/if}

      <!-- Trending topics -->
      <div
        class="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden sticky top-20"
      >
        <div class="p-4 border-b border-neutral-100">
          <h3 class="font-medium">Trending Topics</h3>
        </div>
        <TrendingTopics />
      </div>
    </div>
  </div>
</div>
