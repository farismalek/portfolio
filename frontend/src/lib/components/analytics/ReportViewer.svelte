<script lang="ts">
  import { onMount } from "svelte";
  import {
    fetchReport,
    runReport,
    exportReport,
  } from "$lib/services/reportService";
  import Button from "$lib/components/common/Button.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";
  import Chart from "$lib/components/analytics/Chart.svelte";
  import DataTable from "$lib/components/analytics/DataTable.svelte";
  import type { ReportDefinition } from "$lib/types/analytics";
  import { format } from "date-fns";

  export let reportId: string;
  export let embedded = false;

  let loading = true;
  let error: string | null = null;
  let report: ReportDefinition;
  let reportData = null;
  let generatingReport = false;
  let exportingReport = false;

  onMount(async () => {
    await loadReport();
  });

  async function loadReport() {
    loading = true;
    error = null;

    try {
      report = await fetchReport(reportId);
      await generateReport();
    } catch (err) {
      error = err.message || "Failed to load report";
    } finally {
      loading = false;
    }
  }

  async function generateReport() {
    generatingReport = true;
    error = null;

    try {
      reportData = await runReport(reportId);
    } catch (err) {
      error = err.message || "Failed to generate report";
    } finally {
      generatingReport = false;
    }
  }

  async function handleExport(format: "pdf" | "csv" | "excel") {
    exportingReport = true;
    error = null;

    try {
      const blob = await exportReport(reportId, format);
      const url = URL.createObjectURL(blob);

      const extension = format === "excel" ? "xlsx" : format;
      const fileName = `${report.name.toLowerCase().replace(/\s+/g, "-")}-${format}.${extension}`;

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    } catch (err) {
      error = err.message || `Failed to export report as ${format}`;
    } finally {
      exportingReport = false;
    }
  }
</script>

<div class="report-viewer {embedded ? 'embedded' : ''}">
  {#if loading}
    <div class="flex justify-center py-8">
      <LoadingSpinner />
    </div>
  {:else if error}
    <AlertBox type="error">
      {error}
    </AlertBox>
  {:else if report}
    <div class="space-y-6">
      {#if !embedded}
        <div class="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h2 class="text-xl font-medium">{report.name}</h2>
            {#if report.description}
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {report.description}
              </p>
            {/if}
            <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              <span
                >Last updated: {report.lastRun
                  ? format(new Date(report.lastRun), "PPpp")
                  : "Never"}</span
              >
              <span class="mx-2">•</span>
              <span>Schedule: {report.schedule}</span>
              {#if report.recipients && report.recipients.length > 0}
                <span class="mx-2">•</span>
                <span>
                  {report.recipients.length} recipient{report.recipients
                    .length === 1
                    ? ""
                    : "s"}
                </span>
              {/if}
            </div>
          </div>

          <div class="mt-4 md:mt-0 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              on:click={() => generateReport()}
              disabled={generatingReport}
            >
              {#if generatingReport}
                <LoadingSpinner size="xs" class="mr-2" />
              {:else}
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              {/if}
              Refresh
            </Button>

            <div class="relative">
              <Button
                variant="primary"
                size="sm"
                disabled={exportingReport}
                on:click={() => handleExport(report.format || "pdf")}
              >
                {#if exportingReport}
                  <LoadingSpinner size="xs" class="mr-2" />
                {:else}
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                {/if}
                Export {report.format || "PDF"}
              </Button>
            </div>
          </div>
        </div>
      {/if}

      {#if generatingReport}
        <div class="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <p class="mt-4 text-neutral-500 dark:text-neutral-400">
            Generating your report...
          </p>
        </div>
      {:else if !reportData}
        <div
          class="flex flex-col items-center justify-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p class="mt-4 text-neutral-600 dark:text-neutral-400">
            Click "Refresh" to generate this report
          </p>
          <div class="mt-4">
            <Button
              variant="primary"
              size="sm"
              on:click={() => generateReport()}
            >
              Generate Report
            </Button>
          </div>
        </div>
      {:else}
        <!-- Report content -->
        <div class="space-y-6">
          {#if reportData.summary}
            <div class="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
              <h3 class="text-sm font-medium mb-2">Summary</h3>
              <p class="text-sm">{reportData.summary}</p>
            </div>
          {/if}

          {#if reportData.metrics}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {#each reportData.metrics as metric}
                <div
                  class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
                >
                  <h3 class="text-sm text-neutral-500 dark:text-neutral-400">
                    {metric.label}
                  </h3>
                  <div class="flex items-end mt-1">
                    <div class="text-2xl font-bold">
                      {metric.formattedValue || metric.value}
                    </div>
                    {#if metric.change !== undefined}
                      <div class="ml-2 flex items-center text-sm">
                        {#if metric.change > 0}
                          <span class="text-green-600 flex items-center">
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
                                d="M5 10l7-7m0 0l7 7m-7-7v18"
                              />
                            </svg>
                            {metric.change}%
                          </span>
                        {:else if metric.change < 0}
                          <span class="text-red-600 flex items-center">
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
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                              />
                            </svg>
                            {Math.abs(metric.change)}%
                          </span>
                        {:else}
                          <span class="text-neutral-500">0%</span>
                        {/if}
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          {#if reportData.charts && reportData.charts.length > 0}
            {#each reportData.charts as chart, i}
              <div
                class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
              >
                <h3 class="text-sm font-medium mb-4">{chart.title}</h3>
                <Chart
                  type={chart.type || report.visualization?.type || "bar"}
                  data={chart.data}
                  options={chart.options || report.visualization?.options || {}}
                  height={300}
                />
              </div>
            {/each}
          {/if}

          {#if reportData.tables && reportData.tables.length > 0}
            {#each reportData.tables as table, i}
              <div
                class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
              >
                <h3 class="text-sm font-medium mb-4">{table.title}</h3>
                <DataTable
                  data={table.data}
                  columns={table.columns}
                  pagination={table.data.length > 10}
                />
              </div>
            {/each}
          {/if}

          {#if reportData.insights && reportData.insights.length > 0}
            <div
              class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
            >
              <h3 class="text-sm font-medium mb-4">Key Insights</h3>
              <div class="space-y-4">
                {#each reportData.insights as insight}
                  <div
                    class="flex items-start p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg"
                  >
                    <div class="flex-shrink-0 mr-3">
                      {#if insight.type === "positive"}
                        <div
                          class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      {:else if insight.type === "negative"}
                        <div
                          class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-400"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </div>
                      {:else if insight.type === "warning"}
                        <div
                          class="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center text-yellow-600 dark:text-yellow-400"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
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
                      {:else}
                        <div
                          class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      {/if}
                    </div>
                    <div>
                      <p class="text-sm font-medium">{insight.title}</p>
                      <p
                        class="text-sm text-neutral-600 dark:text-neutral-400 mt-1"
                      >
                        {insight.description}
                      </p>
                      {#if insight.recommendation}
                        <div
                          class="mt-2 p-2 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 text-xs"
                        >
                          <span class="font-medium">Recommendation:</span>
                          {insight.recommendation}
                        </div>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <div
      class="flex flex-col items-center justify-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-12 w-12 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"
        />
      </svg>
      <p class="mt-4 text-neutral-600 dark:text-neutral-400">
        Report not found
      </p>
    </div>
  {/if}
</div>

<style>
  .report-viewer.embedded {
    /* Styles for embedded mode */
  }
</style>
