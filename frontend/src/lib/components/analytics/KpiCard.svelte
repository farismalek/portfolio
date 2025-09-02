<script lang="ts">
  import { fly } from "svelte/transition";
  import type { KpiCardProps } from "$lib/types/analytics";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";

  export let title: string;
  export let value: number | string;
  export let previousValue: number | string = undefined;
  export let percentChange: number = undefined;
  export let icon: string = undefined;
  export let color:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "neutral" = "primary";
  export let format: "number" | "currency" | "percent" | "time" = "number";
  export let loading: boolean = false;

  // Format the value based on the specified format
  $: formattedValue = formatValue(value, format);

  // Format the previous value
  $: formattedPreviousValue =
    previousValue !== undefined
      ? formatValue(previousValue, format)
      : undefined;

  // Determine if the trend is positive or negative
  $: trendDirection =
    percentChange > 0 ? "up" : percentChange < 0 ? "down" : "neutral";

  // Generate CSS classes based on the color prop
  $: colorClass = {
    primary:
      "bg-primary-50 dark:bg-primary-900 border-primary-200 dark:border-primary-700",
    secondary:
      "bg-secondary-50 dark:bg-secondary-900 border-secondary-200 dark:border-secondary-700",
    success:
      "bg-success-50 dark:bg-success-900 border-success-200 dark:border-success-700",
    warning:
      "bg-warning-50 dark:bg-warning-900 border-warning-200 dark:border-warning-700",
    danger:
      "bg-danger-50 dark:bg-danger-900 border-danger-200 dark:border-danger-700",
    info: "bg-info-50 dark:bg-info-900 border-info-200 dark:border-info-700",
    neutral:
      "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
  }[color];

  $: iconColorClass = {
    primary: "text-primary-600 dark:text-primary-400",
    secondary: "text-secondary-600 dark:text-secondary-400",
    success: "text-success-600 dark:text-success-400",
    warning: "text-warning-600 dark:text-warning-400",
    danger: "text-danger-600 dark:text-danger-400",
    info: "text-info-600 dark:text-info-400",
    neutral: "text-neutral-600 dark:text-neutral-400",
  }[color];

  $: trendColorClass = {
    up: "text-success-600 dark:text-success-400",
    down: "text-danger-600 dark:text-danger-400",
    neutral: "text-neutral-600 dark:text-neutral-400",
  }[trendDirection];

  // Format numeric values according to the specified format
  function formatValue(val: number | string, format: string): string {
    if (typeof val === "string") return val;

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);

      case "percent":
        return new Intl.NumberFormat("en-US", {
          style: "percent",
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(val / 100);

      case "time":
        const minutes = Math.floor(val / 60);
        const seconds = Math.floor(val % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;

      case "number":
      default:
        return new Intl.NumberFormat("en-US").format(val);
    }
  }
</script>

<div class="kpi-card rounded-lg border p-4 {colorClass}">
  <div class="flex items-start justify-between mb-2">
    <h3 class="text-sm font-medium text-neutral-600 dark:text-neutral-400">
      {title}
    </h3>

    {#if icon}
      <div class={iconColorClass}>
        <svelte:component this={icon} class="h-5 w-5" />
      </div>
    {/if}
  </div>

  <div class="mt-2">
    {#if loading}
      <div class="flex items-center justify-center h-10">
        <LoadingSpinner size="sm" />
      </div>
    {:else}
      <div
        class="text-2xl font-bold text-neutral-900 dark:text-white"
        in:fly={{ y: 10, duration: 300 }}
      >
        {formattedValue}
      </div>

      {#if percentChange !== undefined}
        <div class="flex items-center mt-1">
          {#if trendDirection === "up"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1 {trendColorClass}"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                clip-rule="evenodd"
              />
            </svg>
          {:else if trendDirection === "down"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1 {trendColorClass}"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
                clip-rule="evenodd"
              />
            </svg>
          {:else}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1 {trendColorClass}"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          {/if}

          <span class="text-xs {trendColorClass}">
            {Math.abs(percentChange).toFixed(1)}% {trendDirection === "up"
              ? "increase"
              : trendDirection === "down"
                ? "decrease"
                : "change"}
            {#if formattedPreviousValue}
              <span class="text-neutral-500 dark:text-neutral-400 ml-1"
                >from {formattedPreviousValue}</span
              >
            {/if}
          </span>
        </div>
      {/if}
    {/if}
  </div>
</div>
