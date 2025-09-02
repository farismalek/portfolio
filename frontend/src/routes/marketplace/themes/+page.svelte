<script lang="ts">
  import { onMount } from "svelte";
  import { themeStore } from "$lib/stores/themeStore";
  import { BUILT_IN_THEMES } from "$lib/themes/presets";
  import Button from "$lib/components/common/Button.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Badge from "$lib/components/common/Badge.svelte";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import Dialog from "$lib/components/common/Dialog.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";

  let isLoading = true;
  let premiumThemes = [];
  let selectedTheme = null;
  let showThemeDetails = false;
  let error = "";
  let success = "";

  // Initialize on mount
  onMount(async () => {
    // Simulate API call to get premium themes from marketplace
    await fetchPremiumThemes();
    isLoading = false;
  });

  async function fetchPremiumThemes() {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock premium themes data
    premiumThemes = [
      {
        id: "aurora-light",
        name: "Aurora Light",
        description:
          "A premium light theme with elegant gradients and modern aesthetics",
        designer: "Portfolia Design Team",
        price: 1499, // In cents
        thumbnailUrl: "/themes/aurora-light-preview.jpg",
        mode: "light",
        isPremium: true,
        isPopular: true,
        rating: 4.8,
        reviewCount: 56,
        colors: {
          primary: "#3B82F6",
          secondary: "#10B981",
          accent: "#F59E0B",
        },
        previewUrl: "/themes/aurora-light-preview.jpg",
      },
      {
        id: "aurora-dark",
        name: "Aurora Dark",
        description:
          "A premium dark theme with elegant gradients and modern aesthetics",
        designer: "Portfolia Design Team",
        price: 1499, // In cents
        thumbnailUrl: "/themes/aurora-dark-preview.jpg",
        mode: "dark",
        isPremium: true,
        isPopular: true,
        rating: 4.7,
        reviewCount: 42,
        colors: {
          primary: "#60A5FA",
          secondary: "#34D399",
          accent: "#FBBF24",
        },
        previewUrl: "/themes/aurora-dark-preview.jpg",
      },
      {
        id: "geometric-light",
        name: "Geometric Light",
        description:
          "Bold shapes and strong typography for a distinctive portfolio",
        designer: "Alex Chen Design",
        price: 1999, // In cents
        thumbnailUrl: "/themes/geometric-light-preview.jpg",
        mode: "light",
        isPremium: true,
        isNew: true,
        rating: 4.9,
        reviewCount: 24,
        colors: {
          primary: "#8B5CF6",
          secondary: "#EC4899",
          accent: "#F59E0B",
        },
        previewUrl: "/themes/geometric-light-preview.jpg",
      },
      {
        id: "geometric-dark",
        name: "Geometric Dark",
        description:
          "Bold shapes and strong typography for a distinctive portfolio",
        designer: "Alex Chen Design",
        price: 1999, // In cents
        thumbnailUrl: "/themes/geometric-dark-preview.jpg",
        mode: "dark",
        isPremium: true,
        isNew: true,
        rating: 4.8,
        reviewCount: 19,
        colors: {
          primary: "#A78BFA",
          secondary: "#F472B6",
          accent: "#FBBF24",
        },
        previewUrl: "/themes/geometric-dark-preview.jpg",
      },
      {
        id: "minimal-pro-light",
        name: "Minimal Pro Light",
        description: "Clean, sophisticated design with perfect typography",
        designer: "Minimal Studios",
        price: 2499, // In cents
        thumbnailUrl: "/themes/minimal-pro-light-preview.jpg",
        mode: "light",
        isPremium: true,
        isBestseller: true,
        rating: 5.0,
        reviewCount: 128,
        colors: {
          primary: "#111827",
          secondary: "#374151",
          accent: "#4B5563",
        },
        previewUrl: "/themes/minimal-pro-light-preview.jpg",
      },
      {
        id: "minimal-pro-dark",
        name: "Minimal Pro Dark",
        description: "Clean, sophisticated design with perfect typography",
        designer: "Minimal Studios",
        price: 2499, // In cents
        thumbnailUrl: "/themes/minimal-pro-dark-preview.jpg",
        mode: "dark",
        isPremium: true,
        isBestseller: true,
        rating: 4.9,
        reviewCount: 112,
        colors: {
          primary: "#E5E7EB",
          secondary: "#D1D5DB",
          accent: "#9CA3AF",
        },
        previewUrl: "/themes/minimal-pro-dark-preview.jpg",
      },
      {
        id: "corporate-plus-light",
        name: "Corporate+ Light",
        description: "Professional theme perfect for business portfolios",
        designer: "Enterprise Themes",
        price: 1799, // In cents
        thumbnailUrl: "/themes/corporate-plus-light-preview.jpg",
        mode: "light",
        isPremium: true,
        rating: 4.6,
        reviewCount: 87,
        colors: {
          primary: "#1E40AF",
          secondary: "#1E3A8A",
          accent: "#3B82F6",
        },
        previewUrl: "/themes/corporate-plus-light-preview.jpg",
      },
      {
        id: "corporate-plus-dark",
        name: "Corporate+ Dark",
        description: "Professional theme perfect for business portfolios",
        designer: "Enterprise Themes",
        price: 1799, // In cents
        thumbnailUrl: "/themes/corporate-plus-dark-preview.jpg",
        mode: "dark",
        isPremium: true,
        rating: 4.5,
        reviewCount: 76,
        colors: {
          primary: "#60A5FA",
          secondary: "#3B82F6",
          accent: "#93C5FD",
        },
        previewUrl: "/themes/corporate-plus-dark-preview.jpg",
      },
    ];
  }

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function openThemeDetails(theme) {
    selectedTheme = theme;
    showThemeDetails = true;
  }

  async function handlePurchaseTheme(theme) {
    try {
      // Simulate purchase API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      success = `Successfully purchased ${theme.name} theme!`;
      showThemeDetails = false;

      // In a real app, after purchase the theme would be added to user's themes
    } catch (err) {
      error = "Failed to process purchase. Please try again.";
    }
  }

  // Filter themes by mode
  $: lightThemes = premiumThemes.filter((theme) => theme.mode === "light");
  $: darkThemes = premiumThemes.filter((theme) => theme.mode === "dark");
