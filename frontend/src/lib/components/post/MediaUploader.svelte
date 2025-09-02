<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import Button from "../common/Button.svelte";
  import { PostType } from "$lib/types/network";

  export let type: PostType = PostType.IMAGE;
  export let currentMedia: any = null;

  let isUploading = false;
  let dragActive = false;
  let error: string | null = null;
  let fileInput: HTMLInputElement;
  let filePreview: string | null = null;
  let files: FileList | null = null;
  let multipleFiles: File[] = [];

  const dispatch = createEventDispatcher();

  $: isImageType = type === PostType.IMAGE;
  $: isGalleryType = type === PostType.GALLERY;
  $: isVideoType = type === PostType.VIDEO;
  $: acceptTypes =
    isImageType || isGalleryType ? "image/*" : isVideoType ? "video/*" : "";
  $: multipleAllowed = isGalleryType;

  // Handle file selection
  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    files = target.files;

    if (files && files.length > 0) {
      handleFiles(files);
    }
  }

  // Handle file drop
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragActive = false;

    if (event.dataTransfer?.files) {
      files = event.dataTransfer.files;
      handleFiles(files);
    }
  }

  // Process selected files
  async function handleFiles(filesList: FileList) {
    error = null;
    isUploading = true;

    try {
      // For gallery, handle multiple files
      if (isGalleryType) {
        multipleFiles = Array.from(filesList).slice(0, 10); // Limit to 10 images

        const previewPromises = multipleFiles.map((file) => {
          return new Promise<{ file: File; url: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                file,
                url: e.target?.result as string,
              });
            };
            reader.readAsDataURL(file);
          });
        });

        const previews = await Promise.all(previewPromises);

        // In a real app, we'd upload these files to the server
        // Here we'll just create media objects with the data URLs
        const mediaObjects = previews.map((preview) => ({
          url: preview.url,
          filename: preview.file.name,
          filesize: preview.file.size,
          type: preview.file.type,
        }));

        // Set media content as gallery
        dispatch("upload", { images: mediaObjects });
      }
      // For single image or video
      else {
        const file = filesList[0];

        if (!file.type.startsWith(isImageType ? "image/" : "video/")) {
          throw new Error(
            `Please select a ${isImageType ? "valid image" : "valid video"} file`,
          );
        }

        // Generate preview
        const reader = new FileReader();
        reader.onload = (e) => {
          filePreview = e.target?.result as string;

          // In a real app, we'd upload the file to the server
          // Here we'll just create a media object with the data URL
          dispatch("upload", {
            url: filePreview,
            filename: file.name,
            filesize: file.size,
            type: file.type,
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Error handling files:", err);
      error = err.message || "Failed to upload media";
    } finally {
      isUploading = false;
    }
  }

  // Remove a file from gallery
  function removeFile(index: number) {
    if (isGalleryType && multipleFiles.length > 0) {
      multipleFiles = multipleFiles.filter((_, i) => i !== index);

      // Re-generate media objects
      if (multipleFiles.length === 0) {
        dispatch("upload", null);
      }
    } else {
      files = null;
      filePreview = null;
      dispatch("upload", null);
    }
  }

  // Drag and drop handlers
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragActive = true;
  }

  function handleDragLeave() {
    dragActive = false;
  }
</script>

<div
  class="upload-container {dragActive ? 'drag-active' : ''}"
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
  {#if isUploading}
    <div class="flex flex-col items-center justify-center py-8">
      <div
        class="w-12 h-12 border-t-2 border-primary-500 border-solid rounded-full animate-spin"
      ></div>
      <p class="mt-4 text-neutral-600">
        Uploading {isGalleryType
          ? "images"
          : isImageType
            ? "image"
            : "video"}...
      </p>
    </div>
  {:else if (isImageType || isVideoType) && filePreview}
    <div class="p-2 relative">
      {#if isImageType}
        <img
          src={filePreview}
          alt="Preview"
          class="w-full max-h-60 object-contain rounded"
        />
      {:else if isVideoType}
        <video
          src={filePreview}
          controls
          class="w-full max-h-60 object-contain rounded"
        ></video>
      {/if}

      <button
        class="absolute top-4 right-4 bg-neutral-800 bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
        on:click={() => removeFile(0)}
      >
        <svg
          class="w-4 h-4"
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
  {:else if isGalleryType && multipleFiles.length > 0}
    <div class="grid grid-cols-3 gap-2 p-2">
      {#each multipleFiles as file, i}
        <div class="relative">
          {#if filePreview}
            <img
              src={filePreview}
              alt={`Preview ${i + 1}`}
              class="w-full h-20 object-cover rounded"
            />
          {:else}
            <div
              class="w-full h-20 bg-neutral-100 rounded flex items-center justify-center"
            >
              <span class="text-xs text-neutral-500 truncate px-2"
                >{file.name}</span
              >
            </div>
          {/if}

          <button
            class="absolute top-1 right-1 bg-neutral-800 bg-opacity-50 text-white rounded-full p-0.5 hover:bg-opacity-70"
            on:click={() => removeFile(i)}
          >
            <svg
              class="w-3 h-3"
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
      {/each}

      {#if multipleFiles.length < 10}
        <div
          class="w-full h-20 border-2 border-dashed border-neutral-300 rounded flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors"
          on:click={() => fileInput?.click()}
        >
          <svg
            class="w-8 h-8 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Upload area -->
    <div
      class="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors {dragActive
        ? 'border-primary-500 bg-primary-50'
        : ''}"
      on:click={() => fileInput?.click()}
    >
      <input
        type="file"
        bind:this={fileInput}
        on:change={handleFileChange}
        accept={acceptTypes}
        multiple={multipleAllowed}
        class="hidden"
      />

      <div class="flex flex-col items-center justify-center">
        <svg
          class="w-12 h-12 text-neutral-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {#if isImageType || isGalleryType}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          {:else if isVideoType}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          {/if}
        </svg>

        <p class="text-neutral-600 mb-2">
          {#if isImageType}
            Upload an image
          {:else if isGalleryType}
            Upload images (up to 10)
          {:else if isVideoType}
            Upload a video
          {/if}
        </p>

        <p class="text-xs text-neutral-500">Click to browse or drag and drop</p>
      </div>
    </div>
  {/if}

  {#if error}
    <div class="mt-3 text-sm text-red-600" transition:fade={{ duration: 200 }}>
      {error}
    </div>
  {/if}
</div>

<style>
  .upload-container {
    min-height: 100px;
    transition: all 0.2s;
  }

  .drag-active {
    border-color: theme("colors.primary.500") !important;
    background-color: theme("colors.primary.50");
  }
</style>
