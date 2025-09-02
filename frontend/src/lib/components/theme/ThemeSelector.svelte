<script lang="ts">
  import { themeStore } from "$lib/stores/themeStore";
  import { fade } from "svelte/transition";
  import Dropdown from "$lib/components/common/Dropdown.svelte";
  import Button from "$lib/components/common/Button.svelte";

  export let showCurrentThemeName = false;
  export let variant = "outline";
  export let size = "sm";

  // Only show themes matching the current mode
  $: themes = Object.values($themeStore.themes).filter(
    (theme) => theme.mode === $themeStore.mode,
  );

  $: currentTheme = $themeStore.themes[$themeStore.activeThemeId] || null;

  function selectTheme(themeId: string) {
    themeStore.setActiveTheme(themeId);
  }
</script>

<Dropdown let:close>
  <Button slot="trigger" {variant} {size} class="theme-selector">
    <div class="flex items-center">
      <div
        class="w-4 h-4 rounded-full mr-2 border border-neutral-200"
        style="background-color: var(--color-primary-500)"
      ></div>
      {#if showCurrentThemeName && currentTheme}
        <span>{currentTheme.name}</span>
      {:else}
        <span>Theme</span>
      {/if}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 ml-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  </Button>

  <div slot="content" class="p-2 w-56" transition:fade={{ duration: 150 }}>
    <div class="mb-3 px-2">
      <h3 class="text-sm font-medium">Select Theme</h3>
      <p class="text-xs text-neutral-500">
        {$themeStore.mode === "light" ? "Light" : "Dark"} mode themes
      </p>
    </div>

    <div class="space-y-1">
      {#each themes as theme (theme.id)}
        <button
          class="w-full px-3 py-2 text-left rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm flex items-center {$themeStore.activeThemeId ===
          theme.id
            ? 'bg-primary-50 dark:bg-primary-900'
            : ''}"
          on:click={() => {
            selectTheme(theme.id);
            close();
          }}
        >
          <div
            class="w-4 h-4 rounded-full mr-3"
            style="background-color: {theme.settings.colors.primary[500]}"
          ></div>
          <span>{theme.name}</span>

          {#if $themeStore.activeThemeId === theme.id}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 ml-auto text-primary-600 dark:text-primary-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          {/if}
        </button>
      {/each}
    </div>

    <div
      class="border-t border-neutral-200 dark:border-neutral-700 mt-2 pt-2 px-2"
    >
      <a
        href="/account/themes"
        class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-3.5 w-3.5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Create custom theme
      </a>
    </div>
  </div>
</Dropdown>
