<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let value: string = "";
  export let placeholder: string = "https://example.com";

  const dispatch = createEventDispatcher();

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    dispatch("change", target.value);
  }

  function isValidUrl(url: string): boolean {
    if (!url) return true; // Empty URL is ok

    try {
      new URL(url);
      return true;
    } catch (err) {
      // Check if it might be a relative URL
      return url.startsWith("/") || url.startsWith("#");
    }
  }
</script>

<div>
  <div class="flex items-center">
    <input
      type="url"
      class="flex-1 rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm {!isValidUrl(
        value,
      )
        ? 'border-red-300'
        : ''}"
      {placeholder}
      {value}
      on:input={handleInput}
    />
    {#if value && value.trim() !== ""}
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        class="ml-2 text-primary-600 hover:text-primary-800"
        title="Open link"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    {/if}
  </div>
  {#if !isValidUrl(value) && value.trim() !== ""}
    <p class="mt-1 text-xs text-red-500">Please enter a valid URL</p>
  {/if}
</div>
