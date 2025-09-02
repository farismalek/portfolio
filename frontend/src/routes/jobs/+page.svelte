<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { page } from "$app/stores";
  import { jobsStore } from "$lib/stores/jobsStore";
  import { authStore } from "$lib/stores/authStore";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import JobCard from "$lib/components/jobs/JobCard.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import SearchInput from "$lib/components/common/SearchInput.svelte";
  import FilterPanel from "$lib/components/common/FilterPanel.svelte";
  import FilterItem from "$lib/components/common/FilterItem.svelte";
  import RangeSlider from "$lib/components/common/RangeSlider.svelte";

  let isLoading = true;
  let searchQuery = "";
  let selectedEmploymentTypes = [];
  let selectedExperienceLevels = [];
  let remoteOnly = false;
  let salaryRange = [0, 300000];
  let featuredOnly = false;
  let recentOnly = false;
  let selectedCompanyId = "";

  // Pagination
  let currentPage = 1;
  const pageSize = 12;

  // Get query params from URL
  $: {
    const params = $page.url.searchParams;
    searchQuery = params.get("search") || "";
    remoteOnly = params.get("remote") === "true";
    featuredOnly = params.get("featured") === "true";
    recentOnly = params.get("recent") === "true";
    selectedCompanyId = params.get("companyId") || "";

    const empTypes = params.get("employmentTypes");
    selectedEmploymentTypes = empTypes ? empTypes.split(",") : [];

    const expLevels = params.get("experienceLevels");
    selectedExperienceLevels = expLevels ? expLevels.split(",") : [];

    // Get salary range if defined
    const minSalary = params.get("minSalary");
    const maxSalary = params.get("maxSalary");

    if (minSalary !== null && maxSalary !== null) {
      salaryRange = [parseInt(minSalary), parseInt(maxSalary)];
    }

    currentPage = parseInt(params.get("page") || "1");
  }

  // Load data
  onMount(async () => {
    await loadJobs();
  });

  // Function to load jobs with filters
  async function loadJobs() {
    isLoading = true;

    try {
      await jobsStore.fetchJobs({
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        employmentType: selectedEmploymentTypes,
        experienceLevel: selectedExperienceLevels,
        remote: remoteOnly ? "true" : undefined,
        minSalary: salaryRange[0] > 0 ? salaryRange[0] : undefined,
        maxSalary: salaryRange[1] < 300000 ? salaryRange[1] : undefined,
        featuredOnly: featuredOnly ? "true" : undefined,
        recent: recentOnly ? "true" : undefined,
        companyId: selectedCompanyId || undefined,
      });
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      isLoading = false;
    }
  }

  // Update URL with filter params
  function updateUrlParams() {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set("search", searchQuery);
    }

    if (remoteOnly) {
      params.set("remote", "true");
    }

    if (featuredOnly) {
      params.set("featured", "true");
    }

    if (recentOnly) {
      params.set("recent", "true");
    }

    if (selectedEmploymentTypes.length > 0) {
      params.set("employmentTypes", selectedEmploymentTypes.join(","));
    }

    if (selectedExperienceLevels.length > 0) {
      params.set("experienceLevels", selectedExperienceLevels.join(","));
    }

    if (salaryRange[0] > 0) {
      params.set("minSalary", salaryRange[0].toString());
    }

    if (salaryRange[1] < 300000) {
      params.set("maxSalary", salaryRange[1].toString());
    }

    if (selectedCompanyId) {
      params.set("companyId", selectedCompanyId);
    }

    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    }

    const url = params.toString() ? `?${params.toString()}` : "";
    history.replaceState(null, "", `/jobs${url}`);
  }

  // Handle search
  function handleSearch() {
    currentPage = 1; // Reset to page 1 on new search
    updateUrlParams();
    loadJobs();
  }

  // Handle filter changes
  function handleFilterChange() {
    currentPage = 1; // Reset to page 1 on filter change
    updateUrlParams();
    loadJobs();
  }

  // Handle page change
  function changePage(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return;
    currentPage = newPage;
    updateUrlParams();
    loadJobs();
    // Scroll to top
    window.scrollTo(0, 0);
  }

  // Employment type options
  const employmentTypes = [
    { id: "full_time", label: "Full-time" },
    { id: "part_time", label: "Part-time" },
    { id: "contract", label: "Contract" },
    { id: "temporary", label: "Temporary" },
    { id: "internship", label: "Internship" },
    { id: "volunteer", label: "Volunteer" },
  ];

  // Experience level options
  const experienceLevels = [
    { id: "entry", label: "Entry Level" },
    { id: "associate", label: "Associate" },
    { id: "mid_level", label: "Mid-Level" },
    { id: "senior", label: "Senior" },
    { id: "director", label: "Director" },
    { id: "executive", label: "Executive" },
  ];

  // Format salary for display
  function formatSalary(value) {
    return value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${value}`;
  }

  // Calculate total pages
  $: totalPages = Math.ceil(($jobsStore.totalCount || 0) / pageSize);
  $: pageItems = Array.from({ length: totalPages }, (_, i) => i + 1);
  $: visiblePageItems = pageItems
    .filter(
      (p) =>
        p === 1 ||
        p === totalPages ||
        (p >= currentPage - 2 && p <= currentPage + 2),
    )
    .reduce((acc, page, i, arr) => {
      if (i > 0 && page - arr[i - 1] > 1) {
        acc.push("...");
      }
      acc.push(page);
      return acc;
    }, []);
</script>

<svelte:head>
  <title>Jobs | Portfolia</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <PageHeader
    title="Jobs"
    description="Find your next role from thousands of opportunities"
  >
    {#if $authStore.user}
      <Button href="/jobs/create" variant="primary">
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
        Post a Job
      </Button>
    {/if}
  </PageHeader>

  <div class="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
    <!-- Filters Sidebar -->
    <div class="lg:col-span-1">
      <div class="bg-white rounded-lg shadow p-4 sticky top-8">
        <h3 class="text-lg font-medium mb-4">Filters</h3>

        <!-- Search -->
        <div class="mb-6">
          <SearchInput
            bind:value={searchQuery}
            placeholder="Search jobs"
            on:search={handleSearch}
          />
        </div>

        <!-- Employment Type Filter -->
        <FilterPanel title="Employment Type">
          {#each employmentTypes as type}
            <FilterItem
              type="checkbox"
              label={type.label}
              checked={selectedEmploymentTypes.includes(type.id)}
              on:change={() => {
                if (selectedEmploymentTypes.includes(type.id)) {
                  selectedEmploymentTypes = selectedEmploymentTypes.filter(
                    (t) => t !== type.id,
                  );
                } else {
                  selectedEmploymentTypes = [
                    ...selectedEmploymentTypes,
                    type.id,
                  ];
                }
                handleFilterChange();
              }}
            />
          {/each}
        </FilterPanel>

        <!-- Experience Level Filter -->
        <FilterPanel title="Experience Level">
          {#each experienceLevels as level}
            <FilterItem
              type="checkbox"
              label={level.label}
              checked={selectedExperienceLevels.includes(level.id)}
              on:change={() => {
                if (selectedExperienceLevels.includes(level.id)) {
                  selectedExperienceLevels = selectedExperienceLevels.filter(
                    (l) => l !== level.id,
                  );
                } else {
                  selectedExperienceLevels = [
                    ...selectedExperienceLevels,
                    level.id,
                  ];
                }
                handleFilterChange();
              }}
            />
          {/each}
        </FilterPanel>

        <!-- Salary Range -->
        <FilterPanel title="Salary Range">
          <div class="px-2">
            <RangeSlider
              min={0}
              max={300000}
              step={5000}
              formatValue={formatSalary}
              bind:values={salaryRange}
              on:change={handleFilterChange}
            />
          </div>
        </FilterPanel>

        <!-- Other Filters -->
        <FilterPanel title="Other Filters">
          <FilterItem
            type="checkbox"
            label="Remote Only"
            checked={remoteOnly}
            on:change={() => {
              remoteOnly = !remoteOnly;
              handleFilterChange();
            }}
          />

          <FilterItem
            type="checkbox"
            label="Featured Jobs"
            checked={featuredOnly}
            on:change={() => {
              featuredOnly = !featuredOnly;
              handleFilterChange();
            }}
          />

          <FilterItem
            type="checkbox"
            label="Posted Last 7 Days"
            checked={recentOnly}
            on:change={() => {
              recentOnly = !recentOnly;
              handleFilterChange();
            }}
          />
        </FilterPanel>

        <!-- Clear Filters -->
        {#if searchQuery || selectedEmploymentTypes.length > 0 || selectedExperienceLevels.length > 0 || remoteOnly || featuredOnly || recentOnly || salaryRange[0] > 0 || salaryRange[1] < 300000}
          <div class="mt-6">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              on:click={() => {
                searchQuery = "";
                selectedEmploymentTypes = [];
                selectedExperienceLevels = [];
                remoteOnly = false;
                featuredOnly = false;
                recentOnly = false;
                salaryRange = [0, 300000];
                handleFilterChange();
              }}
            >
              Clear All Filters
            </Button>
          </div>
        {/if}
      </div>
    </div>

    <!-- Main Content -->
    <div class="lg:col-span-3">
      {#if isLoading}
        <div class="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      {:else if $jobsStore.jobs.length === 0}
        <div class="bg-white rounded-lg shadow p-8 text-center">
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
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h2 class="mt-4 text-xl font-medium text-neutral-900">
            No jobs found
          </h2>
          <p class="mt-2 text-neutral-600 max-w-md mx-auto">
            {#if searchQuery || selectedEmploymentTypes.length > 0 || selectedExperienceLevels.length > 0 || remoteOnly || featuredOnly || recentOnly || salaryRange[0] > 0 || salaryRange[1] < 300000}
              Try adjusting your search filters to find more results.
            {:else}
              There are currently no job listings available.
            {/if}
          </p>

          {#if $authStore.user}
            <div class="mt-6">
              <Button href="/jobs/create" variant="primary">Post a Job</Button>
            </div>
          {/if}
        </div>
      {:else}
        <!-- Facet information -->
        <div class="flex flex-wrap items-center justify-between mb-6">
          <div>
            <p class="text-neutral-500">
              {$jobsStore.totalCount}
              {$jobsStore.totalCount === 1 ? "job" : "jobs"} found
              {#if searchQuery}
                for <span class="font-medium">"{searchQuery}"</span>
              {/if}
            </p>
          </div>

          {#if $authStore.user}
            <Button href="/jobs/create" variant="outline" size="sm">
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Post a Job
            </Button>
          {/if}
        </div>

        <!-- Job Results -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each $jobsStore.jobs as job (job.id)}
            <div transition:fade={{ duration: 200 }}>
              <JobCard {job} />
            </div>
          {/each}
        </div>

        <!-- Pagination -->
        {#if totalPages > 1}
          <div class="flex justify-center mt-8">
            <nav class="inline-flex rounded-md shadow">
              <button
                class="px-3 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50"
                on:click={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              {#each visiblePageItems as item}
                {#if item === "..."}
                  <span
                    class="px-3 py-2 border border-neutral-300 bg-white text-sm font-medium text-neutral-500"
                    >...</span
                  >
                {:else}
                  <button
                    class="px-3 py-2 border border-neutral-300 text-sm font-medium
                      {item === currentPage
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white text-neutral-500 hover:bg-neutral-50'}"
                    on:click={() => changePage(item)}
                  >
                    {item}
                  </button>
                {/if}
              {/each}

              <button
                class="px-3 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50"
                on:click={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </nav>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
