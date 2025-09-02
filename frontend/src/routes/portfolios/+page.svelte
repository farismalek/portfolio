<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    fetchMyPortfolios,
    deletePortfolio,
  } from "$lib/services/portfolioService";
  import Button from "$lib/components/common/Button.svelte";
  import Card from "$lib/components/common/Card.svelte";

  // State
  let portfolios = [];
  let isLoading = true;
  let error: string | null = null;
  let deleteTarget: string | null = null;
  let isDeleting = false;

  // Fetch portfolios on mount
  onMount(async () => {
    try {
      portfolios = await fetchMyPortfolios();
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  });

  // Calculate and format the last updated time
  function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return diffDay === 1 ? "1 day ago" : `${diffDay} days ago`;
    }
    if (diffHour > 0) {
      return diffHour === 1 ? "1 hour ago" : `${diffHour} hours ago`;
    }
    if (diffMin > 0) {
      return diffMin === 1 ? "1 minute ago" : `${diffMin} minutes ago`;
    }
    return "Just now";
  }

  // Navigate to create new portfolio
  function handleCreatePortfolio() {
    goto("/portfolios/create");
  }

  // Navigate to portfolio editor
  function handleEditPortfolio(id: string) {
    goto(`/portfolios/${id}/edit`);
  }

  // Navigate to view portfolio
  function handleViewPortfolio(slug: string) {
    goto(`/p/${slug}`);
  }

  // Set up portfolio for deletion
  function confirmDeletePortfolio(id: string) {
    deleteTarget = id;
  }

  // Cancel deletion
  function cancelDelete() {
    deleteTarget = null;
  }

  // Actually delete portfolio
  async function handleDeletePortfolio() {
    if (!deleteTarget) return;

    isDeleting = true;

    try {
      await deletePortfolio(deleteTarget);
      portfolios = portfolios.filter((p) => p.id !== deleteTarget);
      deleteTarget = null;
    } catch (err) {
      error = err.message;
    } finally {
      isDeleting = false;
    }
  }

  // Format publication status
  function getStatusBadge(status: string) {
    switch (status) {
      case "published":
        return {
          text: "Published",
          color: "bg-green-100 text-green-800",
        };
      case "draft":
        return {
          text: "Draft",
          color: "bg-yellow-100 text-yellow-800",
        };
      case "archived":
        return {
          text: "Archived",
          color: "bg-neutral-100 text-neutral-800",
        };
      default:
        return {
          text: status,
          color: "bg-neutral-100 text-neutral-800",
        };
    }
  }
</script>

<svelte:head>
  <title>Your Portfolios | Portfolia</title>
</svelte:head>

<div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
  <div
    class="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
  >
    <div>
      <h1 class="text-3xl font-bold text-neutral-900">Your Portfolios</h1>
      <p class="mt-1 text-sm text-neutral-500">
        Create, manage, and publish your professional portfolios.
      </p>
    </div>
    <div class="mt-4 md:mt-0">
      <Button on:click={handleCreatePortfolio}>
        <svg
          class="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Create Portfolio
      </Button>
    </div>
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

  {#if isLoading}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each Array(3) as _}
        <div
          class="animate-pulse bg-white rounded-xl border border-neutral-200 shadow-sm p-6"
        >
          <div class="h-40 mb-4 bg-neutral-100 rounded-lg"></div>
          <div class="h-6 w-3/4 mb-2 bg-neutral-100 rounded"></div>
          <div class="h-4 w-1/2 mb-4 bg-neutral-100 rounded"></div>
          <div class="flex justify-between mt-4">
            <div class="h-8 w-20 bg-neutral-100 rounded"></div>
            <div class="h-8 w-20 bg-neutral-100 rounded"></div>
          </div>
        </div>
      {/each}
    </div>
  {:else if portfolios.length === 0}
    <Card class="p-6 flex flex-col items-center justify-center text-center">
      <svg
        class="w-16 h-16 text-neutral-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-neutral-900">
        No portfolios yet
      </h3>
      <p class="mt-1 text-neutral-500">
        Create your first portfolio to showcase your work and experience.
      </p>
      <div class="mt-6">
        <Button on:click={handleCreatePortfolio}>
          <svg
            class="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Create your first portfolio
        </Button>
      </div>
    </Card>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each portfolios as portfolio}
        <div
          class="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden"
        >
          <!-- Portfolio thumbnail -->
          <div class="relative h-48 bg-neutral-100">
            {#if portfolio.thumbnailUrl}
              <img
                src={portfolio.thumbnailUrl}
                alt={portfolio.title}
                class="w-full h-full object-cover"
              />
            {:else}
              <div class="absolute inset-0 flex items-center justify-center">
                <svg
                  class="w-12 h-12 text-neutral-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            {/if}

            <!-- Status badge -->
            <div class="absolute top-3 right-3">
              {@const badge = getStatusBadge(portfolio.status)}
              <span
                class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
              >
                {badge.text}
              </span>
            </div>
          </div>

          <div class="p-5">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-lg font-medium text-neutral-900 line-clamp-1">
                  {portfolio.title}
                </h3>
                <p class="text-sm text-neutral-500 mt-1 mb-3 line-clamp-2">
                  {portfolio.description || "No description provided."}
                </p>
              </div>

              {#if portfolio.featured}
                <span
                  class="flex-shrink-0 inline-block h-5 w-5 text-yellow-400"
                >
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                </span>
              {/if}
            </div>

            <!-- Portfolio details -->
            <div class="flex items-center text-xs text-neutral-500 mb-4">
              <div class="flex items-center">
                <svg
                  class="w-3.5 h-3.5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                {portfolio.viewCount}
                {portfolio.viewCount === 1 ? "view" : "views"}
              </div>
              <div class="mx-2">•</div>
              <div>
                Updated {getTimeAgo(portfolio.updatedAt)}
              </div>
            </div>

            <!-- Page count -->
            <div class="flex items-center text-xs text-neutral-500 mb-4">
              <svg
                class="w-3.5 h-3.5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              {portfolio.pages?.length || 0}
              {portfolio.pages?.length === 1 ? "page" : "pages"}
            </div>

            <!-- Actions -->
            <div class="flex mt-4 space-x-2">
              <Button
                variant="outline"
                class="flex-1"
                on:click={() => handleViewPortfolio(portfolio.slug)}
              >
                <svg
                  class="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                View
              </Button>

              <Button
                variant="outline"
                class="flex-1"
                on:click={() => handleEditPortfolio(portfolio.id)}
              >
                <svg
                  class="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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

              <Button
                variant="outline"
                class="text-red-600 hover:bg-red-50"
                on:click={() => confirmDeletePortfolio(portfolio.id)}
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Delete confirmation modal -->
{#if deleteTarget}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
      <h3 class="text-lg font-medium text-neutral-900 mb-3">
        Delete Portfolio
      </h3>
      <p class="text-neutral-600 mb-6">
        Are you sure you want to delete this portfolio? This action cannot be
        undone.
      </p>
      <div class="flex justify-end space-x-3">
        <Button variant="outline" on:click={cancelDelete} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          class="bg-red-600 hover:bg-red-700"
          on:click={handleDeletePortfolio}
          loading={isDeleting}
        >
          Delete
        </Button>
      </div>
    </div>
  </div>
{/if}
