<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import TextField from "$lib/components/common/TextField.svelte";

  export let label = "";
  export let value = "0.25rem";

  const dispatch = createEventDispatcher();

  // Convert to number for range slider
  $: remValue = parseFloat(value);
  $: pxValue = remValue * 16; // 1rem = 16px

  // Update on slider change
  function handleChange(event) {
    const newRemValue = parseFloat(event.target.value);
    value = `${newRemValue.toFixed(2)}rem`;
    dispatch("change", value);
  }

  // Update on text input change
  function handleTextChange(event) {
    const input = event.target.value;

    // Validate if it's a valid CSS unit
    if (/^[\d.]+(rem|px|em)$/.test(input)) {
      value = input;
      dispatch("change", value);
    }
  }
</script>

<div>
  <label
    class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
    >{label}</label
  >

  <div class="grid grid-cols-3 gap-2 items-center">
    <div class="col-span-2">
      <input
        type="range"
        min="0"
        max="2"
        step="0.05"
        value={remValue}
        on:input={handleChange}
        class="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none"
      />
    </div>

    <input
      type="text"
      {value}
      on:input={handleTextChange}
      class="w-full px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
    />
  </div>

  <!-- Preview -->
  <div class="mt-2 flex items-center justify-center">
    <div class="preview-box" style="border-radius: {value};"></div>
  </div>
</div>

<style>
  .preview-box {
    width: 60px;
    height: 60px;
    background-color: var(--color-primary-500);
    border: 1px solid var(--border-normal);
  }

  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-primary-500);
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-primary-500);
    cursor: pointer;
  }
</style>
