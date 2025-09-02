<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let value: string = "";
  export let placeholder: string = "";
  export let multiline: boolean = false;

  const dispatch = createEventDispatcher();

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    dispatch("change", target.value);
  }
</script>

{#if multiline}
  <textarea
    class="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
    rows="4"
    {placeholder}
    {value}
    on:input={handleInput}
  ></textarea>
{:else}
  <input
    type="text"
    class="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
    {placeholder}
    {value}
    on:input={handleInput}
  />
{/if}
