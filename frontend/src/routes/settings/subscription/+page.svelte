<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { subscriptionStore } from "$lib/stores/subscriptionStore";
  import {
    fetchCurrentSubscription,
    cancelSubscription,
    fetchInvoices,
    downloadInvoice,
  } from "$lib/services/subscriptionService";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import TextField from "$lib/components/common/TextField.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";
  import Dialog from "$lib/components/common/Dialog.svelte";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import type { Invoice } from "$lib/types/subscription";

  let loading = true;
  let loadingInvoices = true;
  let error: string | null = null;
  let invoices: Invoice[] = [];
  let activeTab = "details";
  let showCancelDialog = false;
  let cancellationReason = "";
  let processingCancellation = false;
  let cancellationSuccess = false;
  let cancellationError: string | null = null;

  $: subscription = $subscriptionStore.subscription;
  $: plan = $subscriptionStore.plans.find((p) => p.id === subscription?.planId);

  onMount(async () => {
    try {
      // Refresh subscription data
      await subscriptionStore.refreshSubscription();

      // Fetch invoice history
      loadInvoiceHistory();

      loading = false;
    } catch (err) {
      error = err.message || "Failed to load subscription details";
      loading = false;
    }
  });

  async function loadInvoiceHistory() {
    loadingInvoices = true;

    try {
      invoices = await fetchInvoices();
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      loadingInvoices = false;
    }
  }

  // Format date
  function formatDate(dateString: string): string {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  }

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Handle subscription cancellation
  async function handleCancelSubscription() {
    if (!subscription) return;

    processingCancellation = true;
    cancellationError = null;

    try {
      await cancelSubscription(subscription.id, cancellationReason);

      // Refresh subscription state
      await subscriptionStore.refreshSubscription();

      cancellationSuccess = true;

      // Close dialog after a short delay
      setTimeout(() => {
        showCancelDialog = false;
      }, 3000);
    } catch (err) {
      cancellationError = err.message || "Failed to cancel subscription";
    } finally {
      processingCancellation = false;
    }
  }

  // Download invoice
  async function handleDownloadInvoice(invoiceId: string) {
    try {
      const blob = await downloadInvoice(invoiceId);

      // Create a temporary download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (err) {
      console.error("Failed to download invoice:", err);
      // Show an error message to the user
    }
  }
</script>

