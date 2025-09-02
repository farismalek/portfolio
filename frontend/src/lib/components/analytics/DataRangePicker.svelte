<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    format,
    subDays,
    subMonths,
    startOfMonth,
    endOfMonth,
    isValid,
  } from "date-fns";
  import Dropdown from "$lib/components/common/Dropdown.svelte";
  import TextField from "$lib/components/common/TextField.svelte";

  export let startDate = subDays(new Date(), 30);
  export let endDate = new Date();
  export let presets = true;

  const dispatch = createEventDispatcher();

  // Format dates for input fields
  $: formattedStartDate = isValid(startDate)
    ? format(startDate, "yyyy-MM-dd")
    : "";
  $: formattedEndDate = isValid(endDate) ? format(endDate, "yyyy-MM-dd") : "";

  // Date range presets
  const dateRangePresets = [
    {
      label: "Today",
      getValue: () => ({ start: new Date(), end: new Date() }),
    },
    {
      label: "Yesterday",
      getValue: () => ({
        start: subDays(new Date(), 1),
        end: subDays(new Date(), 1),
      }),
    },
    {
      label: "Last 7 days",
      getValue: () => ({ start: subDays(new Date(), 6), end: new Date() }),
    },
    {
      label: "Last 30 days",
      getValue: () => ({ start: subDays(new Date(), 29), end: new Date() }),
    },
    {
      label: "This month",
      getValue: () => ({ start: startOfMonth(new Date()), end: new Date() }),
    },
    {
      label: "Last month",
      getValue: () => {
        const lastMonth = subMonths(new Date(), 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
        };
      },
    },
  ];

  // Apply a preset date range
  function applyPreset(preset) {
    const { start, end } = preset.getValue();
    startDate = start;
    endDate = end;
    updateDateRange();
  }

  // Handle manual date changes
  function updateStartDate(event) {
    const date = new Date(event.target.value);
    if (isValid(date)) {
      startDate = date;
      // Ensure start date is not after end date
      if (startDate > endDate) {
        endDate = startDate;
      }
      updateDateRange();
    }
  }

  function updateEndDate(event) {
    const date = new Date(event.target.value);
    if (isValid(date)) {
      endDate = date;
      // Ensure end date is not before start date
      if (endDate < startDate) {
        startDate = endDate;
      }
      updateDateRange();
    }
  }

  // Dispatch changes to parent component
  function updateDateRange() {
    dispatch("change", { startDate, endDate });
  }
</script>

<div class="date-range-picker flex flex-wrap md:flex-nowrap items-center gap-3">
  <div class="flex items-center space-x-2 w-full md:w-auto">
    <TextField
      type="date"
      value={formattedStartDate}
      on:change={updateStartDate}
      label="Start Date"
      size="sm"
    />

    <span class="text-neutral-500 dark:text-neutral-400">to</span>

    <TextField
      type="date"
      value={formattedEndDate}
      on:change={updateEndDate}
      label="End Date"
      size="sm"
    />
  </div>

  {#if presets}
    <Dropdown let:close>
      <button
        slot="trigger"
        class="text-sm px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
      >
        <span>Presets</span>
        <svg
          class="inline-block ml-1 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <div slot="content" class="py-1">
        {#each dateRangePresets as preset}
          <button
            class="block w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            on:click={() => {
              applyPreset(preset);
              close();
            }}
          >
            {preset.label}
          </button>
        {/each}
      </div>
    </Dropdown>
  {/if}
</div>
