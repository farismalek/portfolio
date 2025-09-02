<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { format, formatDistanceToNow } from "date-fns";
  import { getJob, saveJob, unsaveJob } from "$lib/services/jobService";
  import { authStore } from "$lib/stores/authStore";
  import Button from "$lib/components/common/Button.svelte";
  import Badge from "$lib/components/common/Badge.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import ApplyJobModal from "$lib/components/jobs/ApplyJobModal.svelte";
  import SimilarJobs from "$lib/components/jobs/SimilarJobs.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";

  // Get job slug from URL
  $: slug = $page.params.slug;

  let job = null;
  let isLoading = true;
  let error = null;
  let showApplyModal = false;
  let isSaving = false;

  // For company logo display
  $: companyInitials = job?.company?.name
    ? job.company.name
        .split(" ")
        .map((word) => word[0].toUpperCase())
        .join("")
    : "";

  // Format published date
  $: publishedDateFormatted = job?.publishedAt
    ? format(new Date(job.publishedAt), "MMMM dd, yyyy")
    : "";

  // Format application deadline
  $: deadlineFormatted = job?.applicationDeadline
    ? format(new Date(job.applicationDeadline), "MMMM dd, yyyy")
    : "No deadline";

  // Check if deadline has passed
  $: deadlinePassed = job?.applicationDeadline
    ? new Date(job.applicationDeadline) < new Date()
    : false;

  // Format employment type for display
  $: formattedEmploymentType = job?.employmentType
    ? job.employmentType
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";

  // Format experience level for display
  $: formattedExperienceLevel = job?.experienceLevel
    ? job.experienceLevel
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";

  // Format remote policy
  $: formattedRemotePolicy = job?.remotePolicy
    ? job.remotePolicy === "remote"
      ? "Remote"
      : job.remotePolicy === "hybrid"
        ? "Hybrid"
        : job.remotePolicy === "onsite"
          ? "On-site"
          : "Flexible"
    : "";

  // Load job data
  onMount(async () => {
    try {
      isLoading = true;
      job = await getJob(slug);
    } catch (err) {
      error = err.message || "Failed to load job";
      console.error(err);
    } finally {
      isLoading = false;
    }
  });

  // Toggle job save status
  async function toggleSaveJob() {
    if (!$authStore.user) {
      // Redirect to login if not authenticated
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    try {
      isSaving = true;
      if (job.hasSaved) {
        await unsaveJob(job.id);
      } else {
        await saveJob(job.id);
      }

      // Update local state
      job.hasSaved = !job.hasSaved;
    } catch (err) {
      console.error("Failed to toggle job save status:", err);
    } finally {
      isSaving = false;
    }
  }

  // Open apply modal
  function handleApply() {
    if (!$authStore.user) {
      // Redirect to login if not authenticated
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    showApplyModal = true;
  }

  // Handle application submission
  function handleApplicationSuccess() {
    // Update local state
    job.hasApplied = true;
    showApplyModal = false;
  }
</script>

<svelte:head>
  <title
    >{isLoading
      ? "Loading..."
      : job
        ? `${job.title} at ${job.company.name}`
        : "Job Not Found"} | Portfolia</title
  >
  <meta name="description" content={job?.shortDescription || "Job details"} />
</svelte:head>

<ApplyJobModal
  {job}
  open={showApplyModal}
  onClose={() => (showApplyModal = false)}
  onSuccess={handleApplicationSuccess}
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
      <h2 class="text-xl font-medium mb-2">Failed to Load Job</h2>
      <p class="text-neutral-600 mb-6">{error}</p>
      <Button href="/jobs" variant="primary">Go Back to Jobs</Button>
    </div>
  {:else if job}
    <!-- Back button -->
    <div class="mb-6">
      <Button href="/jobs" variant="ghost" size="sm">
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
        Back to Jobs
      </Button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main content -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <!-- Job header -->
          <div class="mb-6">
            <div class="flex items-start justify-between">
              <div>
                <h1 class="text-2xl font-bold text-neutral-900">{job.title}</h1>
                <div class="flex items-center mt-2">
                  <a
                    href={`/companies/${job.company.slug}`}
                    class="text-neutral-600 hover:text-primary-600"
                  >
                    {job.company.name}
                  </a>
                  {#if job.location}
                    <span class="mx-2 text-neutral-400">•</span>
                    <span class="text-neutral-600"
                      >{job.location.city}{job.location.state
                        ? `, ${job.location.state}`
                        : ""}</span
                    >
                  {:else if job.remotePolicy}
                    <span class="mx-2 text-neutral-400">•</span>
                    <span class="text-neutral-600">{formattedRemotePolicy}</span
                    >
                  {/if}
                </div>
              </div>

              {#if job.isFeatured}
                <Badge color="yellow">Featured</Badge>
              {/if}
            </div>

            <div class="flex flex-wrap gap-2 mt-4">
              <Badge color="neutral">{formattedEmploymentType}</Badge>
              <Badge color="neutral">{formattedExperienceLevel}</Badge>
              {#if job.showSalary && job.formattedSalary}
                <Badge color="green">{job.formattedSalary}</Badge>
              {/if}
            </div>

            <div class="text-sm text-neutral-500 mt-4">
              <p>
                Posted {formatDistanceToNow(new Date(job.publishedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          <!-- Applied notice -->
          {#if job.hasApplied}
            <AlertBox type="success" class="mb-6">
              <p class="text-sm">
                You've already applied to this job. You can check the status of
                your application in your dashboard.
              </p>
              <div class="mt-2">
                <Button
                  href="/account/applications"
                  variant="outline"
                  size="sm"
                >
                  View My Applications
                </Button>
              </div>
            </AlertBox>
          {/if}

          <!-- Description -->
          {#if job.description}
            <div class="mb-8">
              <h2 class="text-lg font-semibold mb-3">Job Description</h2>
              <div class="prose max-w-none">
                {job.description}
              </div>
            </div>
          {/if}

          <!-- Skills section -->
          {#if job.skills && job.skills.length > 0}
            <div class="mb-8">
              <h2 class="text-lg font-semibold mb-3">Required Skills</h2>
              <div class="flex flex-wrap gap-2">
                {#each job.skills as skill}
                  <span
                    class="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                  >
                    {skill.skillName}
                    {#if skill.yearsRequired}
                      <span class="text-neutral-500 text-xs"
                        >({skill.yearsRequired}+ years)</span
                      >
                    {/if}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Application instructions -->
          {#if job.applicationInstructions}
            <div class="mb-8">
              <h2 class="text-lg font-semibold mb-3">
                Application Instructions
              </h2>
              <div class="prose max-w-none">
                {job.applicationInstructions}
              </div>
            </div>
          {/if}

          <!-- Apply button -->
          <div class="mt-8">
            {#if job.hasApplied}
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
                  Applied
                </Button>

                <Button
                  variant={job.hasSaved ? "warning" : "outline"}
                  on:click={toggleSaveJob}
                  disabled={isSaving}
                >
                  {#if isSaving}
                    <LoadingSpinner size="sm" class="mr-2" />
                  {:else}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-2"
                      fill={job.hasSaved ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  {/if}
                  {job.hasSaved ? "Saved" : "Save Job"}
                </Button>
              </div>
            {:else if deadlinePassed}
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
                Application Deadline Passed
              </Button>
            {:else if job.applicationUrl}
              <div class="flex gap-4">
                <Button
                  variant="primary"
                  href={job.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-full"
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
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Apply on Company Site
                </Button>

                <Button
                  variant={job.hasSaved ? "warning" : "outline"}
                  on:click={toggleSaveJob}
                  disabled={isSaving}
                >
                  {#if isSaving}
                    <LoadingSpinner size="sm" class="mr-2" />
                  {:else}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-2"
                      fill={job.hasSaved ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  {/if}
                  {job.hasSaved ? "Saved" : "Save Job"}
                </Button>
              </div>
            {:else}
              <div class="flex gap-4">
                <Button variant="primary" class="w-full" on:click={handleApply}>
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
                  Apply Now
                </Button>

                <Button
                  variant={job.hasSaved ? "warning" : "outline"}
                  on:click={toggleSaveJob}
                  disabled={isSaving}
                >
                  {#if isSaving}
                    <LoadingSpinner size="sm" class="mr-2" />
                  {:else}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-2"
                      fill={job.hasSaved ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  {/if}
                  {job.hasSaved ? "Saved" : "Save Job"}
                </Button>
              </div>
            {/if}
          </div>
        </div>

        <!-- Similar jobs -->
        <SimilarJobs
          companyId={job.companyId}
          jobId={job.id}
          skills={job.skills?.map((s) => s.skillName) || []}
        />
      </div>

      <!-- Sidebar -->
      <div class="lg:col-span-1">
        <!-- Company card -->
        <div class="bg-white rounded-lg shadow mb-6">
          <div class="p-6">
            <div class="flex items-center mb-4">
              {#if job.company.logoUrl}
                <div
                  class="w-12 h-12 mr-3 rounded overflow-hidden border border-neutral-200"
                >
                  <img
                    src={job.company.logoUrl}
                    alt={job.company.name}
                    class="w-full h-full object-contain"
                  />
                </div>
              {:else}
                <div
                  class="w-12 h-12 mr-3 rounded bg-primary-100 flex items-center justify-center text-primary-700 font-bold"
                >
                  {companyInitials}
                </div>
              {/if}
              <div>
                <h3 class="font-medium">{job.company.name}</h3>
                {#if job.company.verificationStatus === "verified"}
                  <div class="flex items-center text-blue-600 text-xs">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3.5 w-3.5 mr-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Verified
                  </div>
                {/if}
              </div>
            </div>

            <Button
              href={`/companies/${job.company.slug}`}
              variant="outline"
              size="sm"
              fullWidth
            >
              View Company Profile
            </Button>
          </div>
        </div>

        <!-- Job details -->
        <div class="bg-white rounded-lg shadow">
          <div class="p-6">
            <h3 class="font-medium mb-4">Job Details</h3>

            <div class="space-y-4 text-sm">
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
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="font-medium">Job Type</div>
                  <div class="text-neutral-600">{formattedEmploymentType}</div>
                </div>
              </div>

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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="font-medium">Experience Level</div>
                  <div class="text-neutral-600">{formattedExperienceLevel}</div>
                </div>
              </div>

              {#if job.remotePolicy}
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
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  </div>
                  <div>
                    <div class="font-medium">Work Location</div>
                    <div class="text-neutral-600">{formattedRemotePolicy}</div>
                  </div>
                </div>
              {/if}

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

              {#if job.applicationDeadline}
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
                    <div class="font-medium">Application Deadline</div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
