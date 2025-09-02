<script lang="ts">
  import { portfolioEditorStore } from "$lib/stores/portfolioEditorStore";

  export let type: string;
  export let data: any = {};
  export let isEditing: boolean = false;

  function capitalize(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
</script>

<section class="py-12 bg-white">
  <div class="container mx-auto px-4">
    {#if isEditing}
      <div
        class="text-center p-8 border-2 border-dashed border-neutral-300 rounded-lg"
      >
        <h3 class="text-lg font-medium text-neutral-700">
          {capitalize(type)} Component
        </h3>
        <p class="text-neutral-500 mt-2">
          This component type is not yet implemented in the editor.
        </p>
        <p class="text-xs text-neutral-400 mt-4">Component ID: {data.id}</p>
      </div>
    {:else}
      <div class="text-center">
        <h2 class="text-2xl font-bold text-neutral-900">
          {data.title || capitalize(type)}
        </h2>
        {#if data.content}
          <p class="mt-4 text-neutral-600">{data.content}</p>
        {/if}
      </div>
    {/if}
  </div>
</section>
