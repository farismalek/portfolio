<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { subscriptionStore } from "$lib/stores/subscriptionStore";
  import { fetchSubscriptionPlans } from "$lib/services/subscriptionService";
  import type {
    BillingInterval,
    SubscriptionPlan,
  } from "$lib/types/subscription";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Toggle from "$lib/components/common/Toggle.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";
  import CheckIcon from "$lib/components/icons/CheckIcon.svelte";
  import XIcon from "$lib/components/icons/XIcon.svelte";

  let plans: SubscriptionPlan[] = [];
  let loading = true;
  let error: string | null = null;
  let selectedInterval: BillingInterval = "yearly";

  // Get current subscription from store
  $: currentSubscription = $subscriptionStore.subscription;
  $: currentPlanId = currentSubscription?.planId;

  onMount(async () => {
    try {
      plans = await fetchSubscriptionPlans();
      loading = false;
    } catch (err) {
      error = err.message || "Failed to load subscription plans";
      loading = false;
    }
  });

  function handleSelectPlan(plan: SubscriptionPlan) {
    if (currentPlanId === plan.id) {
      // Navigate to subscription management if user already has this plan
      goto("/settings/subscription");
    } else {
      // Navigate to checkout page with the selected plan
      goto(
        `/subscriptions/checkout?plan=${plan.id}&interval=${selectedInterval}`,
      );
    }
  }

  // Calculate price based on selected interval
  function getPrice(plan: SubscriptionPlan): number {
    if (selectedInterval === "yearly") {
      return plan.price.yearly;
    } else if (selectedInterval === "quarterly" && plan.price.quarterly) {
      return plan.price.quarterly;
    }
    return plan.price.monthly;
  }

  // Calculate savings percentage for yearly billing
  function calculateSavings(plan: SubscriptionPlan): number {
    if (!plan.yearlyDiscount) return 0;
    return Math.round(plan.yearlyDiscount * 100);
  }

  // Check if feature is included in plan
  function isFeatureIncluded(
    plan: SubscriptionPlan,
    featureKey: string,
  ): boolean {
    const feature = plan.features.find((f) => f.key === featureKey);
    return feature ? feature.included : false;
  }

  // Get feature limit if applicable
  function getFeatureLimit(
    plan: SubscriptionPlan,
    featureKey: string,
  ): number | null {
    const feature = plan.features.find((f) => f.key === featureKey);
    return feature?.limit ?? null;
  }
</script>

