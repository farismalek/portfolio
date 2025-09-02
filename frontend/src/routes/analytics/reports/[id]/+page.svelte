<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import Button from "$lib/components/common/Button.svelte";
  import ReportViewer from "$lib/components/analytics/ReportViewer.svelte";
  import { fetchReport } from "$lib/services/reportService";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";

  $: reportId = $page.params.id;

  let loading = true;
  let error: string | null = null;
  let report = null;

  onMount(async () => {
    try {
      report = await fetchReport(reportId);
    } catch (err) {
      error = err.message || "Failed to load report";
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title
    >{loading ? "Loading Report..." : report ? report.name : "Report Not Found"}
    | Portfolia Analytics</title
  >
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="mb-6">
    <Button href="/analytics/reports" variant="ghost" size="sm">
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
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      Back to Reports
    </Button>
  </div>

  {#if loading}
    <div class="flex justify-center py-16">
      <LoadingSpinner />
    </div>
  {:else if error}
    <AlertBox type="error">
      {error}
    </AlertBox>
  {:else}
    <ReportViewer {reportId} />
  {/if}
</div>
