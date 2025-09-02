<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { authStore } from "$lib/stores/authStore";
  import {
    fetchProduct,
    fetchProductReviews,
    purchaseProduct,
  } from "$lib/services/marketplaceService";
  import type { Product, ProductReview } from "$lib/types/marketplace";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Badge from "$lib/components/common/Badge.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";
  import Dialog from "$lib/components/common/Dialog.svelte";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import StarRating from "$lib/components/common/StarRating.svelte";
  import TextField from "$lib/components/common/TextField.svelte";
  import ImageGallery from "$lib/components/marketplace/ImageGallery.svelte";
  import ProductCard from "$lib/components/marketplace/ProductCard.svelte";
  import ReviewCard from "$lib/components/marketplace/ReviewCard.svelte";
  import ReviewForm from "$lib/components/marketplace/ReviewForm.svelte";
  import PaymentMethodForm from "$lib/components/payments/PaymentMethodForm.svelte";
  import { featureAccess, featureUpsell } from "$lib/directives/featureAccess";
  import { fetchPaymentMethods } from "$lib/services/subscriptionService";
  import type { PaymentMethod } from "$lib/types/subscription";

  // Get product slug from URL
  $: slug = $page.params.slug;

  let loading = true;
  let error: string | null = null;
  let product: Product | null = null;
  let reviews: ProductReview[] = [];
  let totalReviews = 0;
  let reviewsLoading = false;
  let reviewsPage = 1;
  let reviewsPerPage = 5;
  let activeTab = "description";
  let relatedProducts: Product[] = [];
  let showPurchaseDialog = false;
  let showLoginDialog = false;
  let purchaseLoading = false;
  let purchaseError: string | null = null;
  let purchaseSuccess = false;
  let paymentMethods: PaymentMethod[] = [];
  let selectedPaymentMethod: string | null = null;
  let addingNewPaymentMethod = false;

  onMount(async () => {
    try {
      // Load product data
      product = await fetchProduct(slug);

      // Load initial reviews
      await loadReviews();

      // Simulate loading related products
      // In a real implementation, this would be a separate API call
      relatedProducts = [product]; // Placeholder

      loading = false;

      // If user is authenticated, load their payment methods
      if ($authStore.isAuthenticated) {
        loadPaymentMethods();
      }
    } catch (err) {
      error = err.message || "Failed to load product";
      loading = false;
    }
  });

  async function loadReviews() {
    reviewsLoading = true;

    try {
      const result = await fetchProductReviews(
        slug,
        reviewsPage,
        reviewsPerPage,
      );
      reviews = result.reviews;
      totalReviews = result.total;
    } catch (err) {
      console.error("Failed to load reviews:", err);
      // Don't set main error, just log it
    } finally {
      reviewsLoading = false;
    }
  }

  async function loadPaymentMethods() {
    try {
      paymentMethods = await fetchPaymentMethods();

      // Select the default payment method if available
      const defaultMethod = paymentMethods.find((pm) => pm.isDefault);
      if (defaultMethod) {
        selectedPaymentMethod = defaultMethod.id;
      } else if (paymentMethods.length > 0) {
        selectedPaymentMethod = paymentMethods[0].id;
      } else {
        // No payment methods yet, show form to add one
        addingNewPaymentMethod = true;
      }
    } catch (err) {
      console.error("Failed to load payment methods:", err);
    }
  }

  // Format price
  function formatPrice(price: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  }

  // Format card number with asterisks
  function formatCardNumber(lastFour: string): string {
    return `•••• •••• •••• ${lastFour}`;
  }

  // Format expiry date
  function formatExpiry(month: number, year: number): string {
    return `${month.toString().padStart(2, "0")}/${year.toString().slice(-2)}`;
  }

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    else return (bytes / 1073741824).toFixed(1) + " GB";
  }

  // Handle clicking purchase button
  function handlePurchaseClick() {
    if (!$authStore.isAuthenticated) {
      showLoginDialog = true;
    } else {
      showPurchaseDialog = true;
    }
  }

  // Handle new payment method creation
  function handleNewPaymentMethod(event: CustomEvent) {
    const { paymentMethodId } = event.detail;
    selectedPaymentMethod = paymentMethodId;
    addingNewPaymentMethod = false;

    // Refresh payment methods list
    loadPaymentMethods();
  }

  // Complete purchase
  async function completePurchase() {
    if (!selectedPaymentMethod) {
      purchaseError = "Please select or add a payment method";
      return;
    }

    purchaseLoading = true;
    purchaseError = null;

    try {
      await purchaseProduct(product!.id, selectedPaymentMethod);
      purchaseSuccess = true;

      // Redirect to purchased products page after a short delay
      setTimeout(() => {
        goto("/marketplace/purchases");
      }, 2000);
    } catch (err) {
      purchaseError = err.message || "Failed to complete purchase";
      purchaseLoading = false;
    }
  }

  // Show more reviews
  function loadMoreReviews() {
    reviewsPage += 1;
    loadReviews();
  }

  // Handle new review submission
  function handleReviewSubmitted() {
    // Reset to first page and reload reviews
    reviewsPage = 1;
    loadReviews();
  }