<svelte:head>
  <title>Subscription Management | Portfolia</title>
  <meta name="description" content="Manage your subscription settings" />
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <PageHeader
    title="Subscription Management"
    description="Manage your subscription and billing information"
  >
    <Button href="/settings" variant="ghost">
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
      Back to Settings
    </Button>
  </PageHeader>

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
    <Tabs
      tabs={[
        { id: "details", label: "Subscription Details" },
        { id: "billing", label: "Billing History" },
        { id: "payment", label: "Payment Methods" },
      ]}
      bind:activeTab
    />

    <div class="mt-6">
      <!-- Subscription Details Tab -->
      {#if activeTab === "details"}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Subscription Status Card -->
          <div class="md:col-span-2">
            <Card>
              <div class="p-6">
                <h3 class="text-lg font-medium mb-4">Current Subscription</h3>

                {#if subscription}
                  <div class="grid md:grid-cols-2 gap-6">
                    <div>
                      <div
                        class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
                      >
                        Plan
                      </div>
                      <div class="text-lg font-bold">
                        {plan?.name || "Unknown Plan"}
                      </div>

                      <div
                        class="text-sm text-neutral-500 dark:text-neutral-400 mt-4 mb-1"
                      >
                        Status
                      </div>
                      <div>
                        <span
                          class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            subscription.status === "active" ||
                            subscription.status === "trialing"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : subscription.status === "past_due" ||
                                  subscription.status === "unpaid"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                          }`}
                        >
                          {subscription.status === "active"
                            ? "Active"
                            : subscription.status === "trialing"
                              ? "Trial"
                              : subscription.status === "past_due"
                                ? "Past Due"
                                : subscription.status === "unpaid"
                                  ? "Unpaid"
                                  : subscription.status === "canceled"
                                    ? "Canceled"
                                    : subscription.status === "incomplete"
                                      ? "Incomplete"
                                      : subscription.status ===
                                          "incomplete_expired"
                                        ? "Expired"
                                        : subscription.status === "paused"
                                          ? "Paused"
                                          : "Ended"}
                        </span>

                        {#if subscription.cancelAtPeriodEnd}
                          <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 ml-2"
                          >
                            Cancels at period end
                          </span>
                        {/if}
                      </div>
                    </div>

                    <div>
                      <div
                        class="text-sm text-neutral-500 dark:text-neutral-400 mb-1"
                      >
                        Current Period
                      </div>
                      <div>
                        {formatDate(subscription.currentPeriodStart)} - {formatDate(
                          subscription.currentPeriodEnd,
                        )}
                      </div>

                      <div
                        class="text-sm text-neutral-500 dark:text-neutral-400 mt-4 mb-1"
                      >
                        Billing Interval
                      </div>
                      <div class="capitalize">{subscription.interval}</div>

                      {#if subscription.trialEnd}
                        <div
                          class="text-sm text-neutral-500 dark:text-neutral-400 mt-4 mb-1"
                        >
                          Trial Ends
                        </div>
                        <div>{formatDate(subscription.trialEnd)}</div>
                      {/if}
                    </div>
                  </div>

                  {#if !subscription.cancelAtPeriodEnd && subscription.status !== "canceled" && subscription.status !== "ended"}
                    <div
                      class="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700 flex justify-between"
                    >
                      <div>
                        {#if subscription.status === "trialing"}
                          <p
                            class="text-sm text-neutral-600 dark:text-neutral-400"
                          >
                            Your free trial ends on {formatDate(
                              subscription.trialEnd,
                            )}. You will be billed {formatCurrency(
                              plan?.price[subscription.interval] || 0,
                            )} after your trial.
                          </p>
                        {:else}
                          <p
                            class="text-sm text-neutral-600 dark:text-neutral-400"
                          >
                            Your next billing date is {formatDate(
                              subscription.currentPeriodEnd,
                            )}.
                          </p>
                        {/if}
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        on:click={() => (showCancelDialog = true)}
                      >
                        Cancel Subscription
                      </Button>
                    </div>
                  {:else if subscription.cancelAtPeriodEnd}
                    <div
                      class="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700"
                    >
                      <div
                        class="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-md"
                      >
                        <h4
                          class="text-sm font-medium text-amber-800 dark:text-amber-200"
                        >
                          Subscription Cancellation Scheduled
                        </h4>
                        <p
                          class="text-sm text-amber-700 dark:text-amber-300 mt-1"
                        >
                          Your subscription will be canceled on {formatDate(
                            subscription.currentPeriodEnd,
                          )}. You still have access to all features until this
                          date.
                        </p>
                        <div class="mt-3">
                          <Button variant="amber" size="sm">
                            Resume Subscription
                          </Button>
                        </div>
                      </div>
                    </div>
                  {/if}
                {:else}
                  <div class="text-center py-8">
                    <p class="text-neutral-500 dark:text-neutral-400 mb-6">
                      You don't have an active subscription.
                    </p>
                    <Button variant="primary" href="/subscriptions">
                      View Plans
                    </Button>
                  </div>
                {/if}
              </div>
            </Card>
          </div>

          <!-- Plan Features Card -->
          <div class="md:col-span-1">
            {#if plan}
              <Card>
                <div class="p-6">
                  <h3 class="text-lg font-medium mb-4">Plan Features</h3>

                  <ul class="space-y-3">
                    {#each plan.features.filter((f) => f.included) as feature}
                      <li class="flex">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
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
                        <span>
                          {feature.name}
                          {#if feature.limit}
                            <span class="text-neutral-500"
                              >({feature.limit})</span
                            >
                          {/if}
                        </span>
                      </li>
                    {/each}
                  </ul>

                  <div
                    class="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700"
                  >
                    <Button
                      href="/subscriptions"
                      variant="outline"
                      class="w-full"
                    >
                      Change Plan
                    </Button>
                  </div>
                </div>
              </Card>
            {/if}
          </div>
        </div>

        <!-- Billing History Tab -->
      {:else if activeTab === "billing"}
        <Card>
          <div class="p-6">
            <h3 class="text-lg font-medium mb-4">Billing History</h3>

            {#if loadingInvoices}
              <div class="flex justify-center py-6">
                <LoadingSpinner />
              </div>
            {:else if invoices.length === 0}
              <div
                class="py-6 text-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg"
              >
                <p class="text-neutral-500 dark:text-neutral-400">
                  No billing history available yet.
                </p>
              </div>
            {:else}
              <div class="overflow-x-auto">
                <table
                  class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700"
                >
                  <thead>
                    <tr
                      class="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
                    >
                      <th class="px-4 py-3">Date</th>
                      <th class="px-4 py-3">Amount</th>
                      <th class="px-4 py-3">Status</th>
                      <th class="px-4 py-3">Invoice</th>
                    </tr>
                  </thead>
                  <tbody
                    class="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700"
                  >
                    {#each invoices as invoice}
                      <tr>
                        <td class="px-4 py-4 whitespace-nowrap">
                          {formatDate(invoice.date)}
                        </td>
                        <td class="px-4 py-4 whitespace-nowrap">
                          {formatCurrency(invoice.amount)}
                        </td>
                        <td class="px-4 py-4 whitespace-nowrap">
                          <span
                            class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${
                              invoice.status === "paid"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : invoice.status === "open"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                            }`}
                          >
                            {invoice.status.charAt(0).toUpperCase() +
                              invoice.status.slice(1)}
                          </span>
                        </td>
                        <td class="px-4 py-4 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="xs"
                            on:click={() => handleDownloadInvoice(invoice.id)}
                          >
                            Download
                          </Button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        </Card>

        <!-- Payment Methods Tab -->
      {:else if activeTab === "payment"}
        <Card>
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium">Payment Methods</h3>
              <Button href="/settings/payment-methods/new" variant="outline">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Payment Method
              </Button>
            </div>

            <!-- This would typically loop through actual payment methods -->
            <div
              class="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 flex justify-between items-center"
            >
              <div class="flex items-center">
                <div
                  class="rounded-md bg-neutral-100 dark:bg-neutral-800 p-2 mr-4"
                >
                  <svg
                    class="h-8 w-8 text-neutral-700 dark:text-neutral-300"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v2h16V6H4zm16 12V10H4v8h16z"
                    />
                  </svg>
                </div>
                <div>
                  <p class="font-medium">Visa ending in 4242</p>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">
                    Expires 12/25
                  </p>
                </div>
              </div>
              <div class="flex items-center">
                <span
                  class="mr-4 text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full"
                >
                  Default
                </span>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </div>
          </div>
        </Card>
      {/if}
    </div>
  {/if}
