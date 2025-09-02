<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import "../app.css";
  import { page } from "$app/stores";
  import { authStore } from "$lib/stores/authStore";
  import { themeStore } from "$lib/stores/themeStore";
  import ThemeProvider from "$lib/components/theme/ThemeProvider.svelte";
  import Header from "$lib/components/layout/Header.svelte";
  import Footer from "$lib/components/layout/Footer.svelte";
  import NotificationsContainer from "$lib/components/notifications/NotificationsContainer.svelte";

  export let data;

  // If we got user data from the server, update the auth store
  $: if (data.user) {
    authStore.setUser(data.user);
  }

  onMount(async () => {
    // Check if token is saved and restore session
    if (browser && !data.user) {
      await authStore.restoreSession();
    }
  });

  // Detect if we're on an auth page
  $: isAuthPage = $page.url.pathname.startsWith("/auth/");
</script>

<ThemeProvider>
  <div
    class="min-h-screen flex flex-col bg-background-primary text-text-primary"
  >
    {#if !isAuthPage}
      <Header />
    {/if}

    <main class="flex-grow">
      <slot />
    </main>

    {#if !isAuthPage}
      <Footer />
    {/if}

    <NotificationsContainer />
  </div>
</ThemeProvider>
