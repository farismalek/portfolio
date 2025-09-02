<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let activeTab: string;

  const dispatch = createEventDispatcher();

  // Find active tab to highlight indicator correctly
  let activeTabElement: HTMLElement;
  let tabContainer: HTMLElement;
  let indicatorStyle = "";

  $: if (activeTabElement && tabContainer) {
    const containerRect = tabContainer.getBoundingClientRect();
    const tabRect = activeTabElement.getBoundingClientRect();

    indicatorStyle = `
      width: ${tabRect.width}px;
      transform: translateX(${tabRect.left - containerRect.left}px);
    `;
  }

  // Track all tabs added as children
  let tabs = [];

  // Register tabs with parent
  export function registerTab(id, label) {
    tabs = [...tabs, { id, label }];
    return tabs.length - 1;
  }

  function updateActiveTab(newTab) {
    if (newTab !== activeTab) {
      activeTab = newTab;
      dispatch("change", activeTab);
    }
  }
</script>

<div class="border-b border-neutral-200 relative">
  <div bind:this={tabContainer} class="flex overflow-x-auto scrollbar-hide">
    <slot />
  </div>

  <!-- Active tab indicator -->
  <div
    class="absolute bottom-0 h-0.5 bg-primary-600 transition-all duration-200"
    style={indicatorStyle}
  ></div>
</div>

<style>
  /* Hide scrollbar */
  :global(.scrollbar-hide) {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  :global(.scrollbar-hide::-webkit-scrollbar) {
    display: none;
  }
</style>
