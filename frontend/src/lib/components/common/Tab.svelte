<script lang="ts">
  import { getContext, onMount } from "svelte";

  export let id: string;
  export let label: string;
  export let icon: string = null;
  export let disabled: boolean = false;

  // Get parent TabGroup's properties
  const getActiveTab = getContext("activeTab");
  const updateActiveTab = getContext("updateActiveTab");
  const registerTab = getContext("registerTab");

  let isActive: boolean;

  // Register this tab with parent
  onMount(() => {
    if (registerTab) {
      registerTab(id, label);
    }
  });

  // Update when active tab changes
  $: isActive = getActiveTab === id;

  function handleClick() {
    if (!disabled) {
      updateActiveTab(id);
    }
  }

  // Icon paths
  function getIconPath(iconName) {
    switch (iconName) {
      case "document-text":
        return "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";
      case "template":
        return "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z";
      case "users":
        return "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z";
      case "user-add":
        return "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z";
      case "information-circle":
        return "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
      default:
        return "";
    }
  }
</script>

<button
  class="px-4 py-3 text-sm font-medium whitespace-nowrap {isActive
    ? 'text-primary-600'
    : 'text-neutral-600'} hover:text-neutral-900 focus:outline-none relative {disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer'}"
  on:click={handleClick}
  {disabled}
  bind:this={isActive ? activeTabElement : null}
>
  <div class="flex items-center">
    {#if icon}
      <svg
        class="w-4 h-4 mr-1 -ml-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d={getIconPath(icon)}
        />
      </svg>
    {/if}
    {label}
  </div>
</button>
