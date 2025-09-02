<script lang="ts">
  import { goto } from "$app/navigation";
  import type { Product } from "$lib/types/marketplace";
  import Card from "$lib/components/common/Card.svelte";
  import Badge from "$lib/components/common/Badge.svelte";
  import StarRating from "$lib/components/common/StarRating.svelte";

  export let product: Product;

  // Format price
  function formatPrice(price: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  }

  // Navigate to product detail page
  function goToProductDetail() {
    goto(`/marketplace/products/${product.slug}`);
  }
</script>

<Card
  class="h-full product-card hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-black/20 transition-shadow duration-200 cursor-pointer"
  on:click={goToProductDetail}
>
  <div class="relative">
    <!-- Product Image -->
    {#if product.previewImages && product.previewImages.length > 0}
      <img
        src={product.previewImages[0].thumbnailUrl}
        alt={product.name}
        class="w-full h-48 object-cover rounded-t-lg"
      />
    {:else}
      <div
        class="w-full h-48 bg-neutral-200 dark:bg-neutral-800 rounded-t-lg flex items-center justify-center"
      >
        <span class="text-neutral-500 dark:text-neutral-400">No image</span>
      </div>
    {/if}

    <!-- Badges -->
    <div class="absolute top-3 left-3 flex flex-col gap-2">
      {#if product.isNew}
        <Badge color="primary">New</Badge>
      {/if}

      {#if product.isBestseller}
        <Badge color="success">Bestseller</Badge>
      {/if}

      {#if product.isFeatured}
        <Badge color="accent">Featured</Badge>
      {/if}
    </div>

    <!-- Price Badge -->
    <div class="absolute bottom-3 right-3">
      <div
        class="bg-white dark:bg-neutral-800 rounded-full px-3 py-1 text-sm font-medium shadow-md"
      >
        {#if product.price.discountAmount}
          <span class="line-through text-xs text-neutral-500 mr-1">
            {formatPrice(
              product.price.originalAmount ||
                product.price.amount + product.price.discountAmount,
            )}
          </span>
          <span class="text-primary-600 dark:text-primary-400">
            {formatPrice(product.price.amount)}
          </span>
        {:else}
          <span class="text-neutral-900 dark:text-white">
            {formatPrice(product.price.amount)}
          </span>
        {/if}
      </div>
    </div>
  </div>

  <div class="p-4">
    <!-- Product Name and Category -->
    <div class="mb-2">
      <h3 class="font-medium text-lg line-clamp-1">{product.name}</h3>
      {#if product.category}
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          {product.category.name}
        </p>
      {/if}
    </div>

    <!-- Product Description -->
    <p class="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
      {product.shortDescription || product.description}
    </p>

    <div class="flex items-center justify-between mt-auto">
      <!-- Rating -->
      <div class="flex items-center">
        <StarRating rating={product.rating} size="sm" />
        <span class="text-xs text-neutral-500 dark:text-neutral-400 ml-1">
          ({product.reviewCount})
        </span>
      </div>

      <!-- Creator Name -->
      {#if product.creator}
        <div class="text-xs text-neutral-500 dark:text-neutral-400">
          by <span class="font-medium text-neutral-700 dark:text-neutral-300"
            >{product.creator.name}</span
          >
        </div>
      {/if}
    </div>
  </div>
</Card>

<style>
  /* Hover effect for product card */
  .product-card {
    transform: translateY(0);
    transition:
      transform 0.2s ease-in-out,
      box-shadow 0.2s ease-in-out;
  }

  .product-card:hover {
    transform: translateY(-2px);
  }
</style>
