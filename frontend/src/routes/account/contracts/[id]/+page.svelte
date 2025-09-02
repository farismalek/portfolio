<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { fade } from "svelte/transition";
  import { format } from "date-fns";
  import {
    getContract,
    signContract,
    cancelContract,
    completeContract,
  } from "$lib/services/contractsService";
  import { authStore } from "$lib/stores/authStore";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import Badge from "$lib/components/common/Badge.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Avatar from "$lib/components/common/Avatar.svelte";
  import ContractMilestones from "$lib/components/freelance/ContractMilestones.svelte";
  import ContractTimeLogs from "$lib/components/freelance/ContractTimeLogs.svelte";
  import ContractPayments from "$lib/components/freelance/ContractPayments.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";
  import Dialog from "$lib/components/common/Dialog.svelte";
  import TextAreaField from "$lib/components/common/TextAreaField.svelte";
  import { formatCurrency } from "$lib/utils/formatters";

  // Get contract ID from URL
  $: contractId = $page.params.id;

  let contract = null;
  let isLoading = true;
  let error = null;
  let activeTab = "overview";

  // Modal states
  let showSignDialog = false;
  let showCancelDialog = false;
  let showCompleteDialog = false;
  let cancellationReason = "";
  let isActionLoading = false;
  let actionError = "";

  // Status color mapping
  const statusColors = {
    draft: "neutral",
    pending: "blue",
    active: "green",
    completed: "purple",
    cancelled: "red",
    disputed: "orange",
  };

  // Status display names
  const statusNames = {
    draft: "Draft",
    pending: "Pending Signature",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled",
    disputed: "Disputed",
  };

  onMount(async () => {
    await loadContract();
  });

  async function loadContract() {
    try {
      isLoading = true;
      contract = await getContract(contractId);
    } catch (err) {
      error = err.message || "Failed to load contract";
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  function handleTabChange(newTab) {
    activeTab = newTab;
  }

  // Handle signing contract
  async function handleSignContract() {
    try {
      isActionLoading = true;
      actionError = "";

      await signContract(contractId);
      await loadContract(); // Reload contract data
      showSignDialog = false;
    } catch (err) {
      actionError = err.message || "Failed to sign contract";
      console.error(err);
    } finally {
      isActionLoading = false;
    }
  }

  // Handle cancelling contract
  async function handleCancelContract() {
    if (!cancellationReason.trim()) {
      actionError = "Please provide a reason for cancellation";
      return;
    }

    try {
      isActionLoading = true;
      actionError = "";

      await cancelContract(contractId, cancellationReason);
      await loadContract(); // Reload contract data
      showCancelDialog = false;
    } catch (err) {
      actionError = err.message || "Failed to cancel contract";
      console.error(err);
    } finally {
      isActionLoading = false;
    }
  }

  // Handle completing contract
  async function handleCompleteContract() {
    try {
      isActionLoading = true;
      actionError = "";

      await completeContract(contractId);
      await loadContract(); // Reload contract data
      showCompleteDialog = false;
    } catch (err) {
      actionError = err.message || "Failed to complete contract";
      console.error(err);
    } finally {
      isActionLoading = false;
    }
  }

  // Get contract partner (client or freelancer)
  function getPartner() {
    if (!contract) return null;

    if ($authStore.user.id === contract.clientId) {
      return {
        user: contract.freelancer,
        role: "Freelancer",
        avatarUrl: contract.freelancer?.profiles?.[0]?.avatarUrl,
        name:
          contract.freelancer?.fullName ||
          contract.freelancer?.username ||
          "Freelancer",
      };
    } else {
      return {
        user: contract.client,
        role: "Client",
        avatarUrl: contract.client?.profiles?.[0]?.avatarUrl,
        name:
          contract.client?.fullName || contract.client?.username || "Client",
        company: contract.company,
      };
    }
  }

  // Get formatted contract type
  function getContractTypeLabel() {
    if (!contract) return "";

    if (contract.contractType === "fixed") {
      return "Fixed Price";
    } else if (contract.contractType === "hourly") {
      return "Hourly Rate";
    } else if (contract.contractType === "retainer") {
      return "Monthly Retainer";
    }
    return "Custom";
  }

  // Check if user can sign the contract
  $: canSign =
    contract &&
    contract.status === "pending" &&
    (($authStore.user.id === contract.clientId && !contract.signedByClientAt) ||
      ($authStore.user.id === contract.freelancerId &&
        !contract.signedByFreelancerAt));

  // Check if user can cancel the contract
  $: canCancel = contract && ["pending", "active"].includes(contract.status);

  // Check if client can mark contract as complete
  $: canComplete =
    contract &&
    contract.status === "active" &&
    $authStore.user.id === contract.clientId;
</script>

<svelte:head>
  <title
    >{isLoading
      ? "Loading..."
      : contract
        ? `${contract.title} - Contract`
        : "Contract Not Found"} | Portfolia</title
  >
</svelte:head>

<!-- Sign Contract Dialog -->
<Dialog
  open={showSignDialog}
  title="Sign Contract"
  onClose={() => (showSignDialog = false)}
>
  <div class="py-4">
    <p>
      By signing this contract, you agree to all terms and conditions outlined
      in the contract. This action cannot be undone.
    </p>

    {#if actionError}
      <AlertBox type="error" class="mt-4">
        {actionError}
      </AlertBox>
    {/if}
  </div>

  <svelte:fragment slot="footer">
    <Button variant="neutral" on:click={() => (showSignDialog = false)}
      >Cancel</Button
    >
    <Button
      variant="primary"
      on:click={handleSignContract}
      disabled={isActionLoading}
    >
      {#if isActionLoading}
        <LoadingSpinner size="sm" class="mr-2" />
        Signing...
      {:else}
        Sign Contract
      {/if}
    </Button>
  </svelte:fragment>
</Dialog>

<!-- Cancel Contract Dialog -->
<Dialog
  open={showCancelDialog}
  title="Cancel Contract"
  onClose={() => (showCancelDialog = false)}
>
  <div class="py-4 space-y-4">
    <p>
      Are you sure you want to cancel this contract? This action cannot be
      undone.
    </p>

    <TextAreaField
      label="Reason for cancellation"
      bind:value={cancellationReason}
      placeholder="Please explain why you're cancelling this contract"
      required
    />

    {#if actionError}
      <AlertBox type="error">
        {actionError}
      </AlertBox>
    {/if}
  </div>

  <svelte:fragment slot="footer">
    <Button variant="neutral" on:click={() => (showCancelDialog = false)}
      >Go Back</Button
    >
    <Button
      variant="danger"
      on:click={handleCancelContract}
      disabled={isActionLoading}
    >
      {#if isActionLoading}
        <LoadingSpinner size="sm" class="mr-2" />
        Cancelling...
      {:else}
        Cancel Contract
      {/if}
    </Button>
  </svelte:fragment>
</Dialog>

<!-- Complete Contract Dialog -->
<Dialog
  open={showCompleteDialog}
  title="Complete Contract"
  onClose={() => (showCompleteDialog = false)}
>
  <div class="py-4">
    <p>
      Are you sure you want to mark this contract as complete? This will
      finalize all payments and close the contract.
    </p>

    {#if contract?.contractType === "fixed" && contract?.milestones?.some((m) => m.status !== "approved")}
      <AlertBox type="warning" class="mt-4">
        Warning: There are still incomplete milestones in this contract.
        Completing the contract now will mark all milestones as complete.
      </AlertBox>
    {/if}

    {#if actionError}
      <AlertBox type="error" class="mt-4">
        {actionError}
      </AlertBox>
    {/if}
  </div>

  <svelte:fragment slot="footer">
    <Button variant="neutral" on:click={() => (showCompleteDialog = false)}
      >Cancel</Button
    >
    <Button
      variant="primary"
      on:click={handleCompleteContract}
      disabled={isActionLoading}
    >
      {#if isActionLoading}
        <LoadingSpinner size="sm" class="mr-2" />
        Completing...
      {:else}
        Complete Contract
      {/if}
    </Button>
  </svelte:fragment>
</Dialog>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {#if isLoading}
    <div class="flex justify-center py-16">
      <LoadingSpinner />
    </div>
  {:else if error}
    <Card>
      <div class="text-center py-8">
        <div
          class="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-red-100 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 class="text-xl font-medium mb-2">Failed to Load Contract</h2>
        <p class="text-neutral-600 mb-6">{error}</p>
        <Button href="/account/contracts" variant="primary"
          >Go Back to Contracts</Button
        >
      </div>
    </Card>
  {:else if contract}
    <!-- Back button -->
    <div class="mb-6">
      <Button href="/account/contracts" variant="ghost" size="sm">
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
        Back to Contracts
      </Button>
    </div>

    <!-- Contract Header -->
    <Card class="mb-6">
      <div class="p-6">
        <div
          class="flex flex-col lg:flex-row lg:items-start lg:justify-between"
        >
          <div>
            <div class="flex items-center">
              <h1 class="text-2xl font-bold text-neutral-900">
                {contract.title}
              </h1>
              <Badge
                color={statusColors[contract.status] || "neutral"}
                class="ml-3"
              >
                {statusNames[contract.status] || contract.status}
              </Badge>
            </div>

            {#if contract.project}
              <p class="text-neutral-600 mt-1">
                Project: <a
                  href={`/freelance/projects/${contract.project.slug}`}
                  class="hover:text-primary-700"
                >
                  {contract.project.title}
                </a>
              </p>
            {/if}
          </div>

          <div class="mt-4 lg:mt-0 flex flex-wrap gap-2">
            {#if canSign}
              <Button
                variant="primary"
                on:click={() => (showSignDialog = true)}
              >
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Sign Contract
              </Button>
            {/if}

            {#if contract.status === "draft" && contract.clientId === $authStore.user.id}
              <Button
                href={`/account/contracts/${contract.id}/edit`}
                variant="outline"
              >
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </Button>
            {/if}

            {#if canComplete}
              <Button
                variant="success"
                on:click={() => (showCompleteDialog = true)}
              >
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Mark as Complete
              </Button>
            {/if}

            {#if canCancel}
              <Button
                variant="danger"
                on:click={() => (showCancelDialog = true)}
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancel Contract
              </Button>
            {/if}
          </div>
        </div>

        <!-- Contract status info -->
        {#if contract.status === "pending"}
          <div class="mt-4">
            <AlertBox type="info">
              <div class="flex items-center">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  This contract is awaiting signatures.
                  {#if contract.signedByClientAt}
                    Client has signed on {format(
                      new Date(contract.signedByClientAt),
                      "MMMM d, yyyy",
                    )}.
                  {:else}
                    Client has not signed yet.
                  {/if}
                  {#if contract.signedByFreelancerAt}
                    Freelancer has signed on {format(
                      new Date(contract.signedByFreelancerAt),
                      "MMMM d, yyyy",
                    )}.
                  {:else}
                    Freelancer has not signed yet.
                  {/if}
                </span>
              </div>
            </AlertBox>
          </div>
        {:else if contract.status === "active"}
          <div class="mt-4">
            <AlertBox type="success">
              <div class="flex items-center">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  This contract is active since {format(
                    new Date(contract.startDate),
                    "MMMM d, yyyy",
                  )}.
                </span>
              </div>
            </AlertBox>
          </div>
        {:else if contract.status === "completed"}
          <div class="mt-4">
            <AlertBox type="success">
              <div class="flex items-center">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  This contract was completed on {format(
                    new Date(contract.completedAt),
                    "MMMM d, yyyy",
                  )}.
                </span>
              </div>
            </AlertBox>
          </div>
        {:else if contract.status === "cancelled" || contract.status === "disputed"}
          <div class="mt-4">
            <AlertBox type="error">
              <div class="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <div>
                  <p>
                    This contract was cancelled on {format(
                      new Date(contract.cancelledAt),
                      "MMMM d, yyyy",
                    )}.
                  </p>
                  {#if contract.cancellationReason}
                    <p class="mt-1">
                      Reason: {contract.cancellationReason}
                    </p>
                  {/if}
                </div>
              </div>
            </AlertBox>
          </div>
        {/if}
      </div>
    </Card>

    <!-- Tabs Navigation -->
    <Tabs
      tabs={[
        { id: "overview", label: "Overview" },
        {
          id: "milestones",
          label: "Milestones",
          disabled: contract.contractType !== "fixed",
        },
        {
          id: "time",
          label: "Time & Activity",
          disabled: contract.contractType !== "hourly",
        },
        { id: "payments", label: "Payments" },
      ]}
      bind:activeTab
      on:change={(e) => handleTabChange(e.detail)}
      class="mb-6"
    />

    <!-- Tab Content -->
    <div>
      {#if activeTab === "overview"}
        <div
          transition:fade={{ duration: 150 }}
          class="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <!-- Main contract info -->
          <div class="lg:col-span-2 space-y-6">
            <Card>
              <div class="p-6">
                <h2 class="text-lg font-medium mb-4">Contract Details</h2>

                <!-- Type and value -->
                <div class="mb-6 pb-4 border-b border-neutral-200">
                  <div class="flex flex-wrap md:flex-nowrap justify-between">
                    <div class="w-full md:w-1/2 mb-4 md:mb-0">
                      <div class="text-sm text-neutral-500">Contract Type</div>
                      <div class="text-lg font-medium">
                        {getContractTypeLabel()}
                      </div>
                    </div>
                    <div class="w-full md:w-1/2">
                      <div class="text-sm text-neutral-500">Contract Value</div>
                      <div class="text-lg font-medium">
                        {contract.formattedValue}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Dates -->
                <div class="mb-6 pb-4 border-b border-neutral-200">
                  <div class="flex flex-wrap md:flex-nowrap justify-between">
                    <div class="w-full md:w-1/2 mb-4 md:mb-0">
                      <div class="text-sm text-neutral-500">Start Date</div>
                      <div>
                        {contract.startDate
                          ? format(new Date(contract.startDate), "MMMM d, yyyy")
                          : "Not started yet"}
                      </div>
                    </div>
                    <div class="w-full md:w-1/2">
                      <div class="text-sm text-neutral-500">End Date</div>
                      <div>
                        {contract.endDate
                          ? format(new Date(contract.endDate), "MMMM d, yyyy")
                          : "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Progress -->
                {#if contract.contractType === "fixed" && contract.status === "active"}
                  <div class="mb-6 pb-4 border-b border-neutral-200">
                    <div class="mb-1 flex justify-between">
                      <div class="text-sm text-neutral-500">Progress</div>
                      <div class="text-sm font-medium">
                        {contract.completionPercentage}%
                      </div>
                    </div>
                    <div class="w-full bg-neutral-200 rounded-full h-2.5">
                      <div
                        class="bg-primary-600 h-2.5 rounded-full"
                        style="width: {contract.completionPercentage}%"
                      ></div>
                    </div>
                  </div>
                {/if}

                <!-- Payments -->
                <div class="mb-6 pb-4 border-b border-neutral-200">
                  <div class="flex flex-wrap md:flex-nowrap justify-between">
                    <div class="w-full md:w-1/2 mb-4 md:mb-0">
                      <div class="text-sm text-neutral-500">Paid Amount</div>
                      <div class="text-lg font-medium text-green-600">
                        {formatCurrency(
                          contract.paidAmount || 0,
                          contract.currency || "USD",
                        )}
                      </div>
                    </div>
                    {#if contract.contractType === "fixed"}
                      <div class="w-full md:w-1/2">
                        <div class="text-sm text-neutral-500">
                          Remaining Amount
                        </div>
                        <div class="text-lg font-medium">
                          {formatCurrency(
                            contract.remainingAmount || 0,
                            contract.currency || "USD",
                          )}
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>

                <!-- Terms -->
                {#if contract.terms}
                  <div class="mb-6">
                    <h3 class="text-md font-medium mb-3">Terms & Conditions</h3>
                    <div class="prose max-w-none text-neutral-700 text-sm">
                      {contract.terms}
                    </div>
                  </div>
                {/if}

                <!-- Attachments -->
                {#if contract.attachmentUrls && contract.attachmentUrls.length > 0}
                  <div>
                    <h3 class="text-md font-medium mb-3">Attachments</h3>
                    <div class="space-y-2">
                      {#each contract.attachmentUrls as url, i}
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex items-center p-2 border border-neutral-200 rounded hover:border-primary-300 hover:bg-primary-50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5 mr-2 text-neutral-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          <span>Attachment {i + 1}</span>
                        </a>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </Card>
          </div>

          <!-- Sidebar -->
          <div class="lg:col-span-1 space-y-6">
            <!-- Partner info -->
            <Card>
              <div class="p-6">
                {@const partner = getPartner()}
                <h3 class="text-lg font-medium mb-4">
                  {partner?.role}
                </h3>

                <div class="flex items-center">
                  <Avatar
                    src={partner?.avatarUrl}
                    alt={partner?.name || "Partner"}
                    size="md"
                    className="mr-3"
                  />
                  <div>
                    <div class="font-medium">{partner?.name}</div>
                    {#if partner?.company}
                      <div class="text-sm text-neutral-500">
                        {partner.company.name}
                      </div>
                    {/if}
                  </div>
                </div>

                <div class="mt-4">
                  <Button
                    href={`/messages/new?to=${partner?.user?.id}`}
                    variant="outline"
                    size="sm"
                    fullWidth
                  >
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Message
                  </Button>
                </div>
              </div>
            </Card>

            <!-- Signatures -->
            <Card>
              <div class="p-6">
                <h3 class="text-lg font-medium mb-4">Contract Signatures</h3>

                <div class="space-y-4">
                  <!-- Client signature -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <Avatar
                        src={contract.client?.profiles?.[0]?.avatarUrl}
                        alt={contract.client?.fullName ||
                          contract.client?.username ||
                          "Client"}
                        size="sm"
                        className="mr-2"
                      />
                      <div>
                        <div class="text-sm font-medium">
                          {contract.client?.fullName ||
                            contract.client?.username ||
                            "Client"}
                        </div>
                        <div class="text-xs text-neutral-500">Client</div>
                      </div>
                    </div>

                    {#if contract.signedByClientAt}
                      <Badge color="green">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4 mr-1"
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
                        Signed
                      </Badge>
                    {:else}
                      <Badge color="yellow">Pending</Badge>
                    {/if}
                  </div>

                  <!-- Freelancer signature -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <Avatar
                        src={contract.freelancer?.profiles?.[0]?.avatarUrl}
                        alt={contract.freelancer?.fullName ||
                          contract.freelancer?.username ||
                          "Freelancer"}
                        size="sm"
                        className="mr-2"
                      />
                      <div>
                        <div class="text-sm font-medium">
                          {contract.freelancer?.fullName ||
                            contract.freelancer?.username ||
                            "Freelancer"}
                        </div>
                        <div class="text-xs text-neutral-500">Freelancer</div>
                      </div>
                    </div>

                    {#if contract.signedByFreelancerAt}
                      <Badge color="green">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4 mr-1"
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
                        Signed
                      </Badge>
                    {:else}
                      <Badge color="yellow">Pending</Badge>
                    {/if}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      {:else if activeTab === "milestones"}
        <div transition:fade={{ duration: 150 }}>
          <ContractMilestones
            {contract}
            userRole={$authStore.user.id === contract.clientId
              ? "client"
              : "freelancer"}
            onUpdate={loadContract}
          />
        </div>
      {:else if activeTab === "time"}
        <div transition:fade={{ duration: 150 }}>
          <ContractTimeLogs
            {contract}
            userRole={$authStore.user.id === contract.clientId
              ? "client"
              : "freelancer"}
            onUpdate={loadContract}
          />
        </div>
      {:else if activeTab === "payments"}
        <div transition:fade={{ duration: 150 }}>
          <ContractPayments
            {contract}
            userRole={$authStore.user.id === contract.clientId
              ? "client"
              : "freelancer"}
            onUpdate={loadContract}
          />
        </div>
      {/if}
    </div>
  {/if}
</div>
