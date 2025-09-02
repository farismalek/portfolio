<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { format, formatDistanceToNow } from "date-fns";
  import { getUserApplications } from "$lib/services/jobService";
  import { authStore } from "$lib/stores/authStore";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import Badge from "$lib/components/common/Badge.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import FilterPanel from "$lib/components/common/FilterPanel.svelte";
  import FilterItem from "$lib/components/common/FilterItem.svelte";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import Card from "$lib/components/common/Card.svelte";

  let isLoading = true;
  let applications = [];
  let totalCount = 0;
  let error = null;

  let activeTab = "all";
  let statusFilter = "";

  // Pagination
  let currentPage = 1;
  let pageSize = 10;

  $: totalPages = Math.ceil(totalCount / pageSize);

  // Status color mapping
  const statusColors = {
    submitted: "blue",
    screening: "purple",
    interview: "purple",
    assessment: "purple",
    offer: "green",
    hired: "green",
    rejected: "red",
    withdrawn: "neutral",
  };

  // Status display names
  const statusNames = {
    submitted: "Submitted",
    screening: "Under Review",
    interview: "Interview",
    assessment: "Assessment",
    offer: "Offer",
    hired: "Hired",
    rejected: "Not Selected",
    withdrawn: "Withdrawn",
  };

  onMount(async () => {
    if ($authStore.user) {
      await loadApplications();
    } else {
      error = "Please log in to view your applications";
      isLoading = false;
    }
  });

  async function loadApplications() {
    try {
      isLoading = true;

      const params = {
        page: currentPage,
        limit: pageSize,
      };

      if (statusFilter) {
        params["status"] = statusFilter;
      }

      const result = await getUserApplications(params);
      applications = result.items;
      totalCount = result.totalCount;
    } catch (err) {
      error = err.message || "Failed to load applications";
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  function handleTabChange(tab) {
    activeTab = tab;

    // Set appropriate status filter based on tab
    switch (tab) {
      case "active":
        statusFilter = "";
        break;
      case "offers":
        statusFilter = "offer";
        break;
      case "rejected":
        statusFilter = "rejected";
        break;
      case "withdrawn":
        statusFilter = "withdrawn";
        break;
      default:
        statusFilter = "";
    }

    // Reset to page 1
    currentPage = 1;
    loadApplications();
  }

  function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    currentPage = newPage;
    loadApplications();
  }

  // Determine if application is active
  function isApplicationActive(status) {
    return ["submitted", "screening", "interview", "assessment"].includes(
      status,
    );
  }
</script>

<svelte:head>
  <title>My Applications | Portfolia</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <PageHeader
    title="My Applications"
    description="Track and manage your job applications"
  />

  <Tabs
    tabs={[
      { id: "all", label: "All Applications" },
      { id: "active", label: "Active" },
      { id: "offers", label: "Offers" },
      { id: "rejected", label: "Not Selected" },
      { id: "withdrawn", label: "Withdrawn" },
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
        <Button href="/jobs" variant="primary">Browse Jobs</Button>
      </div>
    </Card>
  {:else if applications.length === 0}
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
          No applications found
        </h2>
        <p class="mt-2 text-neutral-600 max-w-md mx-auto">
          {#if statusFilter}
            You don't have any applications with the selected status.
          {:else}
            You haven't applied to any jobs yet.
          {/if}
        </p>
        <div class="mt-6">
          <Button href="/jobs" variant="primary">Browse Jobs</Button>
        </div>
      </div>
    </Card>
  {:else}
    <div transition:fade={{ duration: 150 }} class="space-y-4">
      {#each applications as application (application.id)}
        <div
          class="bg-white rounded-lg border border-neutral-200 shadow-sm hover:border-primary-300 hover:shadow transition-all p-5"
        >
          <div
            class="flex flex-col md:flex-row md:items-center md:justify-between"
          >
            <div class="flex-1">
              <h3 class="font-medium text-lg">
                <a
                  href={`/jobs/${application.job.slug}`}
                  class="hover:text-primary-700"
                >
                  {application.job.title}
                </a>
              </h3>
              <p class="text-neutral-600 text-sm">
                <a
                  href={`/companies/${application.job.company.slug}`}
                  class="hover:text-primary-700"
                >
                  {application.job.company.name}
                </a>
                {#if application.job.location}
                  • {application.job.location.city}{application.job.location
                    .state
                    ? `, ${application.job.location.state}`
                    : ""}
                {/if}
              </p>
            </div>

            <div
              class="mt-3 md:mt-0 flex items-center justify-between md:justify-end"
            >
              <div class="md:mr-6">
                <Badge color={statusColors[application.status] || "neutral"}>
                  {statusNames[application.status] || application.status}
                </Badge>
              </div>
              <div class="text-sm text-neutral-500">
                Applied {formatDistanceToNow(new Date(application.appliedAt), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>

          {#if application.status === "screening" || application.status === "interview" || application.status === "assessment"}
            <div class="mt-4 pt-3 border-t border-neutral-100">
              <div class="text-sm">
                {#if application.status === "screening"}
                  <p class="text-neutral-600">
                    Your application is currently under review.
                  </p>
                {:else if application.status === "interview"}
                  <p class="text-neutral-600">
                    You've been selected for an interview.
                    {#if application.stages && application.stages.length > 0}
                      {#if application.stages[0].scheduledAt}
                        Scheduled for {format(
                          new Date(application.stages[0].scheduledAt),
                          "MMMM dd, yyyy",
                        )}.
                      {/if}
                    {/if}
                  </p>
                {:else if application.status === "assessment"}
                  <p class="text-neutral-600">
                    You've been asked to complete an assessment. Check your
                    email for details.
                  </p>
                {/if}
              </div>
            </div>
          {/if}

          <div
            class="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-end space-x-3 text-sm"
          >
            <Button
              href={`/jobs/${application.job.slug}`}
              variant="outline"
              size="sm"
            >
              View Job
            </Button>

            <Button
              href={`/account/applications/${application.id}`}
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