<svelte:head>
  <title>Subscription Plans | Portfolia</title>
  <meta
    name="description"
    content="Choose a subscription plan that fits your professional needs"
  />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <PageHeader
    title="Choose Your Plan"
    description="Select the plan that best fits your professional needs"
  />

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
    <div class="flex justify-center my-8">
      <div
        class="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
      >
        <span
          class="px-4 text-sm {selectedInterval === 'monthly'
            ? 'font-medium'
            : 'text-neutral-600 dark:text-neutral-400'}"
        >
          Monthly Billing
        </span>
        <Toggle
          checked={selectedInterval === "yearly"}
          onChange={() =>
            (selectedInterval =
              selectedInterval === "yearly" ? "monthly" : "yearly")}
        />
        <div class="flex items-center">
          <span
            class="px-4 text-sm {selectedInterval === 'yearly'
              ? 'font-medium'
              : 'text-neutral-600 dark:text-neutral-400'}"
          >
            Yearly Billing
          </span>
          {#if selectedInterval === "yearly"}
            <span
              class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full"
            >
              Save up to 25%
            </span>
          {/if}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each plans as plan}
        <Card
          class={plan.mostPopular
            ? "border-primary-500 dark:border-primary-400 ring-1 ring-primary-500 dark:ring-primary-400"
            : ""}
        >
          <div class="p-6">
            {#if plan.mostPopular}
              <div
                class="absolute top-0 right-6 transform -translate-y-1/2 px-4 py-1 bg-primary-500 text-white text-sm font-semibold rounded-full shadow"
              >
                Most Popular
              </div>
            {/if}

            {#if plan.recommended}
              <div
                class="absolute top-0 right-6 transform -translate-y-1/2 px-4 py-1 bg-accent-500 text-white text-sm font-semibold rounded-full shadow"
              >
                Recommended
              </div>
            {/if}

            <h2 class="text-xl font-bold">{plan.name}</h2>
            <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {plan.description}
            </p>

            <div class="mt-4">
              <div class="flex items-baseline">
                <span class="text-4xl font-bold"
                  >${getPrice(plan).toFixed(0)}</span
                >
                <span class="ml-2 text-neutral-600 dark:text-neutral-400">
                  / {selectedInterval.slice(0, -2)}
                </span>
              </div>

              {#if selectedInterval === "yearly" && plan.yearlyDiscount}
                <p class="mt-1 text-sm text-green-600 dark:text-green-400">
                  Save {calculateSavings(plan)}% with annual billing
                </p>
              {/if}
            </div>

            <div class="mt-6">
              <Button
                variant={currentPlanId === plan.id ? "outline" : "primary"}
                size="lg"
                class="w-full"
                disabled={plan.isEnterprise && !plan.isCustom}
                on:click={() => handleSelectPlan(plan)}
              >
                {#if currentPlanId === plan.id}
                  Current Plan
                {:else if plan.isEnterprise && !plan.isCustom}
                  Contact Sales
                {:else}
                  Choose Plan
                {/if}
              </Button>

              {#if plan.trialDays}
                <p
                  class="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400"
                >
                  {plan.trialDays}-day free trial
                </p>
              {/if}
            </div>

            <div class="mt-8 space-y-4">
              <h3
                class="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
              >
                Features
              </h3>
              <ul class="space-y-4">
                {#each plan.features.filter((f) => f.included) as feature}
                  <li class="flex">
                    <div class="flex-shrink-0">
                      <CheckIcon class="h-5 w-5 text-green-500" />
                    </div>
                    <p
                      class="ml-3 text-sm text-neutral-700 dark:text-neutral-300"
                    >
                      {feature.name}
                      {#if feature.limit}
                        <span class="text-neutral-500 dark:text-neutral-400">
                          ({feature.limit})
                        </span>
                      {/if}
                    </p>
                  </li>
                {/each}

                {#each plan.features.filter((f) => !f.included) as feature}
                  <li class="flex">
                    <div class="flex-shrink-0">
                      <XIcon class="h-5 w-5 text-neutral-400" />
                    </div>
                    <p
                      class="ml-3 text-sm text-neutral-500 dark:text-neutral-400"
                    >
                      {feature.name}
                    </p>
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        </Card>
      {/each}

      <!-- Enterprise Plan -->
      <Card
        class="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900"
      >
        <div class="p-6">
          <h2 class="text-xl font-bold">Enterprise</h2>
          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Tailored solutions for organizations with advanced needs
          </p>

          <div class="mt-4">
            <div class="flex items-baseline">
              <span class="text-2xl font-bold">Custom Pricing</span>
            </div>
          </div>

          <div class="mt-6">
            <Button
              variant="outline"
              size="lg"
              class="w-full"
              on:click={() => goto("/contact?subject=Enterprise")}
            >
              Contact Sales
            </Button>
          </div>

          <div class="mt-8 space-y-4">
            <h3
              class="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
            >
              Features
            </h3>
            <ul class="space-y-4">
              <li class="flex">
                <div class="flex-shrink-0">
                  <CheckIcon class="h-5 w-5 text-green-500" />
                </div>
                <p class="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
                  Everything in Pro plan
                </p>
              </li>
              <li class="flex">
                <div class="flex-shrink-0">
                  <CheckIcon class="h-5 w-5 text-green-500" />
                </div>
                <p class="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
                  Dedicated account manager
                </p>
              </li>
              <li class="flex">
                <div class="flex-shrink-0">
                  <CheckIcon class="h-5 w-5 text-green-500" />
                </div>
                <p class="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
                  Custom branding and white labeling
                </p>
              </li>
              <li class="flex">
                <div class="flex-shrink-0">
                  <CheckIcon class="h-5 w-5 text-green-500" />
                </div>
                <p class="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
                  Advanced security features
                </p>
              </li>
              <li class="flex">
                <div class="flex-shrink-0">
                  <CheckIcon class="h-5 w-5 text-green-500" />
                </div>
                <p class="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
                  Priority support with SLA
                </p>
              </li>
              <li class="flex">
                <div class="flex-shrink-0">
                  <CheckIcon class="h-5 w-5 text-green-500" />
                </div>
                <p class="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
                  Custom integrations
                </p>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>

    <div class="mt-16">
      <h2 class="text-2xl font-bold text-center mb-8">
        Frequently Asked Questions
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 class="text-lg font-medium mb-2">Can I switch plans later?</h3>
          <p class="text-neutral-600 dark:text-neutral-400">
            Yes, you can upgrade or downgrade your plan at any time. When
            upgrading, you'll be charged the prorated difference. When
            downgrading, the new rate will apply at the start of your next
            billing cycle.
          </p>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2">
            What payment methods do you accept?
          </h3>
          <p class="text-neutral-600 dark:text-neutral-400">
            We accept all major credit cards (Visa, Mastercard, American
            Express), PayPal, and bank transfers for annual enterprise plans.
          </p>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2">
            What's included in the free trial?
          </h3>
          <p class="text-neutral-600 dark:text-neutral-400">
            The free trial gives you complete access to all features in the
            selected plan. No credit card is required until the trial period
            ends.
          </p>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2">
            Can I cancel my subscription?
          </h3>
          <p class="text-neutral-600 dark:text-neutral-400">
            Yes, you can cancel your subscription at any time. After
            cancellation, you'll continue to have access to your plan features
            until the end of your current billing period.
          </p>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2">
            Is there a discount for teams?
          </h3>
          <p class="text-neutral-600 dark:text-neutral-400">
            Yes, we offer volume discounts for teams of 5 or more. Contact our
            sales team for custom pricing options tailored to your team's needs.
          </p>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-2">
            What happens to my data if I cancel?
          </h3>
          <p class="text-neutral-600 dark:text-neutral-400">
            Your data remains accessible in read-only mode for 30 days after
            cancellation. After this period, we retain your data for another 60
            days before permanent deletion. You can export your data at any
            time.
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>
