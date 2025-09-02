<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { slide } from "svelte/transition";
  import { PostType } from "$lib/types/network";
  import Button from "../common/Button.svelte";

  export let activeFilter: string = "all";
  export let showFilterBar: boolean = true;
  export let allowTypeFilter: boolean = true;
  export let allowSortOptions: boolean = true;

  const dispatch = createEventDispatcher();

  const contentTypeFilters = [
    { id: "all", label: "All", icon: "grid" },
    { id: PostType.TEXT, label: "Text", icon: "text" },
    { id: PostType.IMAGE, label: "Images", icon: "image" },
    { id: PostType.VIDEO, label: "Videos", icon: "video" },
    { id: PostType.PORTFOLIO, label: "Portfolios", icon: "portfolio" },
    { id: PostType.PROJECT, label: "Projects", icon: "project" },
    { id: PostType.JOB, label: "Jobs", icon: "job" },
  ];

  const sortOptions = [
    { id: "recent", label: "Most Recent" },
    { id: "trending", label: "Trending" },
    { id: "popular", label: "Most Popular" },
  ];

  let activeSortOption = "recent";

  function setFilter(filter: string) {
    activeFilter = filter;
    dispatch("filter", { type: filter });
  }

  function setSortOption(option: string) {
    activeSortOption = option;
    dispatch("sort", { sort: option });
  }

  function getIconPath(iconName: string) {
    switch (iconName) {
      case "grid":
        return "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z";
      case "text":
        return "M4 6h16M4 12h16M4 18h7";
      case "image":
        return "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z";
      case "video":
        return "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z";
      case "portfolio":
        return "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10";
      case "project":
        return "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z";
      case "job":
        return "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z";
      default:
        return "";
    }
  }
</script>

{#if showFilterBar}
  <div
    class="bg-white rounded-lg shadow-sm border border-neutral-200 mb-4"
    transition:slide={{ duration: 200 }}
  >
    <!-- Content type filters -->
    {#if allowTypeFilter}
      <div class="p-2 overflow-x-auto">
        <div class="flex space-x-1">
          {#each contentTypeFilters as filter}
            <Button
              variant={activeFilter === filter.id ? "primary" : "ghost"}
              size="sm"
              class="whitespace-nowrap"
              on:click={() => setFilter(filter.id)}
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
                  d={getIconPath(filter.icon)}
                />
              </svg>
              {filter.label}
            </Button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Sort options -->
    {#if allowSortOptions}
      <div class="px-4 py-2 border-t border-neutral-100 flex justify-end">
        <div class="flex items-center space-x-4 text-sm">
          <span class="text-neutral-500">Sort by:</span>
          {#each sortOptions as option}
            <button
              class="text-neutral-700 {activeSortOption === option.id
                ? 'font-semibold text-primary-600'
                : 'hover:text-primary-600'}"
              on:click={() => setSortOption(option.id)}
            >
              {option.label}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}
