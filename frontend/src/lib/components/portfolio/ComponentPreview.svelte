<script lang="ts">
  import {
    portfolioEditorStore,
    currentPage,
  } from "$lib/stores/portfolioEditorStore";
  import type { Component } from "$lib/types/portfolio";

  export let component: Component;

  // Drag-and-drop handling
  function handleDragStart(event: DragEvent) {
    if (!event.dataTransfer) return;

    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        componentId: component.id,
        componentType: component.type,
      }),
    );

    portfolioEditorStore.startDragging(component.id);
  }

  function handleDragEnd() {
    portfolioEditorStore.endDragging();
  }

  // Add component on click
  function handleAddComponent() {
    // Check if we have a current page
    if (!$currentPage) {
      alert("Please select a page first");
      return;
    }

    // Get the current number of components to append to the end
    const position = $currentPage.content?.components?.length || 0;

    // Add the component to the current page
    portfolioEditorStore.addComponent(component, position);
  }
</script>

<div
  class="border border-neutral-200 rounded-md p-2 cursor-move bg-white hover:border-primary-300 hover:shadow-sm transition-all"
  draggable="true"
  on:dragstart={handleDragStart}
  on:dragend={handleDragEnd}
>
  <div class="flex items-start">
    <div
      class="w-12 h-12 bg-neutral-100 rounded flex-shrink-0 flex items-center justify-center"
    >
      <img
        src={component.thumbnailUrl}
        alt={component.name}
        class="max-w-full max-h-full object-contain"
        onerror="this.src='https://via.placeholder.com/48?text=Component'"
      />
    </div>
    <div class="ml-3 flex-1">
      <h4 class="font-medium text-sm text-neutral-900">{component.name}</h4>
      <p class="text-xs text-neutral-500 line-clamp-1 mt-0.5">
        {component.category}
      </p>

      <!-- Add button -->
      <button
        class="mt-1 text-xs text-primary-600 hover:text-primary-800 flex items-center"
        on:click={handleAddComponent}
        on:click|stopPropagation
      >
        <svg
          class="h-3 w-3 mr-0.5"
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
      </button>
    </div>

    {#if component.isPremium}
      <div class="ml-2">
        <span
          class="inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs bg-amber-100 text-amber-800"
        >
          PRO
        </span>
      </div>
    {/if}
  </div>
</div>
