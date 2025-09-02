<script lang="ts">
  import { onMount } from "svelte";
  import { format } from "date-fns";
  import Card from "$lib/components/common/Card.svelte";
  import Badge from "$lib/components/common/Badge.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import Dialog from "$lib/components/common/Dialog.svelte";
  import CurrencyField from "$lib/components/common/CurrencyField.svelte";
  import TextAreaField from "$lib/components/common/TextAreaField.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";
  import { formatCurrency } from "$lib/utils/formatters";

  export let contract;
  export let userRole = "freelancer"; // 'client' or 'freelancer'
  export let onUpdate = () => {};

  let isLoading = true;
  let isCreatingPayment = false;
  let isViewingPayment = false;
  let selectedPayment = null;
  let actionLoading = false;
  let error = "";
  let payments = [];

  // Payment form fields
  let paymentAmount = 0;
  let paymentDescription = "";

  onMount(() => {
    loadPayments();
  });

  async function loadPayments() {
    try {
      isLoading = true;
      // In a real app, this would make an API call to get payments for this contract
      // Mock response for demonstration
      await new Promise((resolve) => setTimeout(resolve, 600));

      payments = contract.payments || [];

      // Format amounts and dates for display
      payments = payments.map((payment) => {
        const formattedAmount = formatCurrency(
          payment.amount,
          payment.currency || "USD",
        );
        const initiatedDate = payment.initiatedAt
          ? format(new Date(payment.initiatedAt), "MMM d, yyyy")
          : "";
        const completedDate = payment.completedAt
          ? format(new Date(payment.completedAt), "MMM d, yyyy")
          : "";

        return {
          ...payment,
          formattedAmount,
          initiatedDate,
          completedDate,
        };
      });
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      isLoading = false;
    }
  }

  function resetForm() {
    paymentAmount = 0;
    paymentDescription = "";
    error = "";
  }

  function openCreatePaymentDialog() {
    resetForm();
    isCreatingPayment = true;
  }

  function openViewPaymentDialog(payment) {
    selectedPayment = payment;
    isViewingPayment = true;
  }

  async function handleCreatePayment() {
    try {
      if (!paymentAmount || paymentAmount <= 0) {
        error = "Payment amount must be greater than 0";
        return;
      }

      if (!paymentDescription.trim()) {
        error = "Description is required";
        return;
      }

      actionLoading = true;
      error = "";

      // In a real app, this would call an API to create a payment
      // Mock success for demonstration
      await new Promise((resolve) => setTimeout(resolve, 1000));

      isCreatingPayment = false;
      await loadPayments();
      await onUpdate();
    } catch (err) {
      error = err.message || "Failed to create payment";
      console.error(err);
    } finally {
      actionLoading = false;
    }
  }

  // Status color mapping
  const statusColors = {
    pending: "yellow",
    processing: "blue",
    completed: "green",
    failed: "red",
    refunded: "neutral",
  };
</script>

<!-- Create payment dialog -->
<Dialog
  open={isCreatingPayment}
  title="Create Payment"
  onClose={() => (isCreatingPayment = false)}
