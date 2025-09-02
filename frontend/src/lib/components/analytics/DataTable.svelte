<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { DataTableProps } from "$lib/types/analytics";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";

  export let data = [];
  export let columns = [];
  export let loading = false;
  export let error = null;
  export let pagination = false;
  export let pageSize = 10;

  const dispatch = createEventDispatcher();

  // Pagination state
  let currentPage = 1;
  $: totalPages = Math.ceil(data.length / pageSize);
  $: paginatedData = pagination
    ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : data;

  // Sorting state
  let sortColumn = null;
  let sortDirection = "asc";

  function handleSort(column) {
    if (!column.sortable) return;

    if (sortColumn === column.key) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column.key;
      sortDirection = "asc";
    }

    data = [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });

    dispatch("sort", { column: sortColumn, direction: sortDirection });
  }

  function goToPage(page) {
    currentPage = Math.max(1, Math.min(page, totalPages));
  }
</script>

<div class="overflow-x-auto">
  {#if loading}
    <div class="flex justify-center py-8">
      <LoadingSpinner />
    </div>
  {:else if error}
    <div class="text-center py-8">
      <p class="text-danger-600 dark:text-danger-400">{error}</p>
    </div>
  {:else if data.length === 0}
    <div class="text-center py-8">
      <p class="text-neutral-500 dark:text-neutral-400">No data available</p>
    </div>
  {:else}
    <table class="w-full text-sm">
      <thead
        class="bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
      >
        <tr>
          {#each columns as column}
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider {column.sortable
                ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700'
                : ''}"
              style="text-align: {column.align || 'left'}"
              on:click={() => handleSort(column)}
            >
              <div class="flex items-center space-x-1">
                <span>{column.title}</span>
                {#if column.sortable && sortColumn === column.key}
                  <span>
                    {#if sortDirection === "asc"}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    {:else}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    {/if}
                  </span>
                {/if}
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody
        class="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700"
      >
        {#each paginatedData as row}
          <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-750">
            {#each columns as column}
              <td
                class="px-4 py-3 whitespace-nowrap"
                style="text-align: {column.align || 'left'}"
              >
                {#if column.format}
                  {@html column.format(row[column.key])}
                {:else}
                  {row[column.key]}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>

    {#if pagination && totalPages > 1}
      <div
        class="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700 px-4 py-3 sm:px-6"
      >
        <div
          class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"
        >
          <div>
            <p class="text-sm text-neutral-700 dark:text-neutral-300">
              Showing
              <span class="font-medium">{(currentPage - 1) * pageSize + 1}</span
              >
              to
              <span class="font-medium"
                >{Math.min(currentPage * pageSize, data.length)}</span
              >
              of
              <span class="font-medium">{data.length}</span>
              results
            </p>
          </div>
          <div>
            <nav
              class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                on:click={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span class="sr-only">Previous</span>
                <svg
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>

              {#each Array(totalPages) as _, i}
                {#if i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)}
                  <button
                    class="relative inline-flex items-center px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-sm font-medium {i +
                      1 ===
                    currentPage
                      ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-300'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'}"
                    on:click={() => goToPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                {:else if i + 1 === currentPage - 2 || i + 1 === currentPage + 2}
                  <span
                    class="relative inline-flex items-center px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    ...
                  </span>
                {/if}
              {/each}

              <button
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                on:click={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span class="sr-only">Next</span>
                <svg
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
