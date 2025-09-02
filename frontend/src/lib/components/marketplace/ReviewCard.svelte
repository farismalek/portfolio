<script lang="ts">
  import type { ProductReview } from "$lib/types/marketplace";
  import StarRating from "$lib/components/common/StarRating.svelte";

  export let review: ProductReview;

  // Format date
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }
</script>

<div
  class="pb-6 border-b border-neutral-200 dark:border-neutral-700 last:border-0 last:pb-0"
>
  <div class="flex items-start">
    <!-- User Avatar -->
    <div class="flex-shrink-0 mr-4">
      <div
        class="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center overflow-hidden"
      >
        {#if review.userAvatarUrl}
          <img
            src={review.userAvatarUrl}
            alt={review.userName}
            class="w-full h-full object-cover"
          />
        {:else}
          <span class="text-lg font-medium">{review.userName.charAt(0)}</span>
        {/if}
      </div>
    </div>

    <div class="flex-grow">
      <!-- User and Rating -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 class="font-medium">{review.userName}</h4>
          <div class="flex items-center mt-1">
            <StarRating rating={review.rating} size="sm" />
            <span class="text-neutral-600 dark:text-neutral-400 text-sm ml-2">
              {formatDate(review.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <!-- Review Content -->
      <div class="mt-3">
        <p class="text-neutral-700 dark:text-neutral-300">
          {review.comment}
        </p>
      </div>
    </div>
  </div>
</div>
