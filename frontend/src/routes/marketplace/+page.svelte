<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import {
    fetchFeaturedProducts,
    fetchProductCategories,
  } from "$lib/services/marketplaceService";
  import type { Product, ProductCategory } from "$lib/types/marketplace";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import TextField from "$lib/components/common/TextField.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";
  import ProductCard from "$lib/components/marketplace/ProductCard.svelte";
  import CategoryCard from "$lib/components/marketplace/CategoryCard.svelte";

  let loading = true;
  let error: string | null = null;
  let featuredProducts: Product[] = [];
  let categories: ProductCategory[] = [];
  let searchQuery = "";

  // Handle search query parameter
  $: if ($page.url.searchParams.has("q")) {
    searchQuery = $page.url.searchParams.get("q") || "";
  }

  onMount(async () => {
    try {
      // Fetch featured products and categories in parallel
      const [productsResult, categoriesResult] = await Promise.all([
        fetchFeaturedProducts(),
        fetchProductCategories(),
      ]);

      featuredProducts = productsResult;
      categories = categoriesResult;

      loading = false;
    } catch (err) {
      error = err.message || "Failed to load marketplace data";
      loading = false;
    }
  });

  // Handle search form submission
  function handleSearch() {
    const query = searchQuery.trim();
    if (query) {
      goto(`/marketplace/search?q=${encodeURIComponent(query)}`);
    }
  }
</script>

<svelte:head>
  <title>Digital Marketplace | Portfolia</title>
  <meta
    name="description"
    content="Discover premium digital products to enhance your professional portfolio"
  />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <!-- Hero Section -->
  <div
    class="rounded-xl bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-900 text-white p-8 md:p-12"
  >
    <div class="max-w-3xl">
      <h1 class="text-3xl md:text-4xl font-bold mb-4">Digital Marketplace</h1>
      <p class="text-lg md:text-xl mb-6 text-white text-opacity-90">
        Discover premium templates, tools, and resources to enhance your
        professional portfolio
      </p>

      <!-- Search Box -->
      <div class="flex max-w-lg">
        <TextField
          bind:value={searchQuery}
          placeholder="Search for templates, tools, resources..."
          class="flex-grow"
          light
          on:keydown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button variant="secondary" class="ml-2" on:click={handleSearch}>
          Search
        </Button>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>
  {:else if error}
    <AlertBox type="error" class="my-8">
      {error}
      <Button
        variant="outline"
        size="sm"
        class="mt-2"
        on:click={() => window.location.reload()}
      >
        Retry
      </Button>
    </AlertBox>
  {:else}
    <!-- Categories Section -->
    <div class="mt-12">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Browse Categories</h2>
        <Button variant="ghost" href="/marketplace/categories">View All</Button>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {#each categories.slice(0, 8) as category}
          <CategoryCard {category} />
        {/each}
      </div>
    </div>

    <!-- Featured Products Section -->
    <div class="mt-16">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Featured Products</h2>
        <Button variant="ghost" href="/marketplace/featured">View All</Button>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {#each featuredProducts as product}
          <ProductCard {product} />
        {/each}
      </div>
    </div>

    <!-- Bestsellers Section -->
    <div class="mt-16">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Bestsellers</h2>
        <Button variant="ghost" href="/marketplace/bestsellers">
          View All
        </Button>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {#each featuredProducts
          .filter((p) => p.isBestseller)
          .slice(0, 4) as product}
          <ProductCard {product} />
        {/each}
      </div>
    </div>

    <!-- New Arrivals Section -->
    <div class="mt-16">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">New Arrivals</h2>
        <Button variant="ghost" href="/marketplace/new">View All</Button>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {#each featuredProducts.filter((p) => p.isNew).slice(0, 4) as product}
          <ProductCard {product} />
        {/each}
      </div>
    </div>

    <!-- Become a Creator CTA -->
    <div class="mt-20">
      <div
        class="rounded-xl bg-gradient-to-r from-accent-100 to-accent-200 dark:from-accent-900 dark:to-accent-800 p-8 flex flex-col md:flex-row items-center justify-between"
      >
        <div class="mb-6 md:mb-0 md:mr-8">
          <h2 class="text-2xl font-bold mb-2">Become a Creator</h2>
          <p class="text-lg max-w-2xl">
            Share your expertise and earn money by selling your templates,
            tools, and resources on our marketplace.
          </p>
        </div>
        <div class="flex-shrink-0">
          <Button variant="accent" size="lg" href="/creators/onboarding">
            Start Selling
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>
