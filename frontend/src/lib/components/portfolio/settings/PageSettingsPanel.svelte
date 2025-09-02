<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import {
    portfolioEditorStore,
    currentPage,
    pages,
  } from "$lib/stores/portfolioEditorStore";
  import Button from "../../common/Button.svelte";
  import Input from "../../common/Input.svelte";
  import {
    createPortfolioPage,
    updatePortfolioPage,
    deletePortfolioPage,
    reorderPortfolioPages,
  } from "$lib/services/portfolioService";
  import { dndzone } from "svelte-dnd-action";

  export let currentPageId: string | null = null;

  // Local state
  let isCreatingPage = false;
  let newPageTitle = "";
  let isSaving = false;
  let error: string | null = null;

  const dispatch = createEventDispatcher();

  // Handle page selection
  function selectPage(pageId: string) {
    portfolioEditorStore.setCurrentPage(pageId);
  }

  // Update page title
  async function updatePageTitle(pageId: string, title: string) {
    if (!$portfolioEditorStore.portfolio) return;

    try {
      // Update the page in the backend
      await updatePortfolioPage({
        id: pageId,
        title,
      });

      // Update local state
      portfolioEditorStore.updatePage(pageId, { title });
    } catch (err) {
      console.error("Failed to update page title:", err);
      error = err.message;
    }
  }

  // Set page as homepage
  async function setAsHomePage(pageId: string) {
    if (!$portfolioEditorStore.portfolio) return;

    try {
      // Update the page in the backend
      await updatePortfolioPage({
        id: pageId,
        isHomePage: true,
      });

      // Update local state
      const pages = $portfolioEditorStore.portfolio.pages.map((page) => ({
        ...page,
        isHomePage: page.id === pageId,
      }));

      portfolioEditorStore.update((state) => ({
        ...state,
        portfolio: state.portfolio
          ? {
              ...state.portfolio,
              pages,
            }
          : null,
      }));
    } catch (err) {
      console.error("Failed to set homepage:", err);
      error = err.message;
    }
  }

  // Delete a page
  async function deletePage(pageId: string) {
    if (!$portfolioEditorStore.portfolio) return;

    // Don't allow deleting the last page
    if ($portfolioEditorStore.portfolio.pages.length <= 1) {
      error = "You can't delete the last page";
      return;
    }

    const confirmDelete = confirm(
      "Are you sure you want to delete this page? This action cannot be undone.",
    );
    if (!confirmDelete) return;

    try {
      // Delete the page from the backend
      await deletePortfolioPage(pageId);

      // Update local state
      const pages = $portfolioEditorStore.portfolio.pages.filter(
        (p) => p.id !== pageId,
      );

      // If we're deleting the current page, select another one
      if (currentPageId === pageId) {
        selectPage(pages[0]?.id || null);
      }

      // Update the portfolio
      portfolioEditorStore.update((state) => ({
        ...state,
        portfolio: state.portfolio
          ? {
              ...state.portfolio,
              pages,
            }
          : null,
      }));
    } catch (err) {
      console.error("Failed to delete page:", err);
      error = err.message;
    }
  }

  // Create a new page
  async function createNewPage() {
    if (!$portfolioEditorStore.portfolio) return;

    if (!newPageTitle.trim()) {
      error = "Page title is required";
      return;
    }

    isCreatingPage = true;
    error = null;

    try {
      // Create the page in the backend
      const newPage = await createPortfolioPage(
        $portfolioEditorStore.portfolio.id,
        {
          title: newPageTitle.trim(),
        },
      );

      // Update local state
      portfolioEditorStore.addPage(newPage);

      // Reset form
      newPageTitle = "";
      isCreatingPage = false;
    } catch (err) {
      console.error("Failed to create page:", err);
      error = err.message;
      isCreatingPage = false;
    }
  }

  // Handle page reordering via drag and drop
  async function handlePagesReorder(e: CustomEvent) {
    if (!$portfolioEditorStore.portfolio) return;

    const newPages = e.detail.items;
    const pageIds = newPages.map((p) => p.id);

    try {
      // Update the order on the backend
      await reorderPortfolioPages($portfolioEditorStore.portfolio.id, pageIds);

      // Update local state
      portfolioEditorStore.reorderPages(pageIds);
    } catch (err) {
      console.error("Failed to reorder pages:", err);
      error = err.message;
    }
  }
