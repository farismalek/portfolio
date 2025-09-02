<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import {
    fetchSubscriptionPlans,
    createSubscription,
    fetchPaymentMethods,
    validateCoupon,
  } from "$lib/services/subscriptionService";
  import { subscriptionStore } from "$lib/stores/subscriptionStore";
  import type {
    BillingInterval,
    SubscriptionPlan,
    PaymentMethod,
  } from "$lib/types/subscription";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import TextField from "$lib/components/common/TextField.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";
  import RadioGroup from "$lib/components/common/RadioGroup.svelte";
  import Checkbox from "$lib/components/common/Checkbox.svelte";
  import PaymentMethodForm from "$lib/components/payments/PaymentMethodForm.svelte";

  // Get URL parameters
  $: planId = $page.url.searchParams.get("plan");
  $: billingInterval = ($page.url.searchParams.get("interval") ||
    "monthly") as BillingInterval;

  let loading = true;
  let error: string | null = null;
  let plan: SubscriptionPlan | null = null;
  let paymentMethods: PaymentMethod[] = [];
  let selectedPaymentMethod: string | null = null;
  let addingNewPaymentMethod = false;
  let couponCode = "";
  let couponError: string | null = null;
  let couponDiscount: number | null = null;
  let agreeToTerms = false;
  let processingPayment = false;
  let success = false;

  // Price calculation
  $: basePrice =
    plan && billingInterval
      ? billingInterval === "yearly"
        ? plan.price.yearly
        : billingInterval === "quarterly" && plan.price.quarterly
          ? plan.price.quarterly
          : plan.price.monthly
      : 0;

  $: discountedAmount = couponDiscount ? basePrice * (couponDiscount / 100) : 0;
  $: finalPrice = basePrice - discountedAmount;

  onMount(async () => {
    if (!planId) {
      goto("/subscriptions");
      return;
    }

    try {
      // Load all plans, then find the selected one
      const plans = await fetchSubscriptionPlans();
      plan = plans.find((p) => p.id === planId) || null;

      if (!plan) {
        throw new Error("Selected plan not found");
      }

      // Load user payment methods
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

      loading = false;
    } catch (err) {
      error = err.message || "Failed to load checkout information";
      loading = false;
    }
  });

  // Format card number with asterisks
  function formatCardNumber(lastFour: string): string {
    return `•••• •••• •••• ${lastFour}`;
  }

  // Format expiry date
  function formatExpiry(month: number, year: number): string {
    return `${month.toString().padStart(2, "0")}/${year.toString().slice(-2)}`;
  }

  // Apply coupon code
  async function applyCoupon() {
    if (!couponCode.trim()) {
      couponError = "Please enter a coupon code";
      return;
    }

    couponError = null;

    try {
      const result = await validateCoupon(couponCode, planId || undefined);

      if (result.valid && result.discount) {
        couponDiscount = result.discount;
      } else {
        couponError = result.message || "Invalid coupon code";
        couponDiscount = null;
      }
    } catch (err) {
      couponError = err.message || "Failed to validate coupon";
      couponDiscount = null;
    }
  }

  // Handle new payment method creation
  function handleNewPaymentMethod(event: CustomEvent) {
    const { paymentMethodId } = event.detail;
    selectedPaymentMethod = paymentMethodId;
    addingNewPaymentMethod = false;

    // Refresh payment methods list
    fetchPaymentMethods().then((methods) => {
      paymentMethods = methods;
    });
  }

  // Complete subscription purchase
  async function completeSubscription() {
    if (!selectedPaymentMethod) {
      error = "Please select or add a payment method";
      return;
    }

    if (!agreeToTerms) {
      error = "Please agree to the terms and conditions";
      return;
    }

    processingPayment = true;
    error = null;

    try {
      await createSubscription(
        planId!,
        selectedPaymentMethod,
        couponDiscount ? couponCode : undefined,
      );

      // Update subscription store
      await subscriptionStore.refreshSubscription();

      success = true;

      // Redirect to success page after a short delay
      setTimeout(() => {
        goto("/subscriptions/success");
      }, 2000);
    } catch (err) {
      error = err.message || "Failed to process subscription";
      processingPayment = false;
    }
  }
</script>

<svelte:head>
  <title>Checkout | Portfolia</title>
  <meta name="description" content="Complete your subscription purchase" />
