<script lang="ts">
  import type { AnalyticsWidgetProps } from "$lib/types/analytics";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";

  export let title: string;
  export let description: string = undefined;
  export let loading: boolean = false;
  export let error: string = null;
  export let fullWidth: boolean = false;

  let expanded = false;
  let optionsVisible = false;
</script>

<div
  class="analytics-widget bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm {fullWidth
    ? 'col-span-full'
    : ''}"
>
  <div
    class="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between"
  >
    <div>
      <h3 class="text-lg font-medium text-neutral-900 dark:text-white">
        {title}
      </h3>
      {#if description}
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {description}
        </p>
      {/if}
    </div>

    <div class="flex space-x-2">
      <button
        on:click={() => (optionsVisible = !optionsVisible)}
        class="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <button
        on:click={() => (expanded = !expanded)}
        class="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
      >
        {#if expanded}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clip-rule="evenodd"
            />
          </svg>
        {/if}
      </button>
    </div>
  </div>

  {#if optionsVisible}
    <div
      class="p-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-750"
    >
      <div class="flex flex-wrap gap-2">
        <button
          class="text-xs px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded text-neutral-700 dark:text-neutral-300"
        >
          Last 7 days
        </button>
        <button
          class="text-xs px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded text-neutral-700 dark:text-neutral-300"
        >
          Last 30 days
        </button>
        <button
          class="text-xs px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded text-neutral-700 dark:text-neutral-300"
        >
          Last 3 months
        </button>
        <button
          class="text-xs px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded text-neutral-700 dark:text-neutral-300"
        >
          Custom range...
        </button>
      </div>
    </div>
  {/if}

  <div
    class="p-4 {expanded
      ? 'h-[500px]'
      : 'h-[300px]'} transition-all duration-300 ease-in-out"
  >
    {#if loading}
      <div class="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    {:else if error}
      <div class="flex flex-col items-center justify-center h-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-12 w-12 text-neutral-400 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p class="text-neutral-500 dark:text-neutral-400">{error}</p>
      </div>
    {:else}
      <slot />
    {/if}
  </div>
</div>
