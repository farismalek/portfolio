<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import {
    fetchPortfolio,
    updatePortfolio,
    fetchComponents,
  } from "$lib/services/portfolioService";
  import {
    portfolioEditorStore,
    currentPage,
    selectedComponent,
    componentsInCurrentPage,
  } from "$lib/stores/portfolioEditorStore";
  import { dndzone } from "svelte-dnd-action";
  import EditorSidebar from "$lib/components/portfolio/EditorSidebar.svelte";
  import EditorTopbar from "$lib/components/portfolio/EditorTopbar.svelte";
  import EditorCanvas from "$lib/components/portfolio/EditorCanvas.svelte";
  import ComponentSettingsPanel from "$lib/components/portfolio/settings/ComponentSettingsPanel.svelte";
  import PageSettingsPanel from "$lib/components/portfolio/settings/PageSettingsPanel.svelte";
  import PortfolioSettingsPanel from "$lib/components/portfolio/settings/PortfolioSettingsPanel.svelte";
  import LoadingScreen from "$lib/components/common/LoadingScreen.svelte";
  import ErrorAlert from "$lib/components/common/ErrorAlert.svelte";
  import ComponentRenderer from "$lib/components/portfolio/ComponentRenderer.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Toast from "$lib/components/common/Toast.svelte";
  import type {
    Portfolio,
    Component,
    ComponentInstance,
  } from "$lib/types/portfolio";

  // Get portfolio ID from route params
  const portfolioId = $page.params.id;

  // State
  let portfolio: Portfolio | null = null;
  let components: Component[] = [];
  let isLoading = true;
  let error: string | null = null;
  let isEditorInitialized = false;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastSaveTime: Date | null = null;
  let successMessage: string | null = null;

  // Handle window beforeunload event (unsaved changes warning)
  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if ($portfolioEditorStore.hasChanges) {
      event.preventDefault();
      event.returnValue =
        "You have unsaved changes. Are you sure you want to leave?";
      return event.returnValue;
    }
  }

  // Handle components being dropped on the canvas
  function handleComponentDrop(event: DragEvent) {
    if (!event.dataTransfer) return;

    try {
      const data = JSON.parse(event.dataTransfer.getData("application/json"));

      if (data.componentId && $currentPage) {
        // Find the component definition
        const componentDef = components.find((c) => c.id === data.componentId);

        if (componentDef) {
          // Get the current number of components to append to the end
          const position = $currentPage.content?.components?.length || 0;

          // Add the component to the current page
          portfolioEditorStore.addComponent(componentDef, position);
        }
      }
    } catch (err) {
      console.error("Failed to process component drop:", err);
    }
  }

  // Initialize
  onMount(async () => {
    try {
      // Load portfolio data
      portfolio = await fetchPortfolio(portfolioId);

      // Load component definitions
      components = await fetchComponents();

      // Initialize editor store
      portfolioEditorStore.initPortfolio(portfolio);
      isEditorInitialized = true;

      // Add beforeunload event listener for unsaved changes
      window.addEventListener("beforeunload", handleBeforeUnload);
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  });

  // Clean up
  onDestroy(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    window.removeEventListener("beforeunload", handleBeforeUnload);

    // Reset editor store
    portfolioEditorStore.reset();
  });

  // Auto-save changes when portfolio is updated
  $: if (isEditorInitialized && $portfolioEditorStore.hasChanges) {
    // Debounce save operations
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(async () => {
      try {
        portfolioEditorStore.setSaving(true);

        if ($portfolioEditorStore.portfolio) {
          // Extract updated portfolio data
          const { id, title, description, settings, customizations } =
            $portfolioEditorStore.portfolio;

          // Save portfolio changes
          await updatePortfolio({
            id,
            title,
            description,
            settings,
            customizations,
          });

          // Mark as saved
          portfolioEditorStore.markAsSaved();
          lastSaveTime = new Date();
        }
      } catch (err) {
        portfolioEditorStore.setError("Failed to save changes: " + err.message);
      } finally {
        portfolioEditorStore.setSaving(false);
      }
    }, 2000); // 2 second debounce
  }

  // Handle component reordering via drag and drop
  function handleDndConsider(event: CustomEvent) {
    const newItems = event.detail.items;
    // Just update the UI for drag preview
    componentsInCurrentPage.set(newItems);
  }

  function handleDndFinalize(event: CustomEvent) {
    const newItems = event.detail.items as ComponentInstance[];
    const newOrder = newItems.map((item, index) => ({
      ...item,
      position: index,
    }));

    // Find what changed
    const sourceIndex = $componentsInCurrentPage.findIndex(
      (item) =>
        newItems.findIndex((newItem) => newItem.id === item.id) !==
        item.position,
    );

    const destinationIndex = newItems.findIndex(
      (newItem, index) =>
        $componentsInCurrentPage.find((item) => item.id === newItem.id)
          ?.position !== index,
    );

    if (sourceIndex !== -1 && destinationIndex !== -1) {
      portfolioEditorStore.reorderComponents(sourceIndex, destinationIndex);
    } else {
      // Just update the UI
      componentsInCurrentPage.set(newOrder);
    }
  }

  // Show success message
  function showSuccess(message: string) {
    successMessage = message;
    setTimeout(() => {
      successMessage = null;
    }, 3000);
  }
