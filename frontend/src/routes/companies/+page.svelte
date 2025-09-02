<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { page } from "$app/stores";
  import { companiesStore } from "$lib/stores/companiesStore";
  import { authStore } from "$lib/stores/authStore";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import CompanyCard from "$lib/components/companies/CompanyCard.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import SearchInput from "$lib/components/common/SearchInput.svelte";
  import FilterPanel from "$lib/components/common/FilterPanel.svelte";
  import FilterItem from "$lib/components/common/FilterItem.svelte";

  let isLoading = true;
  let searchQuery = "";
  let selectedIndustries = [];
  let verifiedOnly = false;

  // Pagination
  let currentPage = 1;
  const pageSize = 12;

  // Get query params from URL
  $: {
    const params = $page.url.searchParams;
    searchQuery = params.get("search") || "";
    verifiedOnly = params.get("verified") === "true";
    const industries = params.get("industries");
    selectedIndustries = industries ? industries.split(",") : [];
    currentPage = parseInt(params.get("page") || "1");
  }

  // Load data
  onMount(async () => {
    await loadCompanies();
  });

  // Function to load companies with filters
  async function loadCompanies() {
    isLoading = true;

    try {
      await companiesStore.fetchCompanies({
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        industry:
          selectedIndustries.length > 0 ? selectedIndustries[0] : undefined,
        verificationStatus: verifiedOnly ? "verified" : undefined,
      });
    } catch (error) {
      console.error("Error loading companies:", error);
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

    if (verifiedOnly) {
      params.set("verified", "true");
    }

    if (selectedIndustries.length > 0) {
      params.set("industries", selectedIndustries.join(","));
    }

    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    }

    const url = params.toString() ? `?${params.toString()}` : "";
    history.replaceState(null, "", `/companies${url}`);
  }

  // Handle search
  function handleSearch() {
    currentPage = 1; // Reset to page 1 on new search
    updateUrlParams();
    loadCompanies();
  }

  // Handle filter changes
  function handleFilterChange() {
    currentPage = 1; // Reset to page 1 on filter change
    updateUrlParams();
    loadCompanies();
  }

  // Handle page change
  function changePage(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return;
    currentPage = newPage;
    updateUrlParams();
    loadCompanies();
    // Scroll to top
    window.scrollTo(0, 0);
  }

  // Get industry list (normally would come from an API)
  const industries = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Manufacturing",
    "Retail",
    "Media & Entertainment",
    "Construction",
    "Hospitality",
  ];

  // Calculate total pages
  $: totalPages = Math.ceil(($companiesStore.totalCount || 0) / pageSize);
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
  <title>Companies | Portfolia</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <PageHeader
    title="Companies"
    description="Discover organizations looking for talented professionals like you"
  >
    {#if $authStore.user}
      <Button href="/companies/create" variant="primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        Register Company
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
            placeholder="Search companies"
            on:search={handleSearch}
          />
        </div>

        <!-- Industry Filter -->
        <FilterPanel title="Industries">
          {#each industries as industry}
            <FilterItem
              type="checkbox"
              label={industry}
              checked={selectedIndustries.includes(industry)}
              on:change={() => {
                if (selectedIndustries.includes(industry)) {
                  selectedIndustries = selectedIndustries.filter(
                    (i) => i !== industry,
                  );
                } else {
                  selectedIndustries = [...selectedIndustries, industry];
                }
                handleFilterChange();
              }}
            />
          {/each}
        </FilterPanel>

        <!-- Verification Filter -->
        <FilterPanel title="Verification">
          <FilterItem
            type="checkbox"
            label="Verified Companies Only"
            checked={verifiedOnly}
            on:change={() => {
              verifiedOnly = !verifiedOnly;
              handleFilterChange();
            }}
          />
        </FilterPanel>

        <!-- Clear Filters -->
        {#if searchQuery || selectedIndustries.length > 0 || verifiedOnly}
          <div class="mt-6">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              on:click={() => {
                searchQuery = "";
                selectedIndustries = [];
                verifiedOnly = false;
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
      {:else if $companiesStore.companies.length === 0}
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h2 class="mt-4 text-xl font-medium text-neutral-900">
            No companies found
          </h2>
          <p class="mt-2 text-neutral-600">
            {#if searchQuery || selectedIndustries.length > 0 || verifiedOnly}
              Try adjusting your search filters to find more results.
            {:else}
              There are currently no registered companies.
            {/if}
          </p>
        </div>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each $companiesStore.companies as company (company.id)}
            <div transition:fade={{ duration: 200 }}>
              <CompanyCard {company} />
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
