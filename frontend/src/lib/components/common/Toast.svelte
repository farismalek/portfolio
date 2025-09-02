<script lang="ts">
  import { onMount } from "svelte";
  import { fly, fade } from "svelte/transition";

  export let message: string;
  export let type: "success" | "error" | "info" | "warning" = "info";
  export let duration: number = 5000; // Duration in milliseconds
  export let position:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center" = "top-right";

  let visible = true;

  // Toast type styles
  const typeStyles = {
    success: {
      bg: "bg-green-50",
      icon: "text-green-400",
      text: "text-green-800",
      iconPath:
        "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
    },
    error: {
      bg: "bg-red-50",
      icon: "text-red-400",
      text: "text-red-800",
      iconPath:
        "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
    },
    info: {
      bg: "bg-blue-50",
      icon: "text-blue-400",
      text: "text-blue-800",
      iconPath:
        "M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z",
    },
    warning: {
      bg: "bg-yellow-50",
      icon: "text-yellow-400",
      text: "text-yellow-800",
      iconPath:
        "M10 18a8 8 0 100-16 8 8 0 000 16zm1-7a1 1 0 10-2 0v1a1 1 0 102 0v-1zm0-5a1 1 0 10-2 0v3a1 1 0 102 0V6z",
    },
  };

  // Position styles
  const positionStyles = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
  };

  // Auto-hide toast after duration
  onMount(() => {
    const timer = setTimeout(() => {
      visible = false;
    }, duration);

    return () => clearTimeout(timer);
  });

  // Handle close button
  function close() {
    visible = false;
  }
</script>

{#if visible}
  <div
    class="fixed z-50 {positionStyles[position]}"
    in:fly={{ y: position.startsWith("top") ? -20 : 20, duration: 300 }}
    out:fade={{ duration: 200 }}
  >
    <div
      class="max-w-sm w-full shadow-lg rounded-lg pointer-events-auto {typeStyles[
        type
      ].bg}"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 {typeStyles[type].icon}"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d={typeStyles[type].iconPath}
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium {typeStyles[type].text}">{message}</p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              class="rounded-md inline-flex {typeStyles[type]
                .text} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              on:click={close}
            >
              <span class="sr-only">Close</span>
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
