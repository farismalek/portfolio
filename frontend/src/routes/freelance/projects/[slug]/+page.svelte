<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { format, formatDistanceToNow } from "date-fns";
  import { getProject } from "$lib/services/freelanceService";
  import { authStore } from "$lib/stores/authStore";
  import Button from "$lib/components/common/Button.svelte";
  import Badge from "$lib/components/common/Badge.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import Avatar from "$lib/components/common/Avatar.svelte";
  import SubmitProposalModal from "$lib/components/freelance/SubmitProposalModal.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";
  import SimilarProjects from "$lib/components/freelance/SimilarProjects.svelte";

  // Get project slug from URL
  $: slug = $page.params.slug;

  let project = null;
  let isLoading = true;
  let error = null;
  let showProposalModal = false;

  // Format published date
  $: publishedDateFormatted = project?.publishedAt
    ? format(new Date(project.publishedAt), "MMMM dd, yyyy")
    : "";

  // Format deadline
  $: deadlineFormatted = project?.deadline
    ? format(new Date(project.deadline), "MMMM dd, yyyy")
    : "No deadline";

  // Check if deadline has passed
  $: deadlinePassed = project?.deadline
    ? new Date(project.deadline) < new Date()
    : false;

  // Format complexity for display
  $: formattedComplexity = project?.complexity
    ? project.complexity.charAt(0).toUpperCase() + project.complexity.slice(1)
    : "";

  // Format duration for display
  $: formattedDuration = formatDuration(project?.duration);

  // Format duration string
  function formatDuration(duration) {
    if (!duration) return "";

    switch (duration) {
      case "less_than_1_month":
        return "Less than 1 month";
      case "1_to_3_months":
        return "1 to 3 months";
      case "3_to_6_months":
        return "3 to 6 months";
      case "more_than_6_months":
        return "More than 6 months";
      default:
        return duration?.replace(/_/g, " ") || "";
    }
  }

  // Load project data
  onMount(async () => {
    try {
      isLoading = true;
      project = await getProject(slug);
    } catch (err) {
      error = err.message || "Failed to load project";
      console.error(err);
    } finally {
      isLoading = false;
    }
  });

  // Open proposal modal
  function handleSubmitProposal() {
    if (!$authStore.user) {
      // Redirect to login if not authenticated
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    showProposalModal = true;
  }

  // Handle proposal submission success
  function handleProposalSuccess() {
    // Update local state
    project.hasProposed = true;
    showProposalModal = false;
  }
</script>

<svelte:head>
  <title
    >{isLoading
      ? "Loading..."
      : project
        ? `${project.title} - Freelance Project`
        : "Project Not Found"} | Portfolia</title
  >
  <meta
    name="description"
    content={project?.shortDescription || "Freelance project details"}
  />
</svelte:head>

<SubmitProposalModal
  {project}
  open={showProposalModal}
  onClose={() => (showProposalModal = false)}
  onSuccess={handleProposalSuccess}
/>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {#if isLoading}
    <div class="flex justify-center py-16">
      <LoadingSpinner />
    </div>
  {:else if error}
    <div class="bg-white rounded-lg shadow p-8 text-center">
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
      <h2 class="text-xl font-medium mb-2">Failed to Load Project</h2>
      <p class="text-neutral-600 mb-6">{error}</p>
      <Button href="/freelance" variant="primary">Go Back to Projects</Button>
    </div>
  {:else if project}
    <!-- Back button -->
    <div class="mb-6">
      <Button href="/freelance" variant="ghost" size="sm">
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
        Back to Projects
      </Button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main content -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <!-- Project header -->
          <div class="mb-6">
            <div class="flex items-start justify-between">
              <div>
                <h1 class="text-2xl font-bold text-neutral-900">
                  {project.title}
                </h1>
                <div class="flex items-center mt-2 text-neutral-600">
                  <span>{project.category}</span>
                  {#if project.subcategory}
                    <span class="mx-1">•</span>
                    <span>{project.subcategory}</span>
                  {/if}
                </div>
              </div>

              {#if project.isFeatured}
                <Badge color="yellow">Featured</Badge>
              {/if}
            </div>

            <div class="flex flex-wrap gap-2 mt-4">
              {#if formattedComplexity}
                <Badge color="neutral">{formattedComplexity}</Badge>
              {/if}
              {#if formattedDuration}
                <Badge color="neutral">{formattedDuration}</Badge>
              {/if}
              {#if project.budgetType === "fixed"}
                <Badge color="green">Fixed Price</Badge>
              {:else if project.budgetType === "hourly"}
                <Badge color="green">Hourly Rate</Badge>
              {/if}
            </div>

            <div class="text-sm text-neutral-500 mt-4">
              <p>
                Posted {formatDistanceToNow(new Date(project.publishedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          <!-- Applied notice -->
          {#if project.hasProposed}
            <AlertBox type="success" class="mb-6">
              <p class="text-sm">
                You've already submitted a proposal for this project. You can
                check the status in your dashboard.
              </p>
              <div class="mt-2">
                <Button href="/account/proposals" variant="outline" size="sm">
                  View My Proposals
                </Button>
              </div>
            </AlertBox>
          {/if}

          <!-- Description -->
          {#if project.description}
            <div class="mb-8">
              <h2 class="text-lg font-semibold mb-3">Project Description</h2>
              <div class="prose max-w-none">
                {project.description}
              </div>
            </div>
          {/if}

          <!-- Skills section -->
          {#if project.skills && project.skills.length > 0}
            <div class="mb-8">
              <h2 class="text-lg font-semibold mb-3">Skills Required</h2>
              <div class="flex flex-wrap gap-2">
                {#each project.skills as skill}
                  <span
                    class="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Attachments -->
          {#if project.attachmentUrls && project.attachmentUrls.length > 0}
            <div class="mb-8">
              <h2 class="text-lg font-semibold mb-3">Attachments</h2>
              <div class="space-y-2">
                {#each project.attachmentUrls as url, i}
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

          <!-- Apply button -->
          <div class="mt-8">
            {#if project.hasProposed}
              <div class="flex gap-4">
                <Button variant="success" disabled={true} class="w-full">
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
                  Proposal Submitted
                </Button>
              </div>
            {:else if project.status !== "open" || deadlinePassed}
              <Button variant="neutral" disabled={true} class="w-full">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {project.status === "in_progress"
                  ? "Project In Progress"
                  : project.status === "completed"
                    ? "Project Completed"
                    : project.status === "cancelled"
                      ? "Project Cancelled"
                      : deadlinePassed
                        ? "Deadline Passed"
                        : "Not Available"}
              </Button>
            {:else if $authStore.user && project.clientId === $authStore.user.id}
              <Button variant="neutral" disabled={true} class="w-full">
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
                You Can't Submit Proposal to Your Own Project
              </Button>
            {:else}
              <Button
                variant="primary"
                class="w-full"
                on:click={handleSubmitProposal}
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
                Submit Proposal
              </Button>
            {/if}
          </div>
        </div>

        <!-- Similar projects -->
        <SimilarProjects
          category={project.category}
          projectId={project.id}
          skills={project.skills}
        />
      </div>

      <!-- Sidebar -->
      <div class="lg:col-span-1">
        <!-- Client card -->
        <div class="bg-white rounded-lg shadow mb-6">
          <div class="p-6">
            <h3 class="font-medium text-lg mb-4">About the Client</h3>
            <div class="flex items-center mb-4">
              <Avatar
                src={project.client?.profiles?.[0]?.avatarUrl}
                alt={project.client?.fullName ||
                  project.client?.username ||
                  "Client"}
                size="md"
                className="mr-3"
              />
              <div>
                <div class="font-medium">
                  {project.client?.fullName ||
                    project.client?.username ||
                    "Client"}
                </div>
                {#if project.company}
                  <div class="text-sm text-neutral-500">
                    {project.company.name}
                  </div>
                {/if}
              </div>
            </div>

            {#if project.client?.profiles?.[0]?.country || project.client?.profiles?.[0]?.city}
              <div class="text-sm text-neutral-600 mb-2 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 mr-2 text-neutral-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {project.client?.profiles?.[0]?.city || ""}
                {project.client?.profiles?.[0]?.city &&
                project.client?.profiles?.[0]?.country
                  ? ", "
                  : ""}
                {project.client?.profiles?.[0]?.country || ""}
              </div>
            {/if}

            <div class="text-sm text-neutral-600 mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 mr-2 text-neutral-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Member since {project.client?.createdAt
                ? format(new Date(project.client.createdAt), "MMMM yyyy")
                : "recently"}
            </div>

            {#if $authStore.user && $authStore.user.id !== project.clientId}
              <Button
                href={`/messages/new?to=${project.clientId}`}
                variant="outline"
                size="sm"
                fullWidth
                class="mt-2"
              >
                Contact Client
              </Button>
            {/if}
          </div>
        </div>

        <!-- Project details -->
        <div class="bg-white rounded-lg shadow">
          <div class="p-6">
            <h3 class="font-medium mb-4">Project Details</h3>

            <div class="space-y-4 text-sm">
              <!-- Budget -->
              <div class="flex">
                <div class="w-5 h-5 mr-3 text-neutral-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
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
                </div>
                <div>
                  <div class="font-medium">Budget</div>
                  <div class="text-neutral-600">
                    {#if project.budgetType === "fixed" && project.budgetAmount}
                      {project.formattedBudget} (Fixed)
                    {:else if project.budgetType === "hourly"}
                      {#if project.budgetMinHourly && project.budgetMaxHourly}
                        {project.formattedBudget} (Hourly)
                      {:else if project.budgetMinHourly}
                        From {project.formattedBudget} (Hourly)
                      {:else if project.budgetMaxHourly}
                        Up to {project.formattedBudget} (Hourly)
                      {:else}
                        Hourly Rate (To Be Discussed)
                      {/if}
                    {:else}
                      To Be Discussed
                    {/if}
                  </div>
                </div>
              </div>

              <!-- Duration -->
              {#if formattedDuration}
                <div class="flex">
                  <div class="w-5 h-5 mr-3 text-neutral-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
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
                  </div>
                  <div>
                    <div class="font-medium">Duration</div>
                    <div class="text-neutral-600">{formattedDuration}</div>
                  </div>
                </div>
              {/if}

              <!-- Complexity -->
              {#if formattedComplexity}
                <div class="flex">
                  <div class="w-5 h-5 mr-3 text-neutral-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div class="font-medium">Complexity</div>
                    <div class="text-neutral-600">{formattedComplexity}</div>
                  </div>
                </div>
              {/if}

              <!-- Posted date -->
              <div class="flex">
                <div class="w-5 h-5 mr-3 text-neutral-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="font-medium">Posted On</div>
                  <div class="text-neutral-600">{publishedDateFormatted}</div>
                </div>
              </div>

              <!-- Deadline -->
              {#if project.deadline}
                <div class="flex">
                  <div class="w-5 h-5 mr-3 text-neutral-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
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
                  </div>
                  <div>
                    <div class="font-medium">Proposal Deadline</div>
                    <div
                      class={deadlinePassed
                        ? "text-red-600"
                        : "text-neutral-600"}
                    >
                      {deadlineFormatted}
                      {#if deadlinePassed}
                        <span class="text-red-600 ml-2">(Expired)</span>
                      {/if}
                    </div>
                  </div>
                </div>
              {/if}

              <!-- Proposal count -->
              <div class="flex">
                <div class="w-5 h-5 mr-3 text-neutral-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="font-medium">Proposals</div>
                  <div class="text-neutral-600">
                    {project.proposalCount || 0} proposal{project.proposalCount !==
                    1
                      ? "s"
                      : ""} so far
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
