<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { incrementPortfolioView } from "$lib/services/portfolioService";
  import LoadingScreen from "$lib/components/common/LoadingScreen.svelte";
  import ErrorAlert from "$lib/components/common/ErrorAlert.svelte";
  import ComponentRenderer from "$lib/components/portfolio/ComponentRenderer.svelte";
  import type { Portfolio, PortfolioPage } from "$lib/types/portfolio";

  // Get portfolio slug from URL
  const slug = $page.params.slug;

  // State
  let portfolio: Portfolio | null = null;
  let currentPage: PortfolioPage | null = null;
  let isLoading = true;
  let error: string | null = null;
  let password = "";
  let isPasswordProtected = false;
  let isPasswordIncorrect = false;

  // Fetch portfolio data
  onMount(async () => {
    try {
      const response = await fetch(`/api/portfolios/${slug}`);
      const data = await response.json();

      if (response.status === 401) {
        // Password protected portfolio
        isPasswordProtected = true;
        isLoading = false;
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to load portfolio");
      }

      portfolio = data;

      // Set the current page to the home page or first page
      if (portfolio.pages && portfolio.pages.length > 0) {
        const homePage = portfolio.pages.find((page) => page.isHomePage);
        currentPage = homePage || portfolio.pages[0];
      }

      // Increment view count
      incrementPortfolioView(portfolio.id);
    } catch (err) {
      error = err.message || "Failed to load portfolio";
    } finally {
      isLoading = false;
    }
  });

  // Handle page navigation
  function navigateToPage(page: PortfolioPage) {
    currentPage = page;
    // Update URL without full navigation
    window.history.pushState(
      { pageId: page.id },
      "",
      `/p/${slug}/${page.slug || ""}`,
    );
  }

  // Submit password for protected portfolio
  async function submitPassword() {
    isLoading = true;
    try {
      const response = await fetch(`/api/portfolios/${slug}/access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        isPasswordIncorrect = true;
        throw new Error(data.message || "Incorrect password");
      }

      portfolio = data;

      // Set the current page to the home page or first page
      if (portfolio.pages && portfolio.pages.length > 0) {
        const homePage = portfolio.pages.find((page) => page.isHomePage);
        currentPage = homePage || portfolio.pages[0];
      }

      isPasswordProtected = false;
      isPasswordIncorrect = false;

      // Increment view count
      incrementPortfolioView(portfolio.id);
    } catch (err) {
      error = err.message || "Failed to access portfolio";
    } finally {
      isLoading = false;
    }
  }

  // Apply theme variables based on portfolio settings
  $: themeColors = portfolio?.settings?.colors || {};
  $: themeTypography = portfolio?.settings?.typography || {};
  $: themeVariables = {
    // Colors
    "--color-primary": themeColors.primary || "#3B82F6",
    "--color-neutral": themeColors.neutral || "#1F2937",
    // Typography
    "--font-heading":
      themeTypography.fontFamily?.heading || "Inter, sans-serif",
    "--font-body": themeTypography.fontFamily?.body || "Inter, sans-serif",
  };
</script>

<svelte:head>
  <title>
    {isLoading ? "Loading..." : portfolio ? `${portfolio.title}` : "Portfolio"} |
    Portfolia
  </title>

  {#if portfolio}
    <meta
      name="description"
      content={portfolio.description ||
        `${portfolio.title} - Professional portfolio on Portfolia`}
    />
    <meta property="og:title" content={portfolio.title} />
    <meta
      property="og:description"
      content={portfolio.description ||
        `${portfolio.title} - Professional portfolio on Portfolia`}
    />
    {#if portfolio.thumbnailUrl}
      <meta property="og:image" content={portfolio.thumbnailUrl} />
    {/if}
    <meta name="twitter:card" content="summary_large_image" />
  {/if}

  <!-- Add fonts based on portfolio settings -->
  {#if portfolio?.settings?.typography?.fontFamily?.heading?.includes("Inter")}
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    />
  {/if}
  {#if portfolio?.settings?.typography?.fontFamily?.heading?.includes("Poppins")}
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
    />
  {/if}
  {#if portfolio?.settings?.typography?.fontFamily?.heading?.includes("Playfair")}
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap"
    />
  {/if}
</svelte:head>

{#if isLoading}
  <LoadingScreen message="Loading portfolio..." />
{:else if error}
  <div class="flex flex-col items-center justify-center min-h-screen p-8">
    <ErrorAlert {error} />
    <div class="mt-4">
      <a href="/" class="text-primary-600 hover:text-primary-800">
        &larr; Back to home
      </a>
    </div>
  </div>
{:else if isPasswordProtected}
  <div class="flex flex-col items-center justify-center min-h-screen p-8">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <h1 class="text-2xl font-bold text-center mb-6">
        Password Protected Portfolio
      </h1>
      <p class="text-neutral-600 mb-4 text-center">
        This portfolio is protected. Please enter the password to view it.
      </p>

      <form on:submit|preventDefault={submitPassword} class="space-y-4">
        <div>
          <label
            for="password"
            class="block text-sm font-medium text-neutral-700">Password</label
          >
          <input
            id="password"
            type="password"
            bind:value={password}
            class="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm {isPasswordIncorrect
              ? 'border-red-300'
              : ''}"
            required
          />
          {#if isPasswordIncorrect}
            <p class="mt-1 text-sm text-red-600">
              Incorrect password. Please try again.
            </p>
          {/if}
        </div>

        <div>
          <button
            type="submit"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Enter Portfolio"}
          </button>
        </div>
      </form>

      <div class="mt-6 text-center">
        <a href="/" class="text-sm text-primary-600 hover:text-primary-800">
          Return to homepage
        </a>
      </div>
    </div>
  </div>
{:else if portfolio && currentPage}
  <!-- Portfolio viewer with theme variables applied -->
  <div
    style={Object.entries(themeVariables)
      .map(([key, value]) => `${key}: ${value}`)
      .join(";")}
  >
    <!-- Portfolio navigation -->
    <nav class="bg-white shadow-sm sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-lg font-bold" style="color: var(--color-neutral)">
                {portfolio.title}
              </h1>
            </div>
          </div>

          <div class="flex items-center">
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              {#each portfolio.pages as page}
                <button
                  class="inline-flex items-center px-1 pt-1 text-sm font-medium {currentPage.id ===
                  page.id
                    ? 'border-b-2 text-neutral-900 border-primary-500'
                    : 'text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}"
                  style="color: var(--color-neutral); border-color: var(--color-primary)"
                  on:click={() => navigateToPage(page)}
                >
                  {page.title}
                </button>
              {/each}
            </div>

            <!-- Mobile menu button -->
            <div class="sm:hidden ml-6">
              <button
                type="button"
                class="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <span class="sr-only">Open main menu</span>
                <svg
                  class="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Page content -->
    <main>
      {#if currentPage.content?.components}
        {#each currentPage.content.components as component}
          <ComponentRenderer {component} isEditing={false} />
        {/each}
      {:else}
        <div class="py-12 flex flex-col items-center justify-center">
          <p class="text-neutral-500">This page has no content yet.</p>
        </div>
      {/if}
    </main>

    <!-- Portfolio footer -->
    <footer class="bg-neutral-100 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          class="border-t border-neutral-200 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p class="text-neutral-500 text-sm">
            &copy; {new Date().getFullYear()}
            {portfolio.title}. All rights reserved.
          </p>
          <div class="mt-4 md:mt-0">
            <p class="text-sm text-neutral-500">
              Powered by <a
                href="/"
                class="text-primary-600 hover:text-primary-800">Portfolia</a
              >
            </p>
          </div>
        </div>
      </div>
    </footer>
  </div>
{:else}
  <div class="flex flex-col items-center justify-center min-h-screen p-8">
    <ErrorAlert error="Portfolio not found" />
    <div class="mt-4">
      <a href="/" class="text-primary-600 hover:text-primary-800">
        &larr; Back to home
      </a>
    </div>
  </div>
{/if}

<style>
  :root {
    --color-primary: #3b82f6;
    --color-neutral: #1f2937;
    --font-heading: "Inter", sans-serif;
    --font-body: "Inter", sans-serif;
  }

  /* Apply theme variables to components */
  :global(h1, h2, h3, h4, h5, h6) {
    font-family: var(--font-heading);
  }

  :global(body, p, div, span, button, input, textarea) {
    font-family: var(--font-body);
  }

  /* Apply primary color to themed elements */
  :global(.bg-primary-600) {
    background-color: var(--color-primary);
  }

  :global(.text-primary-600) {
    color: var(--color-primary);
  }
</style>
