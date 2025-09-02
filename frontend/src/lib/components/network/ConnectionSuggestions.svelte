<script lang="ts">
  import { onMount } from "svelte";
  import { getSuggestedConnections } from "$lib/services/connectionService";
  import Avatar from "../common/Avatar.svelte";
  import ConnectionButton from "./ConnectionButton.svelte";
  import LoadingSpinner from "../common/LoadingSpinner.svelte";
  import Button from "../common/Button.svelte";

  export let limit = 5;
  export let showViewMore = true;

  let suggestions = [];
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    await loadSuggestions();
  });

  async function loadSuggestions() {
    isLoading = true;
    error = null;

    try {
      suggestions = await getSuggestedConnections(limit);
    } catch (err) {
      console.error("Failed to load suggestions:", err);
      error = "Failed to load connection suggestions";
    } finally {
      isLoading = false;
    }
  }

  function handleConnectionChange(event) {
    const { isFollowing } = event.detail;
    // If user followed someone, refresh suggestions to get new ones
    if (isFollowing) {
      setTimeout(() => {
        loadSuggestions();
      }, 300);
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
      <p class="text-neutral-500 mb-3">{error}</p>
      <Button variant="outline" size="sm" on:click={loadSuggestions}>
        Try Again
      </Button>
    </div>
  {:else if suggestions.length === 0}
    <div class="p-6 text-center">
      <p class="text-neutral-500">No suggestions available at this time.</p>
    </div>
  {:else}
    {#each suggestions as user (user.id)}
      <div class="p-4 flex items-center justify-between">
        <div class="flex items-center">
          <Avatar
            src={user.profiles?.[0]?.avatarUrl}
            alt={user.fullName || user.username || "User"}
            size="md"
            href="/profile/{user.username}"
          />
          <div class="ml-3">
            <a
              href="/profile/{user.username}"
              class="block text-sm font-medium text-neutral-900 hover:text-primary-600"
            >
              {user.fullName || user.username}
            </a>
            {#if user.profiles?.[0]?.title}
              <p class="text-xs text-neutral-500 truncate max-w-36">
                {user.profiles[0].title}
              </p>
            {/if}
          </div>
        </div>

        <div>
          <ConnectionButton
            userId={user.id}
            size="sm"
            variant="outline"
            on:change={handleConnectionChange}
          />
        </div>
      </div>
    {/each}

    {#if showViewMore}
      <div class="p-4 text-center">
        <a
          href="/network/suggestions"
          class="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          View more suggestions
        </a>
      </div>
    {/if}
  {/if}
</div>
