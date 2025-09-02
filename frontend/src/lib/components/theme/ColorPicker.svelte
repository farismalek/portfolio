<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { hexToHSL, hslToHex } from "$lib/utils/themeUtils";

  export let label = "";
  export let value = "#000000";
  export let showHexValue = true;

  const dispatch = createEventDispatcher();

  // Parse initial color
  let hex = value;

  // Convert to HSL for the sliders
  $: hsl = hexToHSL(hex);
  $: hue = hsl.h;
  $: saturation = hsl.s;
  $: lightness = hsl.l;

  // Update hex when sliders change
  $: {
    hex = hslToHex(hue, saturation, lightness);
    dispatch("change", hex);
  }

  // Handle direct hex input
  function handleHexInput(event) {
    const input = event.target.value;

    // Validate hex
    if (/^#[0-9A-Fa-f]{6}$/.test(input)) {
      hex = input;
    }
  }
</script>

<div class="color-picker">
  <label
    class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
    >{label}</label
  >

  <div class="flex space-x-2">
    <div
      class="color-preview w-10 h-10 rounded-md border border-neutral-200 dark:border-neutral-700"
      style="background-color: {hex}"
    ></div>

    <div class="flex-1">
      <input
        type="range"
        min="0"
        max="360"
        bind:value={hue}
        class="w-full h-6 appearance-none bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-red-500 rounded-md"
      />

      <div class="flex space-x-2 mt-1">
        <input
          type="range"
          min="0"
          max="100"
          bind:value={saturation}
          class="flex-1 h-4 appearance-none bg-gradient-to-r from-neutral-300 to-{hex} rounded-md"
        />

        <input
          type="range"
          min="0"
          max="100"
          bind:value={lightness}
          class="flex-1 h-4 appearance-none bg-gradient-to-r from-black via-{hex} to-white rounded-md"
        />
      </div>
    </div>
  </div>

  {#if showHexValue}
    <input
      type="text"
      bind:value={hex}
      on:input={handleHexInput}
      class="mt-1 w-full px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
    />
  {/if}
</div>

<style>
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    border: 2px solid #ddd;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    border: 2px solid #ddd;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
</style>