</script>

<svelte:head>
  <title>
    {isLoading
      ? "Loading Editor..."
      : portfolio
        ? `Editing: ${portfolio.title}`
        : "Portfolio Editor"} | Portfolia
  </title>
</svelte:head>

{#if isLoading}
  <LoadingScreen message="Loading portfolio editor..." />
{:else if error}
  <div class="flex flex-col items-center justify-center min-h-screen p-8">
    <ErrorAlert {error} />
    <div class="mt-4">
      <a href="/portfolios" class="text-primary-600 hover:text-primary-800">
        &larr; Back to portfolios
      </a>
    </div>
  </div>
{:else if isEditorInitialized}
  <div class="flex h-screen overflow-hidden bg-neutral-100">
    <!-- Left sidebar - Component palette -->
    <EditorSidebar {components} />

    <!-- Main editor area -->
    <div class="flex flex-col flex-1 h-full overflow-hidden">
      <!-- Top toolbar -->
      <EditorTopbar />

      <!-- Canvas area -->
      <div
        class="flex-1 overflow-auto"
        on:dragover|preventDefault
        on:drop|preventDefault={handleComponentDrop}
      >
        <EditorCanvas>
          {#if $currentPage}
            <!-- Component drag-drop area -->
            <section
              use:dndzone={{
                items: $componentsInCurrentPage,
                type: "component-list",
                dropTargetStyle: {},
                dropFromOthersDisabled: true,
              }}
              on:consider={handleDndConsider}
              on:finalize={handleDndFinalize}
              class="min-h-[50vh]"
            >
              {#if $componentsInCurrentPage.length === 0}
                <div
                  class="flex flex-col items-center justify-center py-16 text-center"
                >
                  <svg
                    class="w-16 h-16 text-neutral-300"
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
                  <h3 class="mt-2 text-neutral-900 font-medium">
                    This page is empty
                  </h3>
                  <p class="text-neutral-500 max-w-md mx-auto mt-1">
                    Start building your portfolio by adding components from the
                    sidebar or drop them here.
                  </p>
                  <div
                    class="mt-4 border-2 border-dashed border-neutral-300 rounded-lg p-4 text-sm text-neutral-500"
                  >
                    Drag and drop components here
                  </div>
                </div>
              {:else}
                {#each $componentsInCurrentPage as component (component.id)}
                  <div
                    class="component-wrapper my-2"
                    animate:flip={{ duration: 300 }}
                  >
                    <ComponentRenderer
                      {component}
                      componentDefinitions={components}
                      isSelected={$portfolioEditorStore.selectedComponentId ===
                        component.id}
                      isEditing={true}
                    />
                  </div>
                {/each}
              {/if}
            </section>
          {:else}
            <div class="flex items-center justify-center h-full">
              <p class="text-neutral-500">No page selected</p>
            </div>
          {/if}
        </EditorCanvas>
      </div>
    </div>

    <!-- Right sidebar - Settings panel -->
    <div
      class="w-80 flex-shrink-0 border-l border-neutral-200 bg-white overflow-y-auto"
    >
      {#if $selectedComponent}
        <ComponentSettingsPanel {components} />
      {:else if $currentPage}
        <PageSettingsPanel currentPageId={$currentPage.id} />
      {:else}
        <PortfolioSettingsPanel on:success={(e) => showSuccess(e.detail)} />
      {/if}
    </div>
  </div>

  <!-- Success toast message -->
  {#if successMessage}
    <Toast message={successMessage} type="success" />
  {/if}
{/if}
