<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { page } from "$app/stores";
  import { freelanceProjectsStore } from "$lib/stores/freelanceProjectsStore";
  import { authStore } from "$lib/stores/authStore";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import ProjectCard from "$lib/components/freelance/ProjectCard.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import SearchInput from "$lib/components/common/SearchInput.svelte";
  import FilterPanel from "$lib/components/common/FilterPanel.svelte";
  import FilterItem from "$lib/components/common/FilterItem.svelte";
  import RangeSlider from "$lib/components/common/RangeSlider.svelte";

  let isLoading = true;
  let searchQuery = "";
  let selectedCategories = [];
  let selectedComplexities = [];
  let selectedDurations = [];
  let budgetRange = [0, 10000];

  // Pagination
  let currentPage = 1;
  const pageSize = 12;

  // Get query params from URL
  $: {
    const params = $page.url.searchParams;
    searchQuery = params.get("search") || "";

    const categories = params.get("categories");
    selectedCategories = categories ? categories.split(",") : [];

    const complexities = params.get("complexities");
    selectedComplexities = complexities ? complexities.split(",") : [];

    const durations = params.get("durations");
    selectedDurations = durations ? durations.split(",") : [];

    // Get budget range if defined
    const minBudget = params.get("minBudget");
    const maxBudget = params.get("maxBudget");

    if (minBudget !== null && maxBudget !== null) {
      budgetRange = [parseInt(minBudget), parseInt(maxBudget)];
    }

    currentPage = parseInt(params.get("page") || "1");
  }

  // Load data
  onMount(async () => {
    await loadProjects();
  });

  // Function to load projects with filters
  async function loadProjects() {
    isLoading = true;

    try {
      await freelanceProjectsStore.fetchProjects({
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        category:
          selectedCategories.length > 0 ? selectedCategories : undefined,
        complexity:
          selectedComplexities.length > 0 ? selectedComplexities : undefined,
        duration: selectedDurations.length > 0 ? selectedDurations : undefined,
        budgetMin: budgetRange[0] > 0 ? budgetRange[0] : undefined,
        budgetMax: budgetRange[1] < 10000 ? budgetRange[1] : undefined,
      });
    } catch (error) {
      console.error("Error loading projects:", error);
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

    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }

    if (selectedComplexities.length > 0) {
      params.set("complexities", selectedComplexities.join(","));
    }

    if (selectedDurations.length > 0) {
      params.set("durations", selectedDurations.join(","));
    }

    if (budgetRange[0] > 0) {
      params.set("minBudget", budgetRange[0].toString());
    }

    if (budgetRange[1] < 10000) {
      params.set("maxBudget", budgetRange[1].toString());
    }

    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    }

    const url = params.toString() ? `?${params.toString()}` : "";
    history.replaceState(null, "", `/freelance${url}`);
  }

  // Handle search
  function handleSearch() {
    currentPage = 1; // Reset to page 1 on new search
    updateUrlParams();
    loadProjects();
  }

  // Handle filter changes
  function handleFilterChange() {
    currentPage = 1; // Reset to page 1 on filter change
    updateUrlParams();
    loadProjects();
  }

  // Handle page change
  function changePage(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return;
    currentPage = newPage;
    updateUrlParams();
    loadProjects();
    // Scroll to top
    window.scrollTo(0, 0);
  }

  // Project categories
  const categories = [
    "Web Development",
    "Mobile App Development",
    "UI/UX Design",
    "Graphic Design",
    "Content Writing",
    "Marketing",
    "SEO",
    "Data Science",
    "Video Production",
    "Translation",
  ];

  // Project complexity levels
  const complexityLevels = [
    { id: "basic", label: "Basic" },
    { id: "intermediate", label: "Intermediate" },
    { id: "expert", label: "Expert" },
  ];

  // Project durations
  const durations = [
    { id: "less_than_1_month", label: "Less than 1 month" },
    { id: "1_to_3_months", label: "1 to 3 months" },
    { id: "3_to_6_months", label: "3 to 6 months" },
    { id: "more_than_6_months", label: "More than 6 months" },
  ];

  // Format budget for display
  function formatBudget(value) {
    return value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${value}`;
  }

  // Calculate total pages
  $: totalPages = Math.ceil(
    ($freelanceProjectsStore.totalCount || 0) / pageSize,
  );
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
  <title>Freelance Projects | Portfolia</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <PageHeader
    title="Freelance Projects"
    description="Find freelance projects and opportunities that match your skills"
  >
    {#if $authStore.user}
      <Button href="/freelance/projects/create" variant="primary">
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
        Post a Project
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
            placeholder="Search projects"
            on:search={handleSearch}
          />
        </div>

        <!-- Category Filter -->
        <FilterPanel title="Categories">
          {#each categories as category}
            <FilterItem
              type="checkbox"
              label={category}
              checked={selectedCategories.includes(category)}
              on:change={() => {
                if (selectedCategories.includes(category)) {
                  selectedCategories = selectedCategories.filter(
                    (c) => c !== category,
                  );
                } else {
                  selectedCategories = [...selectedCategories, category];
                }
                handleFilterChange();
              }}
            />
          {/each}
        </FilterPanel>

        <!-- Complexity Filter -->
        <FilterPanel title="Complexity">
          {#each complexityLevels as level}
            <FilterItem
              type="checkbox"
              label={level.label}
              checked={selectedComplexities.includes(level.id)}
              on:change={() => {
                if (selectedComplexities.includes(level.id)) {
                  selectedComplexities = selectedComplexities.filter(
                    (c) => c !== level.id,
                  );
                } else {
                  selectedComplexities = [...selectedComplexities, level.id];
                }
                handleFilterChange();
              }}
            />
          {/each}
        </FilterPanel>

        <!-- Duration Filter -->
        <FilterPanel title="Duration">
          {#each durations as duration}
            <FilterItem
              type="checkbox"
              label={duration.label}
              checked={selectedDurations.includes(duration.id)}
              on:change={() => {
                if (selectedDurations.includes(duration.id)) {
                  selectedDurations = selectedDurations.filter(
                    (d) => d !== duration.id,
                  );
                } else {
                  selectedDurations = [...selectedDurations, duration.id];
                }
                handleFilterChange();
              }}
            />
          {/each}
        </FilterPanel>

        <!-- Budget Range -->
        <FilterPanel title="Budget Range">
          <div class="px-2">
            <RangeSlider
              min={0}
              max={10000}
              step={500}
              formatValue={formatBudget}
              bind:values={budgetRange}
              on:change={handleFilterChange}
            />
          </div>
        </FilterPanel>

        <!-- Clear Filters -->
        {#if searchQuery || selectedCategories.length > 0 || selectedComplexities.length > 0 || selectedDurations.length > 0 || budgetRange[0] > 0 || budgetRange[1] < 10000}
          <div class="mt-6">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              on:click={() => {
                searchQuery = "";
                selectedCategories = [];
                selectedComplexities = [];
                selectedDurations = [];
                budgetRange = [0, 10000];
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
      {:else if $freelanceProjectsStore.projects.length === 0}
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h2 class="mt-4 text-xl font-medium text-neutral-900">
            No projects found
          </h2>
          <p class="mt-2 text-neutral-600 max-w-md mx-auto">
            {#if searchQuery || selectedCategories.length > 0 || selectedComplexities.length > 0 || selectedDurations.length > 0 || budgetRange[0] > 0 || budgetRange[1] < 10000}
              Try adjusting your search filters to find more results.
            {:else}
              There are currently no project listings available.
            {/if}
          </p>

          {#if $authStore.user}
            <div class="mt-6">
              <Button href="/freelance/projects/create" variant="primary">
                Post a Project
              </Button>
            </div>
          {/if}
        </div>
      {:else}
        <!-- Facet information -->
        <div class="flex flex-wrap items-center justify-between mb-6">
          <div>
            <p class="text-neutral-500">
              {$freelanceProjectsStore.totalCount}
              {$freelanceProjectsStore.totalCount === 1
                ? "project"
                : "projects"} found
              {#if searchQuery}
                for <span class="font-medium">"{searchQuery}"</span>
              {/if}
            </p>
          </div>

          {#if $authStore.user}
            <Button
              href="/freelance/projects/create"
              variant="outline"
              size="sm"
            >
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
              Post a Project
            </Button>
          {/if}
        </div>

        <!-- Project Results -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each $freelanceProjectsStore.projects as project (project.id)}
            <div transition:fade={{ duration: 200 }}>
              <ProjectCard {project} />
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
