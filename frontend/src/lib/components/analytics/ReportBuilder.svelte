<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { getAvailableMetrics } from "$lib/services/reportService";
  import Button from "$lib/components/common/Button.svelte";
  import TextField from "$lib/components/common/TextField.svelte";
  import TextAreaField from "$lib/components/common/TextAreaField.svelte";
  import Select from "$lib/components/common/Select.svelte";
  import Checkbox from "$lib/components/common/Checkbox.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import DateRangePicker from "$lib/components/analytics/DateRangePicker.svelte";
  import type {
    ChartType,
    ChartOptions,
    ReportDefinition,
  } from "$lib/types/analytics";
  import { subDays } from "date-fns";

  export let report: Partial<ReportDefinition> = {};
  export let isEditing = false;

  const dispatch = createEventDispatcher();

  let loading = true;
  let error = "";
  let success = "";

  let availableMetrics = [];
  let selectedMetrics = report.metrics || [];
  let reportType = report.type || "portfolio";
  let reportName = report.name || "";
  let reportDescription = report.description || "";
  let reportSchedule = report.schedule || "monthly";
  let reportRecipients = (report.recipients || []).join(", ");
  let exportFormat = report.format || "pdf";
  let chartType = (report.visualization?.type as ChartType) || "bar";

  // Date range filters
  let startDate = subDays(new Date(), 30);
  let endDate = new Date();

  // Additional filters
  let filters = report.filters || {};

  onMount(async () => {
    try {
      availableMetrics = await getAvailableMetrics();
      loading = false;
    } catch (err) {
      error = err.message || "Failed to load available metrics";
      loading = false;
    }
  });

  function handleMetricToggle(metricId) {
    if (selectedMetrics.includes(metricId)) {
      selectedMetrics = selectedMetrics.filter((id) => id !== metricId);
    } else {
      selectedMetrics = [...selectedMetrics, metricId];
    }
  }

  function handleDateRangeChange(event) {
    const { startDate: newStart, endDate: newEnd } = event.detail;
    startDate = newStart;
    endDate = newEnd;

    // Update filters
    filters = {
      ...filters,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  }

  function saveReport() {
    if (!reportName) {
      error = "Report name is required";
      return;
    }

    if (selectedMetrics.length === 0) {
      error = "Please select at least one metric";
      return;
    }

    const recipientEmails = reportRecipients
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email);

    // Validate emails
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const invalidEmails = recipientEmails.filter(
      (email) => !emailPattern.test(email),
    );

    if (invalidEmails.length > 0) {
      error = `Invalid email address(es): ${invalidEmails.join(", ")}`;
      return;
    }

    const reportData: Partial<ReportDefinition> = {
      name: reportName,
      description: reportDescription,
      type: reportType,
      metrics: selectedMetrics,
      filters,
      schedule: reportSchedule,
      recipients: recipientEmails,
      format: exportFormat,
      visualization: {
        type: chartType,
        options: getChartOptions(chartType),
      },
    };

    dispatch("save", reportData);
    success = "Report saved successfully!";

    // Clear success message after a while
    setTimeout(() => {
      success = "";
    }, 3000);
  }

  function getChartOptions(type: ChartType): ChartOptions {
    // Default chart options based on chart type
    switch (type) {
      case "line":
        return {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          plugins: {
            legend: {
              position: "top",
            },
          },
        };
      case "pie":
      case "doughnut":
        return {
          plugins: {
            legend: {
              position: "right",
            },
          },
        };
      case "bar":
      default:
        return {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        };
    }
  }

  function cancel() {
    dispatch("cancel");
  }
</script>

<Card class="p-6">
  <h2 class="text-xl font-medium mb-2">
    {isEditing ? "Edit Report" : "Create New Report"}
  </h2>
  <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
    Customize your analytics report to track the metrics that matter to you.
  </p>

  {#if error}
    <AlertBox type="error" dismissible bind:visible={error} class="mb-4">
      {error}
    </AlertBox>
  {/if}

  {#if success}
    <AlertBox type="success" dismissible bind:visible={success} class="mb-4">
      {success}
    </AlertBox>
  {/if}

  {#if loading}
    <div class="flex justify-center py-8">
      <LoadingSpinner />
    </div>
  {:else}
    <div class="space-y-6">
      <!-- Basic report info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <TextField
            label="Report Name"
            bind:value={reportName}
            placeholder="e.g., Monthly Portfolio Performance"
            required
          />
        </div>

        <div>
          <Select
            label="Report Type"
            bind:value={reportType}
            options={[
              { value: "portfolio", label: "Portfolio Analytics" },
              { value: "profile", label: "Profile Analytics" },
              { value: "job", label: "Job Applications" },
              { value: "engagement", label: "Social Engagement" },
              { value: "monetization", label: "Monetization" },
              { value: "custom", label: "Custom Report" },
            ]}
          />
        </div>
      </div>

      <TextAreaField
        label="Description"
        bind:value={reportDescription}
        placeholder="What does this report track? Who is it for?"
        rows={2}
      />

      <!-- Date range -->
      <div>
        <h3 class="text-sm font-medium mb-2">Time Period</h3>
        <DateRangePicker
          bind:startDate
          bind:endDate
          on:change={handleDateRangeChange}
        />
      </div>

      <!-- Metrics selection -->
      <div>
        <h3 class="text-sm font-medium mb-3">Select Metrics</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          {#each availableMetrics as category}
            <div class="mb-4">
              <h4
                class="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2"
              >
                {category.category}
              </h4>
              {#each category.metrics as metric}
                <div class="mb-2">
                  <Checkbox
                    label={metric.name}
                    checked={selectedMetrics.includes(metric.id)}
                    on:change={() => handleMetricToggle(metric.id)}
                  />
                  <p
                    class="text-xs text-neutral-500 dark:text-neutral-400 ml-6"
                  >
                    {metric.description}
                  </p>
                </div>
              {/each}
            </div>
          {/each}
        </div>
      </div>

      <!-- Visualization options -->
      <div>
        <h3 class="text-sm font-medium mb-3">Visualization</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Chart Type"
            bind:value={chartType}
            options={[
              { value: "bar", label: "Bar Chart" },
              { value: "line", label: "Line Chart" },
              { value: "pie", label: "Pie Chart" },
              { value: "doughnut", label: "Doughnut Chart" },
              { value: "radar", label: "Radar Chart" },
              { value: "polarArea", label: "Polar Area Chart" },
            ]}
          />

          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center h-full pt-6">
              <img
                src={`/images/chart-types/${chartType}.svg`}
                alt={`${chartType} chart preview`}
                class="h-24 w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule and delivery -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Schedule"
          bind:value={reportSchedule}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" },
          ]}
        />

        <Select
          label="Export Format"
          bind:value={exportFormat}
          options={[
            { value: "pdf", label: "PDF Report" },
            { value: "csv", label: "CSV Data Export" },
            { value: "excel", label: "Excel Spreadsheet" },
          ]}
        />
      </div>

      <TextField
        label="Recipients (comma-separated emails)"
        bind:value={reportRecipients}
        placeholder="email@example.com, another@example.com"
      />

      <!-- Action buttons -->
      <div class="flex justify-end space-x-3">
        <Button variant="neutral" on:click={cancel}>Cancel</Button>
        <Button variant="primary" on:click={saveReport}>
          {isEditing ? "Update Report" : "Create Report"}
        </Button>
      </div>
    </div>
  {/if}
</Card>
