<script lang="ts">
  import { onMount } from "svelte";
  import {
    fetchReports,
    deleteReport,
    runReport,
    exportReport,
  } from "$lib/services/reportService";
  import { format } from "date-fns";
  import PageHeader from "$lib/components/common/PageHeader.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Dialog from "$lib/components/common/Dialog.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import ReportBuilder from "$lib/components/analytics/ReportBuilder.svelte";
  import EmptyState from "$lib/components/common/EmptyState.svelte";
  import type { ReportDefinition } from "$lib/types/analytics";

  let loading = true;
  let error: string | null = null;
  let reports: ReportDefinition[] = [];
  let showCreateDialog = false;
  let showEditDialog = false;
  let showDeleteDialog = false;
  let currentReport: ReportDefinition | null = null;
  let success = "";

  onMount(async () => {
    await loadReports();
  });

  async function loadReports() {
    loading = true;
    error = null;

    try {
      reports = await fetchReports();
    } catch (err) {
      error = err.message || "Failed to load reports";
    } finally {
      loading = false;
    }
  }

  function openCreateDialog() {
    currentReport = null;
    showCreateDialog = true;
  }

  function openEditDialog(report: ReportDefinition) {
    currentReport = report;
    showEditDialog = true;
  }

  function openDeleteDialog(report: ReportDefinition) {
    currentReport = report;
    showDeleteDialog = true;
  }

  async function handleSaveReport(event) {
    try {
      // In a real implementation, this would call the reportService to save the report
      console.log("Saving report:", event.detail);

      // Simulate saving and refresh the list
      await loadReports();

      // Close dialogs
      showCreateDialog = false;
      showEditDialog = false;

      success = currentReport
        ? `Report "${event.detail.name}" updated successfully`
        : `Report "${event.detail.name}" created successfully`;

      setTimeout(() => {
        success = "";
      }, 5000);
    } catch (err) {
      error = err.message || "Failed to save report";
    }
  }

  async function handleDeleteReport() {
    if (!currentReport) return;

    try {
      await deleteReport(currentReport.id);

      reports = reports.filter((r) => r.id !== currentReport.id);
      success = `Report "${currentReport.name}" deleted successfully`;

      showDeleteDialog = false;
      currentReport = null;

      setTimeout(() => {
        success = "";
      }, 5000);
    } catch (err) {
      error = err.message || "Failed to delete report";
    }
  }

  async function handleRunReport(report: ReportDefinition) {
    try {
      await runReport(report.id);
      window.location.href = `/analytics/reports/${report.id}`;
    } catch (err) {
      error = err.message || "Failed to run report";
    }
  }

  async function handleExportReport(
    report: ReportDefinition,
    format: "pdf" | "csv" | "excel",
  ) {
    try {
      const blob = await exportReport(report.id, format);
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
    }
  }

  // Get report type display name
  function getReportTypeName(type: string): string {
    const types = {
      portfolio: "Portfolio Analytics",
      profile: "Profile Analytics",
      job: "Job Applications",
      engagement: "Social Engagement",
      monetization: "Monetization",
      custom: "Custom Report",
    };

    return types[type] || type;
  }
</script>

<svelte:head>
  <title>Custom Reports | Portfolia Analytics</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <PageHeader
    title="Custom Reports"
    description="Create and manage custom analytics reports"
  >
    <div class="flex items-center space-x-2">
      <Button variant="primary" on:click={openCreateDialog}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 mr-1"
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
        Create Report
      </Button>
    </div>
  </PageHeader>

  {#if success}
    <AlertBox type="success" dismissible bind:visible={success} class="mb-6">
      {success}
    </AlertBox>
  {/if}

  {#if error}
    <AlertBox type="error" dismissible bind:visible={error} class="mb-6">
      {error}
    </AlertBox>
  {/if}

  {#if loading}
    <div class="flex justify-center py-16">
      <LoadingSpinner />
    </div>
  {:else if reports.length === 0}
    <EmptyState
      title="No reports yet"
      description="Create your first custom report to track metrics that matter to you"
      icon="chart-pie"
      action={{
        label: "Create Report",
        onClick: openCreateDialog,
      }}
    />
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {#each reports as report (report.id)}
        <Card>
          <div class="p-5">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-medium text-lg">{report.name}</h3>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  {getReportTypeName(report.type)}
                </p>
                {#if report.description}
                  <p
                    class="text-xs text-neutral-500 dark:text-neutral-500 mt-2 line-clamp-2"
                  >
                    {report.description}
                  </p>
                {/if}
              </div>

              <div class="flex flex-col items-center">
                <div
                  class="text-xs font-medium px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  {report.schedule}
                </div>
              </div>
            </div>

            <div class="mt-4 text-xs text-neutral-500 dark:text-neutral-500">
              <div class="flex items-center">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  {report.lastRun
                    ? `Last run: ${format(new Date(report.lastRun), "MMM d, yyyy")}`
                    : "Never run"}
                </span>
              </div>
              <div class="flex items-center mt-1">
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
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
                <span>
                  {report.recipients && report.recipients.length > 0
                    ? `${report.recipients.length} recipient${report.recipients.length === 1 ? "" : "s"}`
                    : "No recipients"}
                </span>
              </div>
            </div>

            <div
              class="mt-6 flex items-center space-x-2 text-xs text-neutral-700 dark:text-neutral-300"
            >
              <div>
                {#if report.visualization?.type === "bar"}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                {:else if report.visualization?.type === "line"}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                {:else if report.visualization?.type === "pie" || report.visualization?.type === "doughnut"}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                    />
                  </svg>
                {:else}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
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
                {/if}
              </div>

              <div>
                {report.metrics?.length || 0} metric{report.metrics?.length ===
                1
                  ? ""
                  : "s"}
              </div>

              <div>
                {report.format || "PDF"}
              </div>
            </div>

            <div
              class="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-between"
            >
              <div>
                <Button
                  variant="primary"
                  size="sm"
                  on:click={() => handleRunReport(report)}
                >
                  View Report
                </Button>
              </div>

              <div class="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  on:click={() => openEditDialog(report)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  color="danger"
                  size="sm"
                  on:click={() => openDeleteDialog(report)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Create Report Dialog -->
<Dialog
  open={showCreateDialog}
  title="Create Custom Report"
  size="xl"
  onClose={() => (showCreateDialog = false)}
>
  <ReportBuilder
    on:save={handleSaveReport}
    on:cancel={() => (showCreateDialog = false)}
  />
</Dialog>

<!-- Edit Report Dialog -->
<Dialog
  open={showEditDialog}
  title="Edit Report"
  size="xl"
  onClose={() => (showEditDialog = false)}
>
  {#if currentReport}
    <ReportBuilder
      report={currentReport}
      isEditing={true}
      on:save={handleSaveReport}
      on:cancel={() => (showEditDialog = false)}
    />
  {/if}
</Dialog>

<!-- Delete Report Dialog -->
<Dialog
  open={showDeleteDialog}
  title="Delete Report"
  onClose={() => (showDeleteDialog = false)}
>
  {#if currentReport}
    <div class="py-4">
      <p>
        Are you sure you want to delete the report <strong
          >"{currentReport.name}"</strong
        >?
      </p>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
        This action cannot be undone and all associated report data will be
        permanently deleted.
      </p>
    </div>

    <div slot="footer" class="flex justify-end space-x-3">
      <Button variant="neutral" on:click={() => (showDeleteDialog = false)}>
        Cancel
      </Button>
      <Button variant="danger" on:click={handleDeleteReport}>
        Delete Report
      </Button>
    </div>
  {/if}
</Dialog>
