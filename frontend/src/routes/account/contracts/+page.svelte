<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { format, formatDistanceToNow } from "date-fns";
  import { getContracts } from "$lib/services/contractsService";
  import { authStore } from "$lib/stores/authStore";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import Badge from "$lib/components/common/Badge.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Avatar from "$lib/components/common/Avatar.svelte";
  import { formatCurrency } from "$lib/utils/formatters";

  let isLoading = true;
  let contracts = [];
  let totalCount = 0;
  let error = null;

  let activeTab = "active";
  let roleFilter = "";

  // Pagination
  let currentPage = 1;
  let pageSize = 10;

  $: totalPages = Math.ceil(totalCount / pageSize);

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
    if ($authStore.user) {
      await loadContracts();
    } else {
      error = "Please log in to view your contracts";
      isLoading = false;
    }
  });

  async function loadContracts() {
    try {
      isLoading = true;

      const params = {
        page: currentPage,
        limit: pageSize,
        role: roleFilter || undefined,
      };

      // Convert activeTab to array of statuses
      switch (activeTab) {
        case "active":
          params.status = ["active", "pending"];
          break;
        case "completed":
          params.status = ["completed"];
          break;
        case "cancelled":
          params.status = ["cancelled", "disputed"];
          break;
        case "draft":
          params.status = ["draft"];
          break;
        // 'all' doesn't filter by status
      }

      const result = await getContracts(params);
      contracts = result.items;
      totalCount = result.totalCount;
    } catch (err) {
      error = err.message || "Failed to load contracts";
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  function handleTabChange(tab) {
    activeTab = tab;

    // Reset to page 1
    currentPage = 1;
    loadContracts();
  }

  function handleRoleChange(role) {
    roleFilter = role;
    currentPage = 1;
    loadContracts();
  }

  function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    currentPage = newPage;
    loadContracts();
  }

  // Get formatted contract type
  function getContractTypeLabel(contract) {
    if (contract.contractType === "fixed") {
      return "Fixed Price";
    } else if (contract.contractType === "hourly") {
      return "Hourly Rate";
    } else if (contract.contractType === "retainer") {
      return "Monthly Retainer";
    }
    return "Custom";
  }

  // Get partner in contract (client or freelancer)
  function getPartnerInfo(contract) {
    if ($authStore.user.id === contract.clientId) {
      return {
        name:
          contract.freelancer?.fullName ||
          contract.freelancer?.username ||
          "Freelancer",
        avatar: contract.freelancer?.profiles?.[0]?.avatarUrl,
        role: "Freelancer",
      };
    } else {
      return {
        name:
          contract.client?.fullName || contract.client?.username || "Client",
        avatar: contract.client?.profiles?.[0]?.avatarUrl,
        role: "Client",
      };
    }
  }
</script>

<svelte:head>
  <title>My Contracts | Portfolia</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <PageHeader
    title="My Contracts"
    description="Manage your freelance contracts and agreements"
  />

  <!-- Role Filter -->
  <div class="mb-6 flex justify-end">
    <div class="inline-flex rounded-md shadow-sm">
      <button
        class="px-4 py-2 text-sm font-medium rounded-l-md border border-neutral-300
          {!roleFilter
          ? 'bg-primary-50 border-primary-500 text-primary-700'
          : 'bg-white text-neutral-700 hover:bg-neutral-50'}"
        on:click={() => handleRoleChange("")}
      >
        All
      </button>
      <button
        class="px-4 py-2 text-sm font-medium border-t border-b border-neutral-300
          {roleFilter === 'client'
          ? 'bg-primary-50 border-primary-500 text-primary-700'
          : 'bg-white text-neutral-700 hover:bg-neutral-50'}"
        on:click={() => handleRoleChange("client")}
      >
        As Client
      </button>
      <button
        class="px-4 py-2 text-sm font-medium rounded-r-md border border-neutral-300
          {roleFilter === 'freelancer'
          ? 'bg-primary-50 border-primary-500 text-primary-700'
          : 'bg-white text-neutral-700 hover:bg-neutral-50'}"
        on:click={() => handleRoleChange("freelancer")}
      >
        As Freelancer
      </button>
    </div>
  </div>

  <Tabs
    tabs={[
      { id: "active", label: "Active Contracts" },
      { id: "draft", label: "Drafts" },
      { id: "completed", label: "Completed" },
      { id: "cancelled", label: "Cancelled" },
      { id: "all", label: "All" },
    ]}
    bind:activeTab
    on:change={(e) => handleTabChange(e.detail)}
    class="mb-6"
  />

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
        <h2 class="text-xl font-medium mb-2">Error</h2>
        <p class="text-neutral-600 mb-6">{error}</p>
        <Button href="/freelance" variant="primary">Browse Projects</Button>
      </div>
    </Card>
  {:else if contracts.length === 0}
    <Card>
      <div class="text-center py-12">
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h2 class="mt-4 text-xl font-medium text-neutral-900">
          No contracts found
        </h2>
        <p class="mt-2 text-neutral-600 max-w-md mx-auto">
          {#if activeTab !== "all"}
            You don't have any contracts with the selected status.
          {:else}
            You haven't created or received any contracts yet.
          {/if}
        </p>
        <div class="mt-6">
          <Button href="/freelance" variant="primary">Browse Projects</Button>
        </div>
      </div>
    </Card>
  {:else}
    <div transition:fade={{ duration: 150 }} class="space-y-4">
      {#each contracts as contract (contract.id)}
        <div
          class="bg-white rounded-lg border border-neutral-200 shadow-sm hover:border-primary-300 hover:shadow transition-all p-5"
        >
          <div
            class="flex flex-col md:flex-row md:items-center md:justify-between"
          >
            <div class="flex-1">
              <h3 class="font-medium text-lg">
                <a
                  href={`/account/contracts/${contract.id}`}
                  class="hover:text-primary-700"
                >
                  {contract.title}
                </a>
              </h3>

              {#if contract.project}
                <p class="text-neutral-600 text-sm">
                  Project: <a
                    href={`/freelance/projects/${contract.project.slug}`}
                    class="hover:text-primary-700"
                  >
                    {contract.project.title}
                  </a>
                </p>
              {/if}

              <div class="flex flex-wrap items-center gap-2 mt-2">
                <Badge color="neutral">{getContractTypeLabel(contract)}</Badge>
                <Badge color={statusColors[contract.status] || "neutral"}>
                  {statusNames[contract.status] || contract.status}
                </Badge>

                {#if contract.contractType === "fixed"}
                  <span class="text-sm font-medium">
                    {contract.formattedValue}
                  </span>
                {:else if contract.contractType === "hourly"}
                  <span class="text-sm font-medium">
                    {contract.formattedValue}
                  </span>
                {/if}
              </div>
            </div>

            <div class="mt-4 md:mt-0 md:ml-4 flex flex-col items-end">
              {#if contract.startDate}
                <div class="text-sm text-neutral-500">
                  Started: {format(new Date(contract.startDate), "MMM d, yyyy")}
                </div>
              {/if}

              <!-- Partner info -->
              {@const partner = getPartnerInfo(contract)}
              <div class="flex items-center mt-2">
                <span class="text-xs text-neutral-500 mr-2"
                  >{partner.role}:</span
                >
                <Avatar src={partner.avatar} alt={partner.name} size="xs" />
                <span class="ml-1 text-sm">{partner.name}</span>
              </div>
            </div>
          </div>

          <!-- Progress info -->
          {#if contract.status === "active"}
            <div class="mt-4 pt-3 border-t border-neutral-100">
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm"
              >
                {#if contract.contractType === "fixed"}
                  <div class="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-1 text-neutral-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <span>
                      {contract.milestones?.length || 0} milestone{contract
                        .milestones?.length !== 1
                        ? "s"
                        : ""} •
                      {contract.completionPercentage || 0}% complete
                    </span>
                  </div>
                {:else}
                  <div class="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-1 text-neutral-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Weekly limit: {contract.weeklyLimit || "Unlimited"} hours
                    </span>
                  </div>
                {/if}

                <div class="flex items-center mt-2 sm:mt-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-1 text-neutral-500"
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
                  <span>
                    Paid: {formatCurrency(
                      contract.paidAmount || 0,
                      contract.currency || "USD",
                    )}
                  </span>
                </div>
              </div>
            </div>
          {/if}

          <div
            class="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-end space-x-3 text-sm"
          >
            {#if contract.status === "draft" && contract.clientId === $authStore.user.id}
              <Button
                href={`/account/contracts/${contract.id}/edit`}
                variant="outline"
                size="sm"
              >
                Edit Contract
              </Button>
            {/if}

            <Button
              href={`/account/contracts/${contract.id}`}
              variant="primary"
              size="sm"
            >
              View Details
            </Button>
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="mt-8 flex justify-center">
        <div class="inline-flex rounded-md shadow">
          <button
            class="px-3 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50"
            on:click={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {#each Array(totalPages) as _, i}
            <button
              class="px-3 py-2 border-t border-b border-r border-neutral-300 text-sm font-medium
                {i + 1 === currentPage
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'bg-white text-neutral-500 hover:bg-neutral-50'}"
              on:click={() => changePage(i + 1)}
            >
              {i + 1}
            </button>
          {/each}

          <button
            class="px-3 py-2 rounded-r-md border-t border-b border-r border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50"
            on:click={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>
