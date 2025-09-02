<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { slide } from "svelte/transition";

  export let value: boolean = false;
  export let label: string = "";

  const dispatch = createEventDispatcher();

  function handleToggle() {
    const newValue = !value;
    dispatch("change", newValue);
  }
</script>

<div class="flex items-center">
  <button
    type="button"
    class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 {value
      ? 'bg-primary-600'
      : 'bg-neutral-200'}"
    role="switch"
    aria-checked={value}
    on:click={handleToggle}
  >
    <span class="sr-only">{label || (value ? "Enabled" : "Disabled")}</span>
    <span
      aria-hidden="true"
      class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 {value
        ? 'translate-x-5'
        : 'translate-x-0'}"
    ></span>
  </button>
  {#if label}
    <span class="ml-3 text-sm text-neutral-700">{label}</span>
  {:else}
    <span class="ml-3 text-sm text-neutral-700"
      >{value ? "Enabled" : "Disabled"}</span
    >
  {/if}
</div>
