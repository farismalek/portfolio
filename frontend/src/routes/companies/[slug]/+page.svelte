<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { fade } from "svelte/transition";
  import { getCompany } from "$lib/services/companyService";
  import { authStore } from "$lib/stores/authStore";
  import Button from "$lib/components/common/Button.svelte";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import Badge from "$lib/components/common/Badge.svelte";
  import Avatar from "$lib/components/common/Avatar.svelte";
  import JobCard from "$lib/components/jobs/JobCard.svelte";
  import { getJobs } from "$lib/services/jobService";
  import { getInitials } from "$lib/utils/stringUtils";

  let isLoading = true;
  let company = null;
  let error = null;

  let activeTab = "about";
  let jobsLoading = false;
  let jobs = [];
  let totalJobs = 0;

  // Get company slug from URL
  $: slug = $page.params.slug;

  onMount(async () => {
    try {
      isLoading = true;
      company = await getCompany(slug);
    } catch (err) {
      error = err.message || "Failed to load company";
    } finally {
      isLoading = false;
    }

    if (activeTab === "jobs") {
      loadJobs();
    }
  });

  async function loadJobs() {
    if (!company) return;

    try {
      jobsLoading = true;
      const response = await getJobs({
        companyId: company.id,
        page: 1,
        limit: 9,
      });
      jobs = response.items;
      totalJobs = response.totalCount;
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      jobsLoading = false;
    }
  }

  function handleTabChange(newTab) {
    activeTab = newTab;

    if (newTab === "jobs" && jobs.length === 0) {
      loadJobs();
    }
  }
</script>