</script>

<div class="h-full flex flex-col">
  <!-- Header -->
  <div
    class="px-4 py-3 border-b border-neutral-200 flex items-center justify-between bg-neutral-50"
  >
    <h3 class="font-medium text-neutral-900">Page Settings</h3>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto">
    <!-- Page management -->
    <div class="p-4 border-b border-neutral-200">
      <h4 class="text-sm font-medium text-neutral-900 mb-3">Pages</h4>

      {#if $pages && $pages.length > 0}
        <!-- Pages list with drag and drop -->
        <div
          class="space-y-1 mb-4"
          use:dndzone={{ items: $pages, type: "pages-list" }}
          on:finalize={handlePagesReorder}
        >
          {#each $pages as page (page.id)}
            <div
              class="flex items-center justify-between p-2 rounded-md cursor-move {page.id ===
              currentPageId
                ? 'bg-neutral-100'
                : 'hover:bg-neutral-50'}"
              animate:flip={{ duration: 200 }}
            >
              <div class="flex items-center min-w-0">
                <svg
                  class="h-5 w-5 text-neutral-400 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 8h10M7 12h10m-8 4h6"
                  />
                </svg>
                <div class="min-w-0">
                  <input
                    type="text"
                    class="block w-full border-0 p-0 text-sm text-neutral-900 placeholder-neutral-400 focus:ring-0"
                    value={page.title}
                    on:blur={(e) => updatePageTitle(page.id, e.target.value)}
                  />
                </div>
              </div>

              <div class="flex items-center space-x-2 ml-2 flex-shrink-0">
                {#if page.isHomePage}
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    Home
                  </span>
                {:else}
                  <button
                    type="button"
                    class="text-xs text-neutral-500 hover:text-neutral-700"
                    on:click={() => setAsHomePage(page.id)}
                  >
                    Set as home
                  </button>
                {/if}

                <button
                  type="button"
                  class="text-neutral-400 hover:text-neutral-600"
                  on:click={() => selectPage(page.id)}
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  class="text-neutral-400 hover:text-red-600"
                  on:click={() => deletePage(page.id)}
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div
          class="text-sm text-neutral-500 text-center py-3 border border-dashed border-neutral-300 rounded-md"
        >
          No pages available
        </div>
      {/if}

      <!-- Add new page form -->
      <div>
        {#if error}
          <p class="text-sm text-red-600 mb-2">{error}</p>
        {/if}

        <div class="flex mt-3">
          <Input
            type="text"
            placeholder="New page title"
            class="flex-1"
            bind:value={newPageTitle}
            disabled={isCreatingPage}
          />
          <Button
            variant="outline"
            class="ml-2"
            on:click={createNewPage}
            loading={isCreatingPage}
            disabled={!newPageTitle.trim()}
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add
          </Button>
        </div>
      </div>
    </div>

    <!-- Current page settings -->
    {#if $currentPage}
      <div class="p-4">
        <h4 class="text-sm font-medium text-neutral-900 mb-3">Page Settings</h4>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1">
              Page Title
            </label>
            <Input
              value={$currentPage.title}
              on:change={(e) => updatePageTitle($currentPage.id, e.detail)}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1">
              Page Slug
            </label>
            <div class="flex items-center">
              <Input
                value={$currentPage.slug || ""}
                disabled={true}
                class="flex-1"
              />
              <button
                class="ml-2 text-primary-600 hover:text-primary-800"
                title="Edit slug (coming soon)"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            </div>
            <p class="mt-1 text-xs text-neutral-500">
              The slug determines the URL of this page.
            </p>
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="isHomePage"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              checked={$currentPage.isHomePage}
              on:change={() => setAsHomePage($currentPage.id)}
            />
            <label for="isHomePage" class="ml-2 block text-sm text-neutral-700">
              Set as home page
            </label>
          </div>

          <div>
            <Button
              variant="outline"
              class="text-red-600 hover:bg-red-50"
              on:click={() => deletePage($currentPage.id)}
              disabled={$pages.length <= 1}
            >
              Delete Page
            </Button>
            {#if $pages.length <= 1}
              <p class="mt-1 text-xs text-neutral-500">
                You cannot delete the last page.
              </p>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