</script>

<svelte:head>
  <title
    >{product ? product.name : "Loading Product..."} | Portfolia Marketplace</title
  >
  {#if product}
    <meta
      name="description"
      content={product.shortDescription ||
        product.description.substring(0, 160)}
    />
  {/if}
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
  {:else if product}
    <!-- Product Header -->
    <div class="mb-6">
      <Button href="/marketplace" variant="ghost" size="sm" class="mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Marketplace
      </Button>

      <div class="flex flex-wrap items-start justify-between">
        <div>
          <h1 class="text-3xl font-bold">{product.name}</h1>
          <div class="flex items-center mt-2">
            {#if product.category}
              <span class="text-neutral-600 dark:text-neutral-400 mr-3">
                Category: <a
                  href={`/marketplace/categories/${product.category.slug}`}
                  class="text-primary-600 dark:text-primary-400 hover:underline"
                  >{product.category.name}</a
                >
              </span>
            {/if}

            <div class="flex items-center">
              <StarRating rating={product.rating} size="sm" />
              <span class="text-neutral-600 dark:text-neutral-400 ml-1">
                ({product.reviewCount}
                {product.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center mt-2 sm:mt-0">
          <Badge color="primary" class="mr-2"
            >{product.purchaseCount} sales</Badge
          >
          {#if product.isNew}
            <Badge color="success" class="mr-2">New</Badge>
          {/if}
          {#if product.isBestseller}
            <Badge color="accent">Bestseller</Badge>
          {/if}
        </div>
      </div>
    </div>

    <!-- Product Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Side: Gallery -->
      <div class="lg:col-span-2">
        <Card class="p-2">
          <ImageGallery images={product.previewImages} />
        </Card>
      </div>

      <!-- Right Side: Purchase Info -->
      <div class="lg:col-span-1">
        <Card class="p-6">
          <!-- Pricing -->
          <div class="mb-6">
            <div class="flex items-baseline">
              {#if product.price.discountAmount}
                <span class="line-through text-lg text-neutral-500 mr-2">
                  {formatPrice(
                    product.price.originalAmount ||
                      product.price.amount + product.price.discountAmount,
                  )}
                </span>
                <span
                  class="text-3xl font-bold text-primary-600 dark:text-primary-400"
                >
                  {formatPrice(product.price.amount)}
                </span>

                <Badge color="success" class="ml-3">
                  {product.price.discountPercentage}% OFF
                </Badge>
              {:else}
                <span class="text-3xl font-bold">
                  {formatPrice(product.price.amount)}
                </span>
              {/if}
            </div>

            {#if product.price.saleEndDate}
              <p class="text-sm text-danger-600 dark:text-danger-400 mt-1">
                Sale ends on {new Date(
                  product.price.saleEndDate,
                ).toLocaleDateString()}
              </p>
            {/if}
          </div>

          <!-- Creator -->
          {#if product.creator}
            <div class="flex items-center mb-6">
              <div
                class="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center overflow-hidden mr-3"
              >
                {#if product.creator.avatarUrl}
                  <img
                    src={product.creator.avatarUrl}
                    alt={product.creator.name}
                    class="w-full h-full object-cover"
                  />
                {:else}
                  <span class="text-lg font-medium"
                    >{product.creator.name.charAt(0)}</span
                  >
                {/if}
              </div>
              <div>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  Created by
                </p>
                <a
                  href={`/marketplace/creators/${product.creator.id}`}
                  class="font-medium hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {product.creator.name}
                </a>
              </div>
            </div>
          {/if}

          <!-- File Info -->
          {#if product.isDigital}
            <div class="mb-6 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <h3 class="text-sm font-medium mb-2">Product Information</h3>
              <div class="grid grid-cols-2 gap-2 text-sm">
                {#if product.fileType}
                  <div class="text-neutral-600 dark:text-neutral-400">
                    Format:
                  </div>
                  <div>{product.fileType}</div>
                {/if}
                {#if product.fileSize}
                  <div class="text-neutral-600 dark:text-neutral-400">
                    Size:
                  </div>
                  <div>{formatFileSize(product.fileSize)}</div>
                {/if}
                <div class="text-neutral-600 dark:text-neutral-400">
                  Downloads:
                </div>
                <div>{product.downloadCount || 0}</div>
                <div class="text-neutral-600 dark:text-neutral-400">
                  Last Updated:
                </div>
                <div>{new Date(product.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          {/if}

          <!-- Action Buttons -->
          <div class="space-y-3">
            <Button
              variant="primary"
              size="lg"
              class="w-full"
              on:click={handlePurchaseClick}
            >
              Purchase Now
            </Button>

            <div class="flex space-x-3">
              <Button variant="outline" class="flex-1" size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Save
              </Button>
              <Button variant="outline" class="flex-1" size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share
              </Button>
            </div>
          </div>

          <!-- Secure Payment Notice -->
          <div
            class="mt-6 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg"
          >
            <div
              class="flex items-center text-sm text-neutral-700 dark:text-neutral-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-green-500 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Secure payment
            </div>
            <div
              class="flex items-center text-sm text-neutral-700 dark:text-neutral-300 mt-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-green-500 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              30-day money-back guarantee
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- Product Details Tabs -->
    <div class="mt-12">
      <Tabs
        tabs={[
          { id: "description", label: "Description" },
          { id: "features", label: "Features" },
          { id: "reviews", label: `Reviews (${product.reviewCount})` },
        ]}
        bind:activeTab
      />

      <div class="mt-6">
        <!-- Description Tab -->
        {#if activeTab === "description"}
          <Card class="p-6">
            <div class="prose dark:prose-invert max-w-none">
              {@html product.description}
            </div>
          </Card>
          <!-- Features Tab -->
        {:else if activeTab === "features"}
          <Card class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-medium mb-4">Included Features</h3>
                <ul class="space-y-3">
                  {#each product.features as feature}
                    <li class="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  {/each}
                </ul>
              </div>

              {#if product.specifications && Object.keys(product.specifications).length > 0}
                <div>
                  <h3 class="text-lg font-medium mb-4">Specifications</h3>
                  <dl class="space-y-3">
                    {#each Object.entries(product.specifications) as [key, value]}
                      <div>
                        <dt
                          class="text-sm font-medium text-neutral-500 dark:text-neutral-400"
                        >
                          {key}
                        </dt>
                        <dd class="mt-1">
                          {value}
                        </dd>
                      </div>
                    {/each}
                  </dl>
                </div>
              {/if}
            </div>

            {#if product.tags && product.tags.length > 0}
              <div
                class="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700"
              >
                <h3 class="text-lg font-medium mb-4">Tags</h3>
                <div class="flex flex-wrap gap-2">
                  {#each product.tags as tag}
                    <a
                      href={`/marketplace/search?tag=${encodeURIComponent(tag.slug)}`}
                      class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    >
                      {tag.name}
                    </a>
                  {/each}
                </div>
              </div>
            {/if}
          </Card>
          <!-- Reviews Tab -->
        {:else if activeTab === "reviews"}
          <div class="space-y-6">
            <Card class="p-6">
              <div
                class="flex flex-col md:flex-row items-start md:items-center justify-between"
              >
                <div class="mb-4 md:mb-0">
                  <h3 class="text-lg font-medium">Customer Reviews</h3>
                  <div class="flex items-center mt-1">
                    <StarRating rating={product.rating} size="md" />
                    <span class="text-lg font-medium ml-2"
                      >{product.rating.toFixed(1)}</span
                    >
                    <span
                      class="text-neutral-600 dark:text-neutral-400 text-sm ml-2"
                    >
                      ({product.reviewCount}
                      {product.reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  on:click={() => {
                    if (!$authStore.isAuthenticated) {
                      showLoginDialog = true;
                    } else {
                      goto(`/marketplace/products/${slug}/write-review`);
                    }
                  }}
                >
                  Write a Review
                </Button>
              </div>

              <!-- Reviews List -->
              <div class="mt-8 space-y-6">
                {#if reviewsLoading && reviewsPage === 1}
                  <div class="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                {:else if reviews.length === 0}
                  <div
                    class="text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="mx-auto h-12 w-12 text-neutral-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    <h3 class="mt-2 text-lg font-medium">No reviews yet</h3>
                    <p class="mt-1 text-neutral-500 dark:text-neutral-400">
                      Be the first to share your thoughts about this product.
                    </p>
                  </div>
                {:else}
                  {#each reviews as review}
                    <ReviewCard {review} />
                  {/each}

                  {#if reviewsLoading && reviewsPage > 1}
                    <div class="flex justify-center py-4">
                      <LoadingSpinner />
                    </div>
                  {/if}

                  {#if reviews.length < totalReviews}
                    <div class="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        on:click={loadMoreReviews}
                        disabled={reviewsLoading}
                      >
                        Load More Reviews
                      </Button>
                    </div>
                  {/if}
                {/if}
              </div>
            </Card>
          </div>
        {/if}
      </div>
    </div>

    <!-- Related Products -->
    {#if relatedProducts.length > 0}
      <div class="mt-16">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Related Products</h2>
          <Button variant="ghost" href="/marketplace/related">View All</Button>
        </div>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {#each relatedProducts as relatedProduct}
            <ProductCard product={relatedProduct} />
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Purchase Dialog -->
<Dialog
  open={showPurchaseDialog}
  title="Complete Your Purchase"
  size="md"
  onClose={() => (showPurchaseDialog = false)}
>
  {#if purchaseSuccess}
    <div class="py-8 text-center">
      <div
        class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 text-green-600 dark:text-green-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3 class="mt-4 text-xl font-medium">Purchase Complete!</h3>
      <p class="mt-2 text-neutral-600 dark:text-neutral-400">
        Thank you for your purchase. You can now access this product in your
        purchases.
      </p>
      <div class="mt-6">
        <LoadingSpinner size="sm" />
        <p class="mt-2 text-sm text-neutral-500">
          Redirecting to your purchases...
        </p>
      </div>
    </div>
  {:else}
    <div class="p-6">
      {#if purchaseError}
        <AlertBox type="error" class="mb-6">
          {purchaseError}
        </AlertBox>
      {/if}

      <div class="mb-6">
        <h3 class="text-lg font-medium mb-2">Order Summary</h3>
        <div class="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              {#if product?.previewImages && product.previewImages.length > 0}
                <img
                  src={product.previewImages[0].thumbnailUrl}
                  alt={product?.name}
                  class="w-16 h-16 object-cover rounded-md mr-4"
                />
              {/if}
              <div>
                <h4 class="font-medium">{product?.name}</h4>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  {product?.creator?.name ? `By ${product.creator.name}` : ""}
                </p>
              </div>
            </div>
            <div class="text-lg font-bold">
              {product?.price ? formatPrice(product.price.amount) : "$0.00"}
            </div>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="text-lg font-medium mb-4">Payment Method</h3>

        {#if paymentMethods.length > 0 && !addingNewPaymentMethod}
          <div class="space-y-3">
            {#each paymentMethods as method}
              <label
                class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 {selectedPaymentMethod ===
                method.id
                  ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-neutral-200 dark:border-neutral-700'}"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  bind:group={selectedPaymentMethod}
                  class="mr-3"
                />
                <div>
                  <div class="flex items-center">
                    {#if method.type === "credit_card"}
                      <span class="font-medium">
                        {method.brand}
                        {formatCardNumber(method.lastFour || "****")}
                      </span>
                    {:else if method.type === "paypal"}
                      <span class="font-medium">PayPal</span>
                    {/if}
                  </div>
                  {#if method.expiryMonth && method.expiryYear}
                    <div class="text-xs text-neutral-500 dark:text-neutral-400">
                      Expires {formatExpiry(
                        method.expiryMonth,
                        method.expiryYear,
                      )}
                    </div>
                  {/if}
                </div>
              </label>
            {/each}

            <Button
              variant="ghost"
              size="sm"
              class="mt-2"
              on:click={() => (addingNewPaymentMethod = true)}
            >
              + Add new payment method
            </Button>
          </div>
        {:else}
          <PaymentMethodForm
            on:success={handleNewPaymentMethod}
            on:cancel={() => {
              if (paymentMethods.length > 0) {
                addingNewPaymentMethod = false;
              }
            }}
          />
        {/if}
      </div>

      <div
        class="flex justify-end space-x-3 pt-4 border-t border-neutral-200 dark:border-neutral-700"
      >
        <Button variant="outline" on:click={() => (showPurchaseDialog = false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={!selectedPaymentMethod || purchaseLoading}
          on:click={completePurchase}
        >
          {#if purchaseLoading}
            <LoadingSpinner size="sm" class="mr-2" />
            Processing...
          {:else}
            Complete Purchase
          {/if}
        </Button>
      </div>
    </div>
  {/if}
</Dialog>

<!-- Login Dialog -->
<Dialog
  open={showLoginDialog}
  title="Sign In Required"
  size="sm"
  onClose={() => (showLoginDialog = false)}
>
  <div class="p-6">
    <p class="mb-6">
      Please sign in or create an account to purchase this product.
    </p>

    <div class="flex space-x-4">
      <Button
        variant="outline"
        class="flex-1"
        on:click={() => {
          showLoginDialog = false;
          goto(
            `/auth/signup?redirect=${encodeURIComponent(window.location.pathname)}`,
          );
        }}
      >
        Create Account
      </Button>

      <Button
        variant="primary"
        class="flex-1"
        on:click={() => {
          showLoginDialog = false;
          goto(
            `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`,
          );
        }}
      >
        Sign In
      </Button>
    </div>
  </div>
</Dialog>