</svelte:head>

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <PageHeader
    title="Complete Your Purchase"
    description="You're just a few steps away from upgrading your account"
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
  {:else if success}
    <AlertBox type="success" class="my-8">
      Your subscription has been successfully processed! Redirecting to
      confirmation page...
      <LoadingSpinner size="sm" class="mt-2" />
    </AlertBox>
  {:else if plan}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
      <!-- Left side: Payment details -->
      <div class="md:col-span-2">
        <Card>
          <div class="p-6">
            <h2 class="text-xl font-bold mb-6">Payment Details</h2>

            {#if paymentMethods.length > 0}
              <div class="mb-6">
                <h3 class="text-sm font-medium mb-3">Select Payment Method</h3>
                <RadioGroup
                  name="paymentMethod"
                  options={paymentMethods.map((pm) => ({
                    value: pm.id,
                    label: `
                      <div class="flex items-center">
                        <div class="mr-3">
                          ${pm.brand === "visa" ? "💳" : pm.brand === "mastercard" ? "💳" : "💳"}
                        </div>
                        <div>
                          <div>${formatCardNumber(pm.lastFour || "****")}</div>
                          <div class="text-xs text-neutral-500">Expires ${formatExpiry(pm.expiryMonth || 0, pm.expiryYear || 0)}</div>
                        </div>
                      </div>
                    `,
                  }))}
                  value={selectedPaymentMethod || ""}
                  onChange={(value) => {
                    selectedPaymentMethod = value;
                  }}
                />

                <Button
                  variant="ghost"
                  size="sm"
                  class="mt-3"
                  on:click={() => (addingNewPaymentMethod = true)}
                >
                  + Add new payment method
                </Button>
              </div>
            {/if}

            {#if addingNewPaymentMethod || paymentMethods.length === 0}
              <div class="mb-6">
                <h3 class="text-sm font-medium mb-3">Add New Payment Method</h3>
                <PaymentMethodForm
                  on:success={handleNewPaymentMethod}
                  on:cancel={() =>
                    (addingNewPaymentMethod =
                      paymentMethods.length > 0 ? false : true)}
                />
              </div>
            {/if}

            <div class="mb-6">
              <h3 class="text-sm font-medium mb-3">Coupon Code</h3>
              <div class="flex space-x-2">
                <TextField
                  bind:value={couponCode}
                  placeholder="Enter coupon code"
                  error={couponError}
                  class="flex-grow"
                />
                <Button variant="outline" on:click={applyCoupon}>Apply</Button>
              </div>
              {#if couponDiscount}
                <p class="text-sm text-green-600 dark:text-green-400 mt-2">
                  Coupon applied! You're saving {couponDiscount}%.
                </p>
              {/if}
            </div>

            <div class="mb-6">
              <Checkbox
                bind:checked={agreeToTerms}
                label="I agree to the <a href='/terms' class='text-primary-600 hover:text-primary-700'>Terms of Service</a> and <a href='/privacy' class='text-primary-600 hover:text-primary-700'>Privacy Policy</a>"
              />
            </div>

            <div>
              <Button
                variant="primary"
                size="lg"
                class="w-full"
                disabled={!selectedPaymentMethod ||
                  !agreeToTerms ||
                  processingPayment}
                on:click={completeSubscription}
              >
                {#if processingPayment}
                  <LoadingSpinner size="sm" class="mr-2" />
                  Processing...
                {:else}
                  Complete Purchase
                {/if}
              </Button>

              <p
                class="text-xs text-center text-neutral-500 dark:text-neutral-400 mt-3"
              >
                You can cancel your subscription at any time from your account
                settings.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <!-- Right side: Order summary -->
      <div class="md:col-span-1">
        <Card>
          <div class="p-6">
            <h2 class="text-lg font-bold mb-4">Order Summary</h2>

            <div class="mb-4">
              <h3 class="font-medium">{plan.name} Plan</h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                {billingInterval.charAt(0).toUpperCase() +
                  billingInterval.slice(1)} billing
              </p>
            </div>

            <div
              class="border-t border-neutral-200 dark:border-neutral-700 my-4 pt-4"
            >
              <div class="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>${basePrice.toFixed(2)}</span>
              </div>

              {#if couponDiscount}
                <div
                  class="flex justify-between mb-2 text-green-600 dark:text-green-400"
                >
                  <span>Discount ({couponCode})</span>
                  <span>-${discountedAmount.toFixed(2)}</span>
                </div>
              {/if}

              <div
                class="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700"
              >
                <span>Total</span>
                <span>${finalPrice.toFixed(2)}</span>
              </div>

              {#if billingInterval === "monthly"}
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  Billed monthly. Cancel anytime.
                </p>
              {:else if billingInterval === "yearly"}
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  Billed annually. Save up to 25% compared to monthly billing.
                </p>
              {:else}
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  Billed quarterly. Cancel anytime.
                </p>
              {/if}
            </div>

            {#if plan.trialDays}
              <div
                class="bg-primary-50 dark:bg-primary-900 p-3 rounded-lg mt-4"
              >
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg
                      class="h-5 w-5 text-primary-600 dark:text-primary-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 10-1.414-1.414L11 10.586V7z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p
                      class="text-sm font-medium text-primary-800 dark:text-primary-200"
                    >
                      {plan.trialDays}-day free trial
                    </p>
                    <p class="text-xs text-primary-700 dark:text-primary-300">
                      You won't be charged until your trial ends on {new Date(
                        Date.now() + plan.trialDays * 24 * 60 * 60 * 1000,
                      ).toLocaleDateString()}.
                    </p>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </Card>

        <div class="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            on:click={() => goto("/subscriptions")}
          >
            Back to plans
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>