</div>

<!-- Cancel Subscription Dialog -->
<Dialog
  open={showCancelDialog}
  title="Cancel Subscription"
  size="md"
  onClose={() => {
    if (!processingCancellation) {
      showCancelDialog = false;
    }
  }}
>
  {#if cancellationSuccess}
    <div class="p-6 text-center">
      <div
        class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-green-600 dark:text-green-300"
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
      <h3 class="text-lg font-medium mb-2">Subscription Canceled</h3>
      <p class="text-neutral-600 dark:text-neutral-400">
        Your subscription has been canceled and will end on {formatDate(
          subscription?.currentPeriodEnd || "",
        )}. You'll continue to have access to all features until that date.
      </p>
      <div class="mt-6">
        <LoadingSpinner size="sm" />
      </div>
    </div>
  {:else}
    <div class="p-6">
      {#if cancellationError}
        <AlertBox
          type="error"
          dismissible
          bind:visible={cancellationError}
          class="mb-4"
        >
          {cancellationError}
        </AlertBox>
      {/if}

      <p class="mb-4 text-neutral-600 dark:text-neutral-400">
        Are you sure you want to cancel your subscription? You'll continue to
        have access to all features until the end of your current billing period
        on {formatDate(subscription?.currentPeriodEnd || "")}.
      </p>

      <TextAreaField
        label="Please tell us why you're canceling (optional)"
        bind:value={cancellationReason}
        placeholder="Your feedback helps us improve our service"
        rows={3}
      />

      <div class="mt-6 bg-amber-50 dark:bg-amber-900/30 p-4 rounded-md">
        <h4 class="font-medium text-amber-800 dark:text-amber-300 mb-1">
          What you'll lose
        </h4>
        <ul class="text-sm text-amber-700 dark:text-amber-400 space-y-1">
          {#if plan}
            {#each plan.features.filter((f) => f.included && f.highlighted) as feature}
              <li class="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 mr-2"
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
                {feature.name}
              </li>
            {/each}
          {/if}
        </ul>
      </div>

      <div class="mt-6 flex justify-end space-x-3">
        <Button
          variant="outline"
          on:click={() => (showCancelDialog = false)}
          disabled={processingCancellation}
        >
          Keep Subscription
        </Button>
        <Button
          variant="danger"
          on:click={handleCancelSubscription}
          disabled={processingCancellation}
        >
          {#if processingCancellation}
            <LoadingSpinner size="sm" class="mr-2" />
            Processing...
          {:else}
            Confirm Cancellation
          {/if}
        </Button>
      </div>
    </div>
  {/if}
</Dialog>
