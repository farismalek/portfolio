<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    fetchTemplates,
    createPortfolio,
  } from "$lib/services/portfolioService";
  import Button from "$lib/components/common/Button.svelte";
  import Input from "$lib/components/common/Input.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import type { Template, TemplateCategory } from "$lib/types/portfolio";

  // State
  let templates: Template[] = [];
  let selectedTemplate: Template | null = null;
  let isLoading = true;
  let error: string | null = null;
  let filterCategory: TemplateCategory | "all" = "all";
  let searchQuery = "";
  let portfolioTitle = "";
  let portfolioDescription = "";
  let isCreating = false;

  // Available categories
  const categories = [
    { id: "all", label: "All Templates" },
    { id: "professional", label: "Professional" },
    { id: "creative", label: "Creative" },
    { id: "minimal", label: "Minimal" },
    { id: "tech", label: "Tech" },
    { id: "design", label: "Design" },
    { id: "photography", label: "Photography" },
    { id: "business", label: "Business" },
  ];

  // Load templates
  onMount(async () => {
    try {
      templates = await fetchTemplates();
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  });

  // Filter templates by category and search query
  $: filteredTemplates = templates
    .filter(
      (template) =>
        filterCategory === "all" || template.category === filterCategory,
    )
    .filter((template) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        (template.description || "").toLowerCase().includes(query)
      );
    });

  // Select a template
  function selectTemplate(template: Template) {
    selectedTemplate = template;

    // Suggest a name based on template if no name has been entered yet
    if (!portfolioTitle) {
      portfolioTitle = `My ${template.name} Portfolio`;
    }

    // Scroll to the form
    setTimeout(() => {
      document.getElementById("portfolio-details")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  // Go back to template selection
  function goBackToTemplates() {
    selectedTemplate = null;

    // Scroll back to templates
    setTimeout(() => {
      document.getElementById("templates-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  // Create the portfolio
  async function handleCreatePortfolio() {
    if (!selectedTemplate) {
      error = "Please select a template";
      return;
    }

    if (!portfolioTitle.trim()) {
      error = "Please enter a portfolio title";
      return;
    }

    isCreating = true;
    error = null;

    try {
      const portfolio = await createPortfolio({
        title: portfolioTitle.trim(),
        description: portfolioDescription.trim() || undefined,
        templateId: selectedTemplate.id,
      });

      // Navigate to the editor
      goto(`/portfolios/${portfolio.id}/edit`);
    } catch (err) {
      error = err.message;
      isCreating = false;
    }
  }
</script>

<svelte:head>
  <title>Create Portfolio | Portfolia</title>
</svelte:head>

<div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
  <div class="flex items-center mb-8">
    <button
      class="mr-4 text-neutral-500 hover:text-neutral-700"
      on:click={() => goto("/portfolios")}
    >
      <svg
        class="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
    </button>
    <h1 class="text-2xl font-bold text-neutral-900">Create New Portfolio</h1>
  </div>

  {#if error}
    <div class="rounded-md bg-red-50 p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-red-800">{error}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Step 1: Template selection -->
  <div id="templates-section" class="mb-16">
    <h2 class="text-xl font-medium text-neutral-900 mb-6">
      {selectedTemplate ? "1. Template Selected" : "1. Choose a Template"}
    </h2>

    {#if selectedTemplate}
      <div class="flex flex-col md:flex-row md:items-center md:space-x-6">
        <div class="w-full md:w-1/3 mb-4 md:mb-0">
          <div
            class="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm"
          >
            <div class="h-48 bg-neutral-100">
              <img
                src={selectedTemplate.thumbnailUrl}
                alt={selectedTemplate.name}
                class="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
        <div class="w-full md:w-2/3">
          <h3 class="text-lg font-medium text-neutral-900">
            {selectedTemplate.name}
          </h3>
          <p class="mt-1 text-neutral-500">{selectedTemplate.description}</p>
          <div class="mt-2">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800"
            >
              {categories.find((c) => c.id === selectedTemplate.category)
                ?.label || selectedTemplate.category}
            </span>
            {#if selectedTemplate.isPremium}
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ml-2"
              >
                Premium
              </span>
            {/if}
          </div>
          <div class="mt-4">
            <Button variant="outline" on:click={goBackToTemplates}>
              Choose another template
            </Button>
          </div>
        </div>
      </div>
    {:else}
      <!-- Template filter & search -->
      <div
        class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div class="flex flex-wrap gap-2 mb-4 md:mb-0">
          {#each categories as category}
            <button
              class="px-3 py-1.5 text-sm rounded-full {filterCategory ===
              category.id
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}"
              on:click={() => (filterCategory = category.id)}
            >
              {category.label}
            </button>
          {/each}
        </div>

        <div class="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search templates..."
            class="block w-full rounded-md border-neutral-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm pl-10"
            bind:value={searchQuery}
          />
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
          >
            <svg
              class="h-5 w-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {#if isLoading}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each Array(6) as _}
            <div
              class="animate-pulse bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden"
            >
              <div class="h-48 bg-neutral-100"></div>
              <div class="p-4">
                <div class="h-6 w-3/4 bg-neutral-100 mb-2 rounded"></div>
                <div class="h-4 w-1/2 bg-neutral-100 mb-2 rounded"></div>
                <div class="h-8 w-20 bg-neutral-100 mt-4 rounded"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else if filteredTemplates.length === 0}
        <div
          class="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200"
        >
          <svg
            class="mx-auto h-12 w-12 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 class="mt-2 text-neutral-900 font-medium">No templates found</h3>
          <p class="text-neutral-500 mt-1">
            Try changing your search query or filter.
          </p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each filteredTemplates as template}
            <div
              class="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
              on:click={() => selectTemplate(template)}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === "Enter" && selectTemplate(template)}
            >
              <div class="h-48 bg-neutral-100 relative">
                <img
                  src={template.thumbnailUrl}
                  alt={template.name}
                  class="w-full h-full object-cover"
                />

                {#if template.featured}
                  <div
                    class="absolute top-2 left-2 bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded"
                  >
                    Featured
                  </div>
                {/if}

                {#if template.isPremium}
                  <div
                    class="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-medium px-2 py-1 rounded"
                  >
                    Premium
                  </div>
                {/if}
              </div>
              <div class="p-4">
                <h3 class="font-medium text-lg text-neutral-900">
                  {template.name}
                </h3>
                <p class="text-sm text-neutral-500 line-clamp-2 mt-1">
                  {template.description || "No description available."}
                </p>
                <div class="mt-3">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800"
                  >
                    {categories.find((c) => c.id === template.category)
                      ?.label || template.category}
                  </span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>

  <!-- Step 2: Portfolio details -->
  <div id="portfolio-details">
    <h2 class="text-xl font-medium text-neutral-900 mb-6">
      2. Portfolio Details
    </h2>

    <Card padding="lg" class="max-w-2xl">
      <form on:submit|preventDefault={handleCreatePortfolio} class="space-y-6">
        <Input
          id="portfolio-title"
          label="Portfolio Title"
          placeholder="Enter a title for your portfolio"
          required={true}
          bind:value={portfolioTitle}
        />

        <div>
          <label
            for="portfolio-description"
            class="block text-sm font-medium text-neutral-700"
            >Description (Optional)</label
          >
          <textarea
            id="portfolio-description"
            rows="3"
            class="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="Briefly describe what this portfolio is about"
            bind:value={portfolioDescription}
          ></textarea>
        </div>

        <div class="pt-5 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={!selectedTemplate || isCreating}
            loading={isCreating}
          >
            Create Portfolio
          </Button>
        </div>
      </form>
    </Card>
  </div>
</div>
