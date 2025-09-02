<script lang="ts">
  import { onMount } from "svelte";
  import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    parseISO,
    addDays,
  } from "date-fns";
  import {
    submitTimeLog,
    getTimeLogs,
    updateTimeLogStatus,
  } from "$lib/services/contractsService";
  import Card from "$lib/components/common/Card.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Badge from "$lib/components/common/Badge.svelte";
  import Dialog from "$lib/components/common/Dialog.svelte";
  import TextField from "$lib/components/common/TextField.svelte";
  import TextAreaField from "$lib/components/common/TextAreaField.svelte";
  import DateTimePicker from "$lib/components/common/DateTimePicker.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";
  import { formatCurrency } from "$lib/utils/formatters";

  export let contract;
  export let userRole = "freelancer"; // 'client' or 'freelancer'
  export let onUpdate = () => {};

  let isAddingTimeLog = false;
  let isReviewingTimeLog = false;
  let selectedTimeLog = null;
  let isLoading = false;
  let isLoadingTimeLogs = true;
  let error = "";

  // Time log form fields
  let startTime = "";
  let endTime = "";
  let description = "";
  let isBillable = true;
  let rejectionReason = "";

  // Filter options
  let activeFilter = "all";
  let currentPage = 1;
  let totalPages = 1;
  let timeLogs = [];
  let timeLogSummary = null;

  onMount(() => {
    loadTimeLogs();
  });

  async function loadTimeLogs() {
    try {
      isLoadingTimeLogs = true;

      const params = {
        page: currentPage,
        limit: 20,
        status: activeFilter === "all" ? undefined : activeFilter,
      };

      const result = await getTimeLogs(contract.id, params);
      timeLogs = result.items;
      timeLogSummary = result.summary;
      totalPages = Math.ceil(result.totalCount / 20);
    } catch (err) {
      console.error("Failed to load time logs:", err);
    } finally {
      isLoadingTimeLogs = false;
    }
  }

  function resetForm() {
    startTime = "";
    endTime = "";
    description = "";
    isBillable = true;
    rejectionReason = "";
    error = "";
  }

  function openAddTimeLogDialog() {
    resetForm();
    isAddingTimeLog = true;
  }

  function openReviewTimeLogDialog(timeLog) {
    selectedTimeLog = timeLog;
    rejectionReason = "";
    error = "";
    isReviewingTimeLog = true;
  }

  async function handleAddTimeLog() {
    try {
      if (!startTime) {
        error = "Start time is required";
        return;
      }

      if (!endTime) {
        error = "End time is required";
        return;
      }

      if (new Date(endTime) <= new Date(startTime)) {
        error = "End time must be after start time";
        return;
      }

      if (!description.trim()) {
        error = "Description is required";
        return;
      }

      isLoading = true;
      error = "";

      await submitTimeLog(contract.id, {
        startTime,
        endTime,
        description,
        isBillable,
      });

      isAddingTimeLog = false;
      await loadTimeLogs();
      await onUpdate();
    } catch (err) {
      error = err.message || "Failed to submit time log";
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function approveTimeLog(timeLogId) {
    try {
      isLoading = true;
      error = "";

      await updateTimeLogStatus(timeLogId, true);
      isReviewingTimeLog = false;
      await loadTimeLogs();
      await onUpdate();
    } catch (err) {
      error = err.message || "Failed to approve time log";
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function rejectTimeLog(timeLogId) {
    try {
      if (!rejectionReason.trim()) {
        error = "Please provide a reason for rejection";
        return;
      }

      isLoading = true;
      error = "";

      await updateTimeLogStatus(timeLogId, false, rejectionReason);
      isReviewingTimeLog = false;
      await loadTimeLogs();
      await onUpdate();
    } catch (err) {
      error = err.message || "Failed to reject time log";
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  function changeFilter(filter) {
    activeFilter = filter;
    currentPage = 1;
    loadTimeLogs();
  }

  function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadTimeLogs();
  }

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
</script>

<!-- Add time log dialog -->
<Dialog
  open={isAddingTimeLog}
  title="Log Time"
  onClose={() => (isAddingTimeLog = false)}
>
  <div class="py-4 space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <DateTimePicker label="Start Time" bind:value={startTime} required />

      <DateTimePicker label="End Time" bind:value={endTime} required />
    </div>

    <TextAreaField
      label="Description"
      bind:value={description}
      placeholder="What did you work on?"
      rows={3}
      required
    />

    <div class="flex items-center">
      <input
        type="checkbox"
        id="isBillable"
        bind:checked={isBillable}
        class="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
      />
      <label for="isBillable" class="ml-2 text-sm text-neutral-700">
        Billable time ({contract.formattedHourlyRate} per hour)
      </label>
    </div>

    {#if error}
      <AlertBox type="error">
        {error}
      </AlertBox>
    {/if}
  </div>

  <svelte:fragment slot="footer">
    <Button variant="neutral" on:click={() => (isAddingTimeLog = false)}
      >Cancel</Button
    >
    <Button variant="primary" on:click={handleAddTimeLog} disabled={isLoading}>
      {#if isLoading}
        <LoadingSpinner size="sm" class="mr-2" />
        Submitting...
      {:else}
        Submit Time Log
      {/if}
    </Button>
  </svelte:fragment>
</Dialog>

<!-- Review time log dialog -->
<Dialog
  open={isReviewingTimeLog}
  title="Review Time Log"
  onClose={() => (isReviewingTimeLog = false)}
>
  <div class="py-4 space-y-4">
    {#if selectedTimeLog}
      <div class="mb-4">
        <div class="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div class="text-sm text-neutral-500">Start Time</div>
            <div>
              {format(
                new Date(selectedTimeLog.startTime),
                "MMM d, yyyy h:mm a",
              )}
            </div>
          </div>
          <div>
            <div class="text-sm text-neutral-500">End Time</div>
            <div>
              {format(new Date(selectedTimeLog.endTime), "MMM d, yyyy h:mm a")}
            </div>
          </div>
        </div>

        <div class="mb-3">
          <div class="text-sm text-neutral-500">Duration</div>
          <div>{selectedTimeLog.formattedDuration}</div>
        </div>

        <div class="mb-3">
          <div class="text-sm text-neutral-500">Billable Amount</div>
          <div>{selectedTimeLog.formattedAmount}</div>
        </div>

        <div>
          <div class="text-sm text-neutral-500">Description</div>
          <p class="mt-1 text-neutral-700">{selectedTimeLog.description}</p>
        </div>
      </div>

      {#if !selectedTimeLog.isApproved && !selectedTimeLog.rejectedAt}
        <TextAreaField
          label="Rejection Reason (required if rejecting)"
          bind:value={rejectionReason}
          placeholder="Explain why you're rejecting this time log"
          rows={3}
        />
      {/if}

      {#if error}
        <AlertBox type="error">
          {error}
        </AlertBox>
      {/if}
    {/if}
  </div>

  <svelte:fragment slot="footer">
    <Button variant="neutral" on:click={() => (isReviewingTimeLog = false)}>
      {selectedTimeLog?.isApproved || selectedTimeLog?.rejectedAt
        ? "Close"
        : "Cancel"}
    </Button>

    {#if selectedTimeLog && !selectedTimeLog.isApproved && !selectedTimeLog.rejectedAt}
      <div class="flex space-x-2">
        <Button
          variant="danger"
          on:click={() => rejectTimeLog(selectedTimeLog.id)}
          disabled={isLoading || !rejectionReason.trim()}
        >
          {#if isLoading}
            <LoadingSpinner size="sm" class="mr-2" />
          {:else}
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          {/if}
          Reject
        </Button>

        <Button
          variant="success"
          on:click={() => approveTimeLog(selectedTimeLog.id)}
          disabled={isLoading}
        >
          {#if isLoading}
            <LoadingSpinner size="sm" class="mr-2" />
          {:else}
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          {/if}
          Approve & Pay
        </Button>
      </div>
    {/if}
  </svelte:fragment>
</Dialog>

<!-- Time Logs content -->
<div>
  <div
    class="flex flex-col md:flex-row md:items-center md:justify-between mb-6"
  >
    <h2 class="text-xl font-medium mb-4 md:mb-0">Time & Activity</h2>

    {#if userRole === "freelancer" && contract.status === "active"}
      <Button variant="primary" size="sm" on:click={openAddTimeLogDialog}>
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
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Log Time
      </Button>
    {/if}
  </div>

  <!-- Summary cards -->
  {#if timeLogSummary}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card class="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div class="p-4">
          <h3 class="text-sm font-medium text-neutral-500 mb-1">Total Hours</h3>
          <div class="text-2xl font-bold text-neutral-900">
            {timeLogSummary.totalHoursDecimal}
          </div>
          <div class="text-sm text-neutral-600 mt-1">
            {timeLogSummary.totalHours}
          </div>
        </div>
      </Card>

      <Card
        class="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
      >
        <div class="p-4">
          <h3 class="text-sm font-medium text-neutral-500 mb-1">
            Approved Hours
          </h3>
          <div class="text-2xl font-bold text-neutral-900">
            {timeLogSummary.approvedHours}
          </div>
          <div class="text-sm text-green-600 mt-1">
            {timeLogSummary.formattedApprovedAmount}
          </div>
        </div>
      </Card>

      <Card
        class="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
      >
        <div class="p-4">
          <h3 class="text-sm font-medium text-neutral-500 mb-1">
            Pending Hours
          </h3>
          <div class="text-2xl font-bold text-neutral-900">
            {timeLogSummary.pendingHours}
          </div>
          <div class="text-sm text-yellow-600 mt-1">
            {timeLogSummary.formattedPendingAmount}
          </div>
        </div>
      </Card>

      <Card
        class="bg-gradient-to-br from-neutral-50 to-neutral-100 border-neutral-200"
      >
        <div class="p-4">
          <h3 class="text-sm font-medium text-neutral-500 mb-1">
            {userRole === "freelancer" ? "Hourly Rate" : "Weekly Limit"}
          </h3>
          <div class="text-2xl font-bold text-neutral-900">
            {contract.formattedHourlyRate}
          </div>
          <div class="text-sm text-neutral-600 mt-1">
            {contract.weeklyLimit
              ? `${contract.weeklyLimit} hours/week limit`
              : "No weekly limit"}
          </div>
        </div>
      </Card>
    </div>
  {/if}

  <!-- Filters -->
  <div class="mb-6 flex justify-between items-center">
    <div>
      <div class="inline-flex rounded-md shadow-sm">
        <button
          class="px-4 py-2 text-sm font-medium rounded-l-md border
            {activeFilter === 'all'
            ? 'bg-primary-50 border-primary-500 text-primary-700'
            : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'}"
          on:click={() => changeFilter("all")}
        >
          All
        </button>
        <button
          class="px-4 py-2 text-sm font-medium border-t border-b border-neutral-300
            {activeFilter === 'pending'
            ? 'bg-primary-50 border-primary-500 text-primary-700'
            : 'bg-white text-neutral-700 hover:bg-neutral-50'}"
          on:click={() => changeFilter("pending")}
        >
          Pending
        </button>
        <button
          class="px-4 py-2 text-sm font-medium border-t border-b border-neutral-300
            {activeFilter === 'approved'
            ? 'bg-primary-50 border-primary-500 text-primary-700'
            : 'bg-white text-neutral-700 hover:bg-neutral-50'}"
          on:click={() => changeFilter("approved")}
        >
          Approved
        </button>
        <button
          class="px-4 py-2 text-sm font-medium rounded-r-md border border-neutral-300
            {activeFilter === 'rejected'
            ? 'bg-primary-50 border-primary-500 text-primary-700'
            : 'bg-white text-neutral-700 hover:bg-neutral-50'}"
          on:click={() => changeFilter("rejected")}
        >
          Rejected
        </button>
      </div>
    </div>
  </div>

  <!-- Time logs list -->
  {#if isLoadingTimeLogs}
    <div class="flex justify-center py-12">
      <LoadingSpinner />
    </div>
  {:else if timeLogs.length === 0}
    <Card>
      <div class="p-8 text-center">
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-neutral-900">
          No time logs found
        </h3>
        <p class="mt-2 text-neutral-600 max-w-md mx-auto">
          {#if activeFilter !== "all"}
            No time logs with the selected status.
          {:else}
            No time has been logged for this contract yet.
          {/if}
        </p>

        {#if userRole === "freelancer" && contract.status === "active"}
          <div class="mt-6">
            <Button variant="primary" on:click={openAddTimeLogDialog}>
              Log Time
            </Button>
          </div>
        {/if}
      </div>
    </Card>
  {:else}
    <Card>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200">
          <thead class="bg-neutral-50">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Date & Time
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Duration
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-200">
            {#each timeLogs as timeLog (timeLog.id)}
              <tr class="hover:bg-neutral-50">
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900"
                >
                  {format(new Date(timeLog.startTime), "MMM d, yyyy")}
                  <br />
                  <span class="text-neutral-500">
                    {format(new Date(timeLog.startTime), "h:mm a")} - {format(
                      new Date(timeLog.endTime),
                      "h:mm a",
                    )}
                  </span>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900"
                >
                  {timeLog.formattedDuration}
                </td>
                <td
                  class="px-6 py-4 text-sm text-neutral-900 max-w-xs truncate"
                >
                  {timeLog.description}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900"
                >
                  {#if timeLog.isBillable}
                    {timeLog.formattedAmount}
                  {:else}
                    <span class="text-neutral-500">Non-billable</span>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if timeLog.isApproved}
                    <Badge color="green">Approved</Badge>
                  {:else if timeLog.rejectedAt}
                    <Badge color="red">Rejected</Badge>
                  {:else}
                    <Badge color="yellow">Pending</Badge>
                  {/if}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
                  <Button
                    variant="outline"
                    size="xs"
                    on:click={() => openReviewTimeLogDialog(timeLog)}
                  >
                    {userRole === "client" &&
                    !timeLog.isApproved &&
                    !timeLog.rejectedAt
                      ? "Review"
                      : "View"}
                  </Button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div
          class="px-6 py-3 border-t border-neutral-200 flex items-center justify-between"
        >
          <div
            class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"
          >
            <div>
              <p class="text-sm text-neutral-700">
                Page {currentPage} of {totalPages}
              </p>
            </div>
            <div>
              <nav
                class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50"
                  on:click={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <span class="sr-only">Previous</span>
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <button
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50"
                  on:click={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <span class="sr-only">Next</span>
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      {/if}
    </Card>
  {/if}
</div>
