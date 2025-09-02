<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { authStore } from "$lib/stores/authStore";

  onMount(() => {
    // This page is just a loading placeholder
    // The actual callback handling is in the auth0.ts initialize function
    authStore.setLoading(true);
  });
</script>

<div class="flex flex-col items-center justify-center min-h-screen p-4">
  <div class="w-full max-w-md text-center">
    <div
      class="animate-spin mb-4 mx-auto h-12 w-12 border-4 border-primary-400 border-t-primary-600 rounded-full"
    ></div>
    <h2 class="text-2xl font-semibold text-neutral-800 mb-2">
      Authenticating...
    </h2>
    <p class="text-neutral-600">
      Please wait while we complete the authentication process.
    </p>
  </div>
</div>