</script>

<svelte:head>
  <title>Theme Marketplace | Portfolia</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <PageHeader
    title="Theme Marketplace"
    description="Discover premium themes to make your portfolio stand out"
  >
    <div class="flex space-x-2">
      <Button href="/account/themes" variant="outline">My Themes</Button>
    </div>
  </PageHeader>

  {#if success}
    <div class="my-4">
      <AlertBox type="success" dismissible bind:visible={success}>
        {success}
      </AlertBox>
    </div>
  {/if}

  {#if isLoading}
    <div class="flex justify-center py-16">
      <LoadingSpinner />
    </div>
  {:else}
    <div class="mb-12">
      <h2 class="text-xl font-medium mb-4">Premium Light Themes</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each lightThemes as theme (theme.id)}
          <Card
            class="theme-card overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            on:click={() => openThemeDetails(theme)}
          >
            <div class="relative">
              <!-- Theme Preview Image (placeholder) -->
              <div
                class="h-40 bg-neutral-100 flex items-center justify-center"
                style="background: linear-gradient(to right, {theme.colors
                  .primary}, {theme.colors.secondary})"
              >
                <div class="text-white font-bold text-lg">
                  {theme.name}
                </div>
              </div>

              <!-- Badges -->
              <div class="absolute top-2 right-2 flex flex-col gap-2">
                {#if theme.isNew}
                  <Badge color="primary">New</Badge>
                {/if}
                {#if theme.isPopular}
                  <Badge color="warning">Popular</Badge>
                {/if}
                {#if theme.isBestseller}
                  <Badge color="success">Bestseller</Badge>
                {/if}
              </div>
            </div>

            <div class="p-4">
              <div class="flex justify-between mb-2">
                <h3 class="font-medium">{theme.name}</h3>
                <span class="font-medium text-neutral-900 dark:text-white">
                  {formatPrice(theme.price)}
                </span>
              </div>

              <p
                class="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2"
              >
                {theme.description}
              </p>

              <div class="flex justify-between items-center">
                <div class="text-xs text-neutral-500 dark:text-neutral-400">
                  By {theme.designer}
                </div>

                <div class="flex items-center">
                  <span class="text-amber-500">★</span>
                  <span class="text-xs ml-1"
                    >{theme.rating} ({theme.reviewCount})</span
                  >
                </div>
              </div>
            </div>
          </Card>
        {/each}
      </div>
    </div>

    <div>
      <h2 class="text-xl font-medium mb-4">Premium Dark Themes</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each darkThemes as theme (theme.id)}
          <Card
            class="theme-card overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            on:click={() => openThemeDetails(theme)}
          >
            <div class="relative">
              <!-- Theme Preview Image (placeholder) -->
              <div
                class="h-40 bg-neutral-900 flex items-center justify-center"
                style="background: linear-gradient(to right, {theme.colors
                  .primary}, {theme.colors.secondary})"
              >
                <div class="text-white font-bold text-lg">
                  {theme.name}
                </div>
              </div>

              <!-- Badges -->
              <div class="absolute top-2 right-2 flex flex-col gap-2">
                {#if theme.isNew}
                  <Badge color="primary">New</Badge>
                {/if}
                {#if theme.isPopular}
                  <Badge color="warning">Popular</Badge>
                {/if}
                {#if theme.isBestseller}
                  <Badge color="success">Bestseller</Badge>
                {/if}
              </div>
            </div>

            <div class="p-4">
              <div class="flex justify-between mb-2">
                <h3 class="font-medium">{theme.name}</h3>
                <span class="font-medium text-neutral-900 dark:text-white">
                  {formatPrice(theme.price)}
                </span>
              </div>

              <p
                class="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2"
              >
                {theme.description}
              </p>

              <div class="flex justify-between items-center">
                <div class="text-xs text-neutral-500 dark:text-neutral-400">
                  By {theme.designer}
                </div>

                <div class="flex items-center">
                  <span class="text-amber-500">★</span>
                  <span class="text-xs ml-1"
                    >{theme.rating} ({theme.reviewCount})</span
                  >
                </div>
              </div>
            </div>
          </Card>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Theme Details Modal -->
<Dialog
  open={showThemeDetails}
  title={selectedTheme?.name || "Theme Details"}
  size="lg"
  onClose={() => (showThemeDetails = false)}
>
  {#if selectedTheme}
    <div class="py-4">
      <div class="relative mb-6">
        <!-- Theme Preview Image -->
        <div
          class="h-64 bg-neutral-100 flex items-center justify-center"
          style="background: linear-gradient(to right, {selectedTheme.colors
            .primary}, {selectedTheme.colors.secondary})"
        >
          <div class="bg-white dark:bg-neutral-800 p-8 rounded-lg shadow-lg">
            <div
              class="text-2xl font-bold mb-2"
              style="color: {selectedTheme.colors.primary}"
            >
              {selectedTheme.name}
            </div>
            <div class="text-neutral-600 dark:text-neutral-400">
              Premium {selectedTheme.mode} theme
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2">
          <h3 class="text-lg font-medium mb-3">Description</h3>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">
            {selectedTheme.description}
          </p>

          <h3 class="text-lg font-medium mb-3">Features</h3>
          <ul
            class="list-disc list-inside space-y-1 text-neutral-600 dark:text-neutral-400 mb-4"
          >
            <li>Custom color palette with perfect harmony</li>
            <li>Optimized typography for maximum readability</li>
            <li>Carefully crafted spacing system</li>
            <li>Beautiful UI components</li>
            <li>Multiple layout options</li>
            <li>Portfolio-specific design patterns</li>
          </ul>

          <h3 class="text-lg font-medium mb-3">Included Assets</h3>
          <div class="flex gap-3 mb-4">
            <Badge color="neutral">Color schemes</Badge>
            <Badge color="neutral">Typography settings</Badge>
            <Badge color="neutral">Component styles</Badge>
            <Badge color="neutral">Layout templates</Badge>
          </div>
        </div>

        <div
          class="border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-700 md:pl-6 pt-4 md:pt-0"
        >
          <div class="sticky top-6">
            <h3 class="text-lg font-medium mb-3">Purchase</h3>

            <div class="text-3xl font-bold mb-4">
              {formatPrice(selectedTheme.price)}
            </div>

            <Button
              variant="primary"
              fullWidth
              on:click={() => handlePurchaseTheme(selectedTheme)}
            >
              Buy Now
            </Button>

            <div class="mt-6">
              <div class="flex items-center mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-2 text-neutral-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-sm">Lifetime access</span>
              </div>

              <div class="flex items-center mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-2 text-neutral-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-sm">Updates included</span>
              </div>

              <div class="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-2 text-neutral-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-sm">Use on unlimited portfolios</span>
              </div>
            </div>

            <div class="mt-6 flex items-center justify-center">
              <div
                class="flex items-center text-neutral-500 dark:text-neutral-400 text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-1 text-amber-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                <span
                  >{selectedTheme.rating} ({selectedTheme.reviewCount} reviews)</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {#if error}
      <div class="mt-4">
        <AlertBox type="error" dismissible bind:visible={error}>
          {error}
        </AlertBox>
      </div>
    {/if}
  {/if}

  <div slot="footer" class="flex justify-between">
    <Button variant="neutral" on:click={() => (showThemeDetails = false)}
      >Close</Button
    >
    <Button
      variant="primary"
      on:click={() => handlePurchaseTheme(selectedTheme)}
    >
      Purchase for {selectedTheme ? formatPrice(selectedTheme.price) : ""}
    </Button>
  </div>
</Dialog>
