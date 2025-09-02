<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { clickOutside } from "$lib/utils/clickOutside";

  export let value: string = "#000000";

  let isOpen = false;
  let colorInput: HTMLInputElement;

  const dispatch = createEventDispatcher();

  // Predefined color palette
  const colorPalette = [
    // Blues
    "#1E40AF",
    "#3B82F6",
    "#93C5FD",
    // Greens
    "#047857",
    "#10B981",
    "#6EE7B7",
    // Reds
    "#B91C1C",
    "#EF4444",
    "#FCA5A5",
    // Yellows
    "#A16207",
    "#F59E0B",
    "#FCD34D",
    // Purples
    "#7E22CE",
    "#A855F7",
    "#D8B4FE",
    // Grays
    "#1F2937",
    "#6B7280",
    "#E5E7EB",
    // Neutral
    "#000000",
    "#FFFFFF",
  ];

  function handleColorInput(e: Event) {
    const target = e.target as HTMLInputElement;
    updateColor(target.value);
  }

  function selectPredefinedColor(color: string) {
    updateColor(color);
    isOpen = false;
  }

  function updateColor(newColor: string) {
    dispatch("change", newColor);
  }

  function togglePicker() {
    isOpen = !isOpen;
    if (isOpen && colorInput) {
      setTimeout(() => colorInput.focus(), 50);
    }
  }

  function handleClickOutside() {
    isOpen = false;
  }
</script>

<div class="relative" use:clickOutside={() => handleClickOutside()}>
  <div class="flex items-center">
    <button
      type="button"
      class="w-8 h-8 rounded border border-neutral-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      style="background-color: {value}"
      on:click={togglePicker}
      aria-label="Pick a color"
    ></button>

    <input
      type="text"
      class="ml-2 flex-1 rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
      placeholder="#RRGGBB"
      {value}
      on:input={handleColorInput}
    />
  </div>

  {#if isOpen}
    <div
      class="absolute z-10 mt-1 w-full origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      transition:slide={{ duration: 150 }}
    >
      <div class="p-3">
        <!-- Native color picker -->
        <div class="mb-3">
          <label class="block text-xs font-medium text-neutral-700 mb-1">
            Select Color
          </label>
          <input
            bind:this={colorInput}
            type="color"
            class="block w-full h-8 rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            {value}
            on:input={handleColorInput}
          />
        </div>

        <!-- Color palette -->
        <div>
          <label class="block text-xs font-medium text-neutral-700 mb-1">
            Color Palette
          </label>
          <div class="grid grid-cols-6 gap-2">
            {#each colorPalette as color}
              <button
                type="button"
                class="w-6 h-6 rounded-md border border-neutral-300 hover:ring-2 hover:ring-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 {value ===
                color
                  ? 'ring-2 ring-primary-500'
                  : ''}"
                style="background-color: {color}"
                on:click={() => selectPredefinedColor(color)}
              ></button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
