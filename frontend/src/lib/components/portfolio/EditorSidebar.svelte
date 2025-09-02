<script lang="ts">
  import {
    portfolioEditorStore,
    currentPage,
  } from "$lib/stores/portfolioEditorStore";
  import ComponentCategoryMenu from "./ComponentCategoryMenu.svelte";
  import ComponentPreview from "./ComponentPreview.svelte";
  import Button from "../common/Button.svelte";
  import type { Component, ComponentCategory } from "$lib/types/portfolio";

  export let components: Component[];

  // State
  let activeTab: "components" | "pages" | "theme" = "components";
  let activeCategory: ComponentCategory | "all" = "all";
  let searchQuery = "";

  // Filter components by category and search
  $: filteredComponents = components
    .filter(
      (component) =>
        activeCategory === "all" || component.category === activeCategory,
    )
    .filter((component) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return component.name.toLowerCase().includes(query);
    });

  // Create new page handler
  function handleCreatePage() {
    // Will be implemented later
    alert("Create new page feature will be implemented soon");
  }

  // Set category filter
  function setCategory(category: ComponentCategory | "all") {
    activeCategory = category;
  }
</script>

<div
  class="w-72 bg-white border-r border-neutral-200 h-screen flex flex-col flex-shrink-0 overflow-hidden"
>
  <!-- Sidebar header -->
  <div class="h-16 border-b border-neutral-200 flex items-center px-4">
    <a href="/portfolios" class="flex items-center space-x-2">
      <span class="text-xl font-display font-bold text-neutral-900"
        >Portfolia</span
      >
      <span class="text-sm text-neutral-500">Editor</span>
    </a>
  </div>

  <!-- Tab navigation -->
  <div class="flex border-b border-neutral-200">
    <button
      class="flex-1 py-3 px-4 text-sm font-medium text-center {activeTab ===
      'components'
        ? 'text-primary-600 border-b-2 border-primary-600'
        : 'text-neutral-500 hover:text-neutral-900'}"
      on:click={() => (activeTab = "components")}
    >
      Components
    </button>
    <button
      class="flex-1 py-3 px-4 text-sm font-medium text-center {activeTab ===
      'pages'
        ? 'text-primary-600 border-b-2 border-primary-600'
        : 'text-neutral-500 hover:text-neutral-900'}"
      on:click={() => (activeTab = "pages")}
    >
      Pages
    </button>
    <button
      class="flex-1 py-3 px-4 text-sm font-medium text-center {activeTab ===
      'theme'
        ? 'text-primary-600 border-b-2 border-primary-600'
        : 'text-neutral-500 hover:text-neutral-900'}"
      on:click={() => (activeTab = "theme")}
    >
      Theme
    </button>
  </div>

  <!-- Tab content -->
  <div class="flex-1 overflow-y-auto">
    {#if activeTab === "components"}
      <!-- Component search -->
      <div class="p-4 border-b border-neutral-200">
        <div class="relative">
          <input
            type="text"
            placeholder="Search components..."
            class="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            bind:value={searchQuery}
          />
          {#if searchQuery}
            <button
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
              on:click={() => (searchQuery = "")}
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          {/if}
        </div>
      </div>

      <!-- Component categories -->
      <ComponentCategoryMenu {activeCategory} onSelectCategory={setCategory} />

      <!-- Component list -->
      <div class="p-4 grid grid-cols-1 gap-3">
        {#if filteredComponents.length === 0}
          <div class="text-center py-8 text-neutral-500">
            <svg
              class="mx-auto h-10 w-10 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="mt-2 text-sm">No components found</p>
          </div>
        {:else}
          {#each filteredComponents as component}
            <ComponentPreview {component} />
          {/each}
        {/if}
      </div>
    {:else if activeTab === "pages"}
      <!-- Pages management -->
      <div
        class="p-4 border-b border-neutral-200 flex justify-between items-center"
      >
        <h3 class="font-medium text-neutral-900">Pages</h3>
        <Button variant="outline" size="sm" on:click={handleCreatePage}>
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          New Page
        </Button>
      </div>

      <!-- Page list -->
      <div class="p-4">
        {#if $portfolioEditorStore.portfolio?.pages}
          <ul class="space-y-2">
            {#each $portfolioEditorStore.portfolio.pages as page}
              <li>
                <button
                  class="w-full text-left px-3 py-2 rounded-md {$portfolioEditorStore.currentPageId ===
                  page.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'hover:bg-neutral-50 text-neutral-700'}"
                  on:click={() => portfolioEditorStore.setCurrentPage(page.id)}
                >
                  <div class="flex items-center justify-between">
                    <span class="truncate">{page.title}</span>
                    {#if page.isHomePage}
                      <span
                        class="ml-2 px-1.5 py-0.5 bg-neutral-100 text-neutral-500 text-xs rounded-md"
                        >Home</span
                      >
                    {/if}
                  </div>
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <div class="text-center py-8 text-neutral-500">
            <p>No pages available</p>
          </div>
        {/if}
      </div>
    {:else if activeTab === "theme"}
      <!-- Theme settings -->
      <div class="p-4">
        <h3 class="font-medium text-neutral-900 mb-4">Theme Settings</h3>

        <!-- Theme options (simplified for now) -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2"
              >Color Scheme</label
            >
            <div class="grid grid-cols-2 gap-2">
              <div
                class="h-8 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 cursor-pointer border-2 border-transparent hover:border-primary-500"
              ></div>
              <div
                class="h-8 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 cursor-pointer border-2 border-transparent hover:border-primary-500"
              ></div>
              <div
                class="h-8 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 cursor-pointer border-2 border-transparent hover:border-primary-500"
              ></div>
              <div
                class="h-8 rounded-md bg-gradient-to-r from-rose-500 to-pink-500 cursor-pointer border-2 border-transparent hover:border-primary-500"
              ></div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2"
              >Typography</label
            >
            <select
              class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option>Modern Sans</option>
              <option>Elegant Serif</option>
              <option>Creative Mix</option>
              <option>Technical</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2"
              >Layout Style</label
            >
            <div class="flex space-x-2">
              <button
                class="px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded-md"
                >Minimal</button
              >
              <button
                class="px-3 py-1.5 text-sm bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-md"
                >Classic</button
              >
              <button
                class="px-3 py-1.5 text-sm bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-md"
                >Bold</button
              >
            </div>
          </div>
        </div>

        <!-- More theme settings would go here -->
        <div class="mt-6 py-4 border-t border-neutral-200">
          <Button variant="outline" fullWidth={true}>Import Theme</Button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Save status footer -->
  <div
    class="h-12 border-t border-neutral-200 flex items-center px-4 justify-between bg-neutral-50"
  >
    <div class="flex items-center text-xs text-neutral-500">
      {#if $portfolioEditorStore.isSaving}
        <svg
          class="animate-spin h-3 w-3 mr-1 text-neutral-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Saving...
      {:else if $portfolioEditorStore.hasChanges}
        <span class="w-2 h-2 rounded-full bg-amber-500 mr-1"></span>
        Unsaved changes
      {:else}
        <span class="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
        All changes saved
      {/if}
    </div>
  </div>
</div>