>
  <div class="py-4 space-y-4">
    <CurrencyField
      label="Payment Amount"
      bind:value={paymentAmount}
      currency={contract?.currency || "USD"}
      required
    />

    <TextAreaField
      label="Payment Description"
      bind:value={paymentDescription}
      placeholder="e.g. Payment for additional revisions"
      rows={3}
      required
    />

    {#if error}
      <AlertBox type="error">
        {error}
      </AlertBox>
    {/if}
  </div>

  <svelte:fragment slot="footer">
    <Button variant="neutral" on:click={() => (isCreatingPayment = false)}
      >Cancel</Button
    >
    <Button
      variant="primary"
      on:click={handleCreatePayment}
      disabled={actionLoading}
    >
      {#if actionLoading}
        <LoadingSpinner size="sm" class="mr-2" />
        Creating...
      {:else}
        Create Payment
      {/if}
    </Button>
  </svelte:fragment>
</Dialog>

<!-- View payment dialog -->
<Dialog
  open={isViewingPayment}
  title="Payment Details"
  onClose={() => (isViewingPayment = false)}
>
  {#if selectedPayment}
    <div class="py-4 space-y-4">
      <div class="mb-4">
        <div class="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div class="text-sm text-neutral-500">Amount</div>
            <div class="font-medium">{selectedPayment.formattedAmount}</div>
          </div>
          <div>
            <div class="text-sm text-neutral-500">Status</div>
            <div>
              <Badge color={statusColors[selectedPayment.status] || "neutral"}>
                {selectedPayment.status.charAt(0).toUpperCase() +
                  selectedPayment.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div class="text-sm text-neutral-500">Initiated Date</div>
            <div>{selectedPayment.initiatedDate || "N/A"}</div>
          </div>
          <div>
            <div class="text-sm text-neutral-500">Completed Date</div>
            <div>{selectedPayment.completedDate || "N/A"}</div>
          </div>
        </div>

        <div class="mb-3">
          <div class="text-sm text-neutral-500">Description</div>
          <p class="mt-1">{selectedPayment.description || "No description"}</p>
        </div>

        {#if selectedPayment.milestone}
          <div>
            <div class="text-sm text-neutral-500">Milestone</div>
            <p class="mt-1 font-medium">{selectedPayment.milestone.title}</p>
          </div>
        {/if}

        {#if selectedPayment.timeLog}
          <div>
            <div class="text-sm text-neutral-500">Time Log</div>
            <p class="mt-1">
              {format(
                new Date(selectedPayment.timeLog.startTime),
                "MMM d, yyyy",
              )}:
              {selectedPayment.timeLog.formattedDuration}
            </p>
          </div>
        {/if}
      </div>
    </div>

    <svelte:fragment slot="footer">
      <Button variant="neutral" on:click={() => (isViewingPayment = false)}
        >Close</Button
      >
    </svelte:fragment>
  {/if}
</Dialog>

<!-- Payments content -->
<div>
  <div
    class="flex flex-col md:flex-row md:items-center md:justify-between mb-6"
  >
    <h2 class="text-xl font-medium mb-4 md:mb-0">Payments</h2>

    {#if userRole === "client" && contract.status === "active"}
      <Button variant="primary" size="sm" on:click={openCreatePaymentDialog}>
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
        Create Payment
      </Button>
    {/if}
  </div>

  <!-- Payment summary -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <Card class="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
      <div class="p-4">
        <h3 class="text-sm font-medium text-neutral-500 mb-1">Total Paid</h3>
        <div class="text-2xl font-bold text-green-700">
          {formatCurrency(contract.paidAmount || 0, contract.currency || "USD")}
        </div>
      </div>
    </Card>

    {#if contract.contractType === "fixed"}
      <Card
        class="bg-gradient-to-br from-neutral-50 to-neutral-100 border-neutral-200"
      >
        <div class="p-4">
          <h3 class="text-sm font-medium text-neutral-500 mb-1">Remaining</h3>
          <div class="text-2xl font-bold text-neutral-700">
            {formatCurrency(
              contract.remainingAmount || 0,
              contract.currency || "USD",
            )}
          </div>
        </div>
      </Card>

      <Card class="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div class="p-4">
          <h3 class="text-sm font-medium text-neutral-500 mb-1">Total Value</h3>
          <div class="text-2xl font-bold text-blue-700">
            {formatCurrency(
              contract.totalAmount || 0,
              contract.currency || "USD",
            )}
          </div>
          <div class="text-sm text-blue-600 mt-1">
            {contract.completionPercentage || 0}% complete
          </div>
        </div>
      </Card>
    {/if}
  </div>

  <!-- Payments list -->
  {#if isLoading}
    <div class="flex justify-center py-12">
      <LoadingSpinner />
    </div>
  {:else if payments.length === 0}
    <Card>
      <div class="p-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16 mx-auto text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-neutral-900">
          No payments yet
        </h3>
        <p class="mt-2 text-neutral-600 max-w-md mx-auto">
          No payments have been made for this contract.
        </p>

        {#if userRole === "client" && contract.status === "active"}
          <div class="mt-6">
            <Button variant="primary" on:click={openCreatePaymentDialog}>
              Create Payment
            </Button>
          </div>
        {/if}
      </div>
    </Card>
  {:else}
    <Card>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200">
          <thead class="bg-neutral-50">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-200">
            {#each payments as payment (payment.id)}
              <tr class="hover:bg-neutral-50">
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900"
                >
                  {payment.completedDate || payment.initiatedDate}
                </td>
                <td
                  class="px-6 py-4 text-sm text-neutral-900 max-w-xs truncate"
                >
                  {#if payment.milestone}
                    Milestone: {payment.milestone.title}
                  {:else if payment.timeLog}
                    Time log: {format(
                      new Date(payment.timeLog.startTime),
                      "MMM d, yyyy",
                    )}
                  {:else}
                    {payment.description}
                  {/if}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900"
                >
                  {payment.formattedAmount}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <Badge color={statusColors[payment.status] || "neutral"}>
                    {payment.status.charAt(0).toUpperCase() +
                      payment.status.slice(1)}
                  </Badge>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
                  <Button
                    variant="outline"
                    size="xs"
                    on:click={() => openViewPaymentDialog(payment)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card>
  {/if}
</div>
