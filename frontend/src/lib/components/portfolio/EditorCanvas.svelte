<script lang="ts">
  import { portfolioEditorStore } from "$lib/stores/portfolioEditorStore";

  // Calculate preview width based on device mode
  $: previewWidth = getPreviewWidth($portfolioEditorStore.previewMode);

  // Apply zoom factor to the width
  $: scaledWidth = previewWidth * $portfolioEditorStore.previewZoom;

  function getPreviewWidth(mode: string): number {
    switch (mode) {
      case "mobile":
        return 375;
      case "tablet":
        return 768;
      case "desktop":
      default:
        return 1280;
    }
  }
</script>

<div
  class="h-full overflow-auto flex flex-col items-center py-8 px-4 bg-neutral-100"
>
  <div
    class="bg-white shadow-lg transition-all duration-300 ease-in-out"
    style="width: {scaledWidth}px; max-width: 100%;"
  >
    <div class="relative">
      <!-- Content -->
      <div class="min-h-screen">
        <slot />
      </div>
    </div>
  </div>
</div>
