<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { slide } from "svelte/transition";
  import { isAuthenticated, currentUser } from "$lib/stores/authStore";
  import { login, logout } from "$lib/auth/auth0";
  import Button from "$lib/components/common/Button.svelte";
  import Avatar from "$lib/components/common/Avatar.svelte";
  import { goto } from "$app/navigation";

  export let isLandingPage = false;

  let isScrolled = false;
  let mobileMenuOpen = false;
  let userMenuOpen = false;

  onMount(() => {
    const handleScroll = () => {
      isScrolled = window.scrollY > 20;
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  const navigation = [
    { name: "Explore", href: "/explore" },
    { name: "Pricing", href: "/pricing" },
    { name: "Features", href: "/#features" },
    { name: "Jobs", href: "/jobs" },
  ];

  const userNavigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Your Profiles", href: "/profiles" },
    { name: "Settings", href: "/settings" },
  ];

  function closeMenus() {
    mobileMenuOpen = false;
    userMenuOpen = false;
  }

  function handleNavigation(href: string) {
    closeMenus();
    goto(href);
  }

  function handleLogout() {
    closeMenus();
    logout();
  }

  // Compute navbar style based on page and scroll state
  $: navbarClass = isLandingPage
    ? `fixed w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white shadow-sm" : "bg-transparent"}`
    : "sticky top-0 z-50 bg-white border-b border-neutral-200";

  // Text color changes on landing page when scrolled
  $: textColorClass =
    isLandingPage && !isScrolled ? "text-white" : "text-neutral-900";
</script>

<header class={navbarClass}>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="flex h-16 items-center justify-between">
      <!-- Logo and desktop navigation -->
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <a href="/" class="flex items-center">
            <span class="text-2xl font-display font-bold {textColorClass}"
              >Portfolia</span
            >
          </a>
        </div>
        <div class="hidden md:ml-10 md:flex md:space-x-8">
          {#each navigation as item}
            <a
              href={item.href}
              class="{textColorClass} font-medium hover:text-primary-600 transition-colors px-3 py-2 text-sm"
              class:text-primary-600={$page.url.pathname === item.href}
            >
              {item.name}
            </a>
          {/each}
        </div>
      </div>

      <!-- Right side actions -->
      <div class="flex items-center">
        {#if $isAuthenticated}
          <!-- User is logged in -->
          <div class="hidden md:ml-4 md:flex md:flex-shrink-0 md:items-center">
            <!-- Notifications -->
            <button
              class="rounded-full p-1 mr-3 text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <span class="sr-only">View notifications</span>
              <svg
                class="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>

            <!-- Profile dropdown -->
            <div class="relative">
              <button
                on:click={() => (userMenuOpen = !userMenuOpen)}
                type="button"
                class="flex rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                id="user-menu-button"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <span class="sr-only">Open user menu</span>
                <Avatar
                  name={$currentUser?.name || "User"}
                  src={$currentUser?.picture}
                  size="sm"
                />
              </button>

              {#if userMenuOpen}
                <div
                  transition:slide={{ duration: 200 }}
                  class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabindex="-1"
                >
                  {#each userNavigation as item}
                    <a
                      href={item.href}
                      class="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      role="menuitem"
                      on:click|preventDefault={() =>
                        handleNavigation(item.href)}
                    >
                      {item.name}
                    </a>
                  {/each}
                  <button
                    class="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    role="menuitem"
                    on:click={handleLogout}
                  >
                    Sign out
                  </button>
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <!-- User is not logged in -->
          <div class="hidden md:flex md:items-center md:space-x-4">
            <Button variant="ghost" on:click={login} class={textColorClass}>
              Log in
            </Button>
            <Button
              variant={isLandingPage && !isScrolled ? "outline" : "primary"}
              on:click={() => goto("/signup")}
              class={isLandingPage && !isScrolled
                ? "border-white text-white hover:bg-white hover:bg-opacity-20"
                : ""}
            >
              Sign up
            </Button>
          </div>
        {/if}

        <!-- Mobile menu button -->
        <div class="flex md:hidden">
          <button
            on:click={() => (mobileMenuOpen = !mobileMenuOpen)}
            type="button"
            class="{textColorClass} p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-controls="mobile-menu"
            aria-expanded={mobileMenuOpen}
          >
            <span class="sr-only"
              >{mobileMenuOpen ? "Close menu" : "Open menu"}</span
            >
            {#if mobileMenuOpen}
              <svg
                class="h-6 w-6"
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
            {:else}
              <svg
                class="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile menu -->
  {#if mobileMenuOpen}
    <div
      class="md:hidden bg-white border-b border-neutral-200 shadow-sm"
      id="mobile-menu"
      transition:slide={{ duration: 300 }}
    >
      <div class="space-y-1 px-2 pb-3 pt-2">
        {#each navigation as item}
          <a
            href={item.href}
            class="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100 hover:text-primary-600"
            class:bg-primary-50={$page.url.pathname === item.href}
            class:text-primary-600={$page.url.pathname === item.href}
            on:click|preventDefault={() => handleNavigation(item.href)}
          >
            {item.name}
          </a>
        {/each}

        {#if $isAuthenticated}
          <div class="border-t border-neutral-200 pt-4 pb-3">
            <div class="flex items-center px-4">
              <div class="flex-shrink-0">
                <Avatar
                  name={$currentUser?.name || "User"}
                  src={$currentUser?.picture}
                  size="md"
                />
              </div>
              <div class="ml-3">
                <div class="text-base font-medium text-neutral-800">
                  {$currentUser?.name}
                </div>
                <div class="text-sm font-medium text-neutral-500">
                  {$currentUser?.email}
                </div>
              </div>
            </div>
            <div class="mt-3 space-y-1 px-2">
              {#each userNavigation as item}
                <a
                  href={item.href}
                  class="block rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100 hover:text-primary-600"
                  on:click|preventDefault={() => handleNavigation(item.href)}
                >
                  {item.name}
                </a>
              {/each}
              <button
                class="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-neutral-700 hover:bg-neutral-100 hover:text-primary-600"
                on:click={handleLogout}
              >
                Sign out
              </button>
            </div>
          </div>
        {:else}
          <div
            class="mt-4 border-t border-neutral-200 pt-4 flex flex-col space-y-3 px-3"
          >
            <Button variant="secondary" fullWidth={true} on:click={login}>
              Log in
            </Button>
            <Button
              variant="primary"
              fullWidth={true}
              on:click={() => handleNavigation("/signup")}
            >
              Sign up
            </Button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</header>
