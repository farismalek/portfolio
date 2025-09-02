<script lang="ts">
  import { onMount } from "svelte";
  import { subscriptionStore } from "$lib/stores/subscriptionStore";
  import Card from "$lib/components/common/Card.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";

  export let featureKey: string;
  export let title = "Premium Feature";
  export let description =
    "This feature is only available with a premium subscription.";
  export let plan = "Pro";
  export let redirectUrl = "/subscriptions";
  export let loading = true;

  let hasAccess = false;

  onMount(async () => {
    // Check if user has access to the feature
    hasAccess = await subscriptionStore.checkFeatureAccess(featureKey);
    loading = false;
  });
</script>

{#if loading}
  <div class="flex justify-center py-8">
    <LoadingSpinner size="md" />
  </div>
{:else if hasAccess}
  <!-- User has access, render the slotted content -->
  <slot />
{:else}
  <!-- User doesn't have access, show upgrade prompt -->
  <Card class="py-8 px-4 sm:px-6 text-center">
    <div class="flex flex-col items-center">
      <div
        class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900 mb-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 text-primary-600 dark:text-primary-400"
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
      </div>

      <h3 class="text-xl font-medium mb-2">{title}</h3>
      <p class="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-6">
        {description}
      </p>

      <div
        class="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 mb-6 inline-block"
      >
        <p class="text-sm">
          <span class="font-medium">Upgrade to {plan}</span> to unlock this feature
          and many more.
        </p>
      </div>

      <Button href={redirectUrl} variant="primary">
        View Subscription Plans
      </Button>
    </div>
  </Card>
{/if}