<svelte:head>
  <title
    >{isLoading ? "Loading..." : company ? company.name : "Company Not Found"} |
    Portfolia</title
  >
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {#if isLoading}
    <div class="flex justify-center py-16">
      <LoadingSpinner />
    </div>
  {:else if error}
    <div class="bg-white rounded-lg shadow-sm p-8 text-center">
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
      <h2 class="text-xl font-medium mb-2">Failed to Load Company</h2>
      <p class="text-neutral-600 mb-6">{error}</p>
      <Button href="/companies" variant="primary">Go Back to Companies</Button>
    </div>
  {:else if company}
    <!-- Company Header -->
    <div class="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      <!-- Cover Image -->
      <div
        class="h-48 bg-gradient-to-r from-primary-600 to-primary-800 relative"
      >
        {#if company.coverImageUrl}
          <img
            src={company.coverImageUrl}
            alt={company.name}
            class="w-full h-full object-cover"
          />
        {/if}
      </div>

      <div class="relative px-6 pb-6">
        <!-- Logo -->
        <div class="absolute -top-16 left-6 w-32 h-32">
          <div
            class="rounded-lg bg-white shadow-lg p-2 w-full h-full flex items-center justify-center overflow-hidden"
          >
            {#if company.logoUrl}
              <img
                src={company.logoUrl}
                alt={company.name}
                class="max-w-full max-h-full object-contain"
              />
            {:else}
              <div
                class="w-full h-full rounded-md bg-primary-100 flex items-center justify-center text-primary-700 text-4xl font-bold"
              >
                {getInitials(company.name)}
              </div>
            {/if}
          </div>
        </div>

        <!-- Company Info -->
        <div class="mt-20">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center">
                <h1 class="text-3xl font-bold text-neutral-900">
                  {company.name}
                </h1>
                {#if company.verificationStatus === "verified"}
                  <Badge color="blue" class="ml-3" title="Verified Company">
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Verified
                  </Badge>
                {/if}
              </div>

              {#if company.industry}
                <p class="text-neutral-500 mt-1">{company.industry}</p>
              {/if}

              <div class="flex items-center mt-4 space-x-6 text-sm">
                {#if company.websiteUrl}
                  <a
                    href={company.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center text-neutral-500 hover:text-primary-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                    Website
                  </a>
                {/if}

                {#if company.headquarters}
                  <div class="flex items-center text-neutral-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-1"
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
                    {company.headquarters}
                  </div>
                {/if}

                {#if company.foundedYear}
                  <div class="flex items-center text-neutral-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-1"
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
                    Founded {company.foundedYear}
                  </div>
                {/if}

                {#if company.size}
                  <div class="flex items-center text-neutral-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {company.size} employees
                  </div>
                {/if}
              </div>
            </div>

            <div class="flex space-x-3">
              {#if company.canEdit}
                <Button
                  href={`/companies/${company.slug}/edit`}
                  variant="outline"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-1"
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
                  Edit Company
                </Button>
                <Button
                  href={`/jobs/create?company=${company.id}`}
                  variant="primary"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-1"
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
                  Post a Job
                </Button>
              {:else if $authStore.user}
                <Button
                  variant="primary"
                  href={`/messages/new?to=${company.primaryAdmin?.id || ""}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-1"
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
                  Contact
                </Button>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <Tabs
      tabs={[
        { id: "about", label: "About" },
        { id: "jobs", label: `Jobs (${company.jobCount || 0})` },
        { id: "team", label: "Team" },
      ]}
      bind:activeTab
      on:change={(e) => handleTabChange(e.detail)}
    />

    <!-- Tab Content -->
    <div class="mt-6 bg-white rounded-lg shadow-sm p-6">
      {#if activeTab === "about"}
        <div transition:fade={{ duration: 150 }}>
          <h2 class="text-xl font-medium mb-4">About {company.name}</h2>

          {#if company.description}
            <div class="prose max-w-none">
              {company.description}
            </div>
          {:else}
            <p class="text-neutral-500">No company description available.</p>
          {/if}

          {#if company.benefits && Object.keys(company.benefits).length > 0}
            <div class="mt-8">
              <h3 class="text-lg font-medium mb-3">Benefits & Perks</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {#each Object.entries(company.benefits) as [category, items]}
                  <div class="border border-neutral-200 rounded-md p-4">
                    <h4 class="font-medium text-neutral-900 mb-2">
                      {category}
                    </h4>
                    <ul class="list-disc pl-5 text-neutral-600">
                      {#each items as item}
                        <li>{item}</li>
                      {/each}
                    </ul>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if company.locations && company.locations.length > 0}
            <div class="mt-8">
              <h3 class="text-lg font-medium mb-3">Locations</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {#each company.locations as location}
                  <div class="border border-neutral-200 rounded-md p-4">
                    <h4 class="font-medium text-neutral-900">
                      {location.name}
                    </h4>
                    <p class="text-neutral-600 text-sm mt-1">
                      {location.addressLine1
                        ? `${location.addressLine1}, `
                        : ""}
                      {location.city ? `${location.city}, ` : ""}
                      {location.state || ""}
                      {location.country ? `, ${location.country}` : ""}
                    </p>
                    {#if location.isHeadquarters}
                      <Badge color="blue" class="mt-2">Headquarters</Badge>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {:else if activeTab === "jobs"}
        <div transition:fade={{ duration: 150 }}>
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-medium">Open Positions</h2>

            {#if company.canEdit}
              <Button
                href={`/jobs/create?company=${company.id}`}
                variant="primary"
                size="sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-1"
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
                Post a Job
              </Button>
            {/if}
          </div>

          {#if jobsLoading}
            <div class="py-12 flex justify-center">
              <LoadingSpinner />
            </div>
          {:else if jobs.length === 0}
            <div class="border border-neutral-200 rounded-lg p-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12 mx-auto text-neutral-400"
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
              <h3 class="mt-4 text-lg font-medium">No open positions</h3>
              <p class="mt-2 text-neutral-500">
                {company.name} doesn't have any job openings right now.
              </p>
              {#if company.canEdit}
                <div class="mt-4">
                  <Button
                    href={`/jobs/create?company=${company.id}`}
                    variant="primary"
                  >
                    Post a Job
                  </Button>
                </div>
              {/if}
            </div>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {#each jobs as job (job.id)}
                <JobCard {job} />
              {/each}
            </div>

            {#if totalJobs > jobs.length}
              <div class="mt-8 text-center">
                <Button
                  href={`/jobs?companyId=${company.id}`}
                  variant="outline"
                >
                  View All {totalJobs} Jobs
                </Button>
              </div>
            {/if}
          {/if}
        </div>
      {:else if activeTab === "team"}
        <div transition:fade={{ duration: 150 }}>
          <h2 class="text-xl font-medium mb-6">Team</h2>

          {#if company.admins && company.admins.length > 0}
            <div
              class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {#each company.admins as admin}
                <div
                  class="flex flex-col items-center p-4 border border-neutral-200 rounded-lg"
                >
                  <Avatar
                    src={admin.user?.profiles?.[0]?.avatarUrl}
                    alt={admin.user?.fullName || admin.user?.username}
                    size="lg"
                    className="mb-3"
                  />
                  <h3 class="font-medium text-neutral-900">
                    {admin.user?.fullName || admin.user?.username}
                  </h3>
                  <p class="text-sm text-neutral-500">
                    {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                    {#if admin.isPrimary}
                      <span class="text-primary-600">(Primary)</span>
                    {/if}
                  </p>
                  <div class="mt-3 w-full">
                    <Button
                      href={`/profiles/${admin.user?.username}`}
                      variant="outline"
                      size="sm"
                      fullWidth
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-neutral-500">No team members to display.</p>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
