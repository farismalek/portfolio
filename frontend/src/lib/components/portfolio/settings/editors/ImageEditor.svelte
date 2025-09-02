<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Button from "../../../common/Button.svelte";

  export let value: string = "";

  const dispatch = createEventDispatcher();

  // Image upload is not implemented yet, but we'll provide UI for it
  function handleUpload() {
    // This would open a file picker and upload to S3 or similar
    alert("Image upload coming soon");
  }

  function handleClear() {
    dispatch("change", "");
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    dispatch("change", target.value);
  }

  function isValidImage(url: string): boolean {
    return (
      url.trim() !== "" &&
      (url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/assets/"))
    );
  }
</script>

<div class="space-y-3">
  <!-- Image preview -->
  {#if isValidImage(value)}
    <div class="relative rounded-md border border-neutral-300 overflow-hidden">
      <img
        src={value}
        alt="Preview"
        class="w-full h-48 object-cover"
        on:error={(e) =>
          (e.currentTarget.src =
            "https://via.placeholder.com/400x200?text=Image+not+found")}
      />
      <button
        class="absolute top-2 right-2 p-1 bg-white bg-opacity-75 rounded-full shadow-sm hover:bg-opacity-100"
        on:click={handleClear}
        title="Clear image"
      >
        <svg
          class="h-4 w-4 text-neutral-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  {:else}
    <div
      class="h-48 border border-dashed border-neutral-300 rounded-md flex items-center justify-center bg-neutral-50"
    >
      <div class="text-center">
        <svg
          class="mx-auto h-12 w-12 text-neutral-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p class="mt-1 text-sm text-neutral-500">No image selected</p>
      </div>
    </div>
  {/if}

  <!-- URL input -->
  <div class="flex space-x-2">
    <div class="flex-1">
      <input
        type="text"
        class="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        placeholder="Enter image URL"
        {value}
        on:input={handleInput}
      />
    </div>
    <Button variant="outline" size="sm" on:click={handleUpload}>Upload</Button>
  </div>
  <p class="text-xs text-neutral-500">
    Enter an image URL or upload a new image
  </p>
</div>
