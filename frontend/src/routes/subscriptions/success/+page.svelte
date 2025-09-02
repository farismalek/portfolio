<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { subscriptionStore } from "$lib/stores/subscriptionStore";
  import Card from "$lib/components/common/Card.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import ConfettiExplosion from "$lib/components/effects/ConfettiExplosion.svelte";
  import type { SubscriptionPlan } from "$lib/types/subscription";

  let showConfetti = false;
  let plan: SubscriptionPlan | null = null;

  onMount(() => {
    // Show confetti effect
    setTimeout(() => {
      showConfetti = true;
    }, 200);

    // Get current plan
    const currentPlan = $subscriptionStore.subscription?.planId;
    if (currentPlan) {
      plan = $subscriptionStore.plans.find((p) => p.id === currentPlan) || null;
    }
  });
</script>

<svelte:head>
  <title>Subscription Activated | Portfolia</title>
  <meta
    name="description"
    content="Your subscription has been successfully activated"
  />
</svelte:head>

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  {#if showConfetti}
    <ConfettiExplosion />
  {/if}

  <Card>
    <div class="p-8 text-center">
      <div
        class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 mb-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-10 w-10 text-green-600 dark:text-green-300"
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

      <h2 class="text-3xl font-bold mb-2">Subscription Activated!</h2>
      <p class="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
        Thank you for subscribing to Portfolia{plan ? ` ${plan.name}` : ""}.
      </p>

      <div
        class="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6 mb-8 max-w-lg mx-auto"
      >
        {#if plan}
          <h3 class="text-xl font-bold mb-2">{plan.name} Plan</h3>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">
            {plan.description}
          </p>

          <div
            class="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6"
          >
            <div>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Your subscription
              </p>
              <p class="font-bold">
                {$subscriptionStore.subscription?.status === "trialing"
                  ? "Free Trial"
                  : "Active"}
              </p>
            </div>

            <div>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Next billing date
              </p>
              <p class="font-bold">
                {$subscriptionStore.subscription?.currentPeriodEnd
                  ? new Date(
                      $subscriptionStore.subscription.currentPeriodEnd,
                    ).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <div
            class="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700"
          >
            <h4 class="font-medium mb-2">Unlocked Features</h4>
            <ul class="space-y-2">
              {#each plan.features.filter((f) => f.included && f.highlighted) as feature}
                <li class="flex items-center">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>{feature.name}</span>
                </li>
              {/each}
            </ul>
          </div>
        {:else}
          <p class="text-neutral-600 dark:text-neutral-400">
            You now have access to premium features. Enjoy enhanced capabilities
            and tools to grow your professional presence.
          </p>
        {/if}
      </div>

      <div
        class="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4"
      >
        <Button href="/settings/subscription" variant="outline">
          Manage Subscription
        </Button>
        <Button href="/dashboard" variant="primary">Go to Dashboard</Button>
      </div>
    </div>
  </Card>

  <div class="mt-8 text-center">
    <h3 class="text-lg font-medium mb-2">Need Help?</h3>
    <p class="text-neutral-600 dark:text-neutral-400 mb-4">
      If you have any questions about your subscription, please visit our <a
        href="/help"
        class="text-primary-600 dark:text-primary-400 hover:underline"
        >Help Center</a
      >
      or contact our
      <a
        href="/support"
        class="text-primary-600 dark:text-primary-400 hover:underline"
        >Support Team</a
      >.
    </p>
  </div>
</div>
