<script lang="ts">
  import { onMount } from "svelte";
  import { format } from "date-fns";
  import {
    createMilestone,
    updateMilestoneStatus,
  } from "$lib/services/contractsService";
  import Card from "$lib/components/common/Card.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Badge from "$lib/components/common/Badge.svelte";
  import Dialog from "$lib/components/common/Dialog.svelte";
  import TextField from "$lib/components/common/TextField.svelte";
  import TextAreaField from "$lib/components/common/TextAreaField.svelte";
  import DatePickerField from "$lib/components/common/DatePickerField.svelte";
  import CurrencyField from "$lib/components/common/CurrencyField.svelte";
  import FileUploadField from "$lib/components/common/FileUploadField.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";

  export let contract;
  export let userRole = "freelancer"; // 'client' or 'freelancer'
  export let onUpdate = () => {};

  let isAddingMilestone = false;
  let isUpdatingMilestone = false;
  let selectedMilestone = null;
  let files = [];
  let rejectionReason = "";
  let isLoading = false;
  let error = "";

  // Milestone form fields
  let milestoneTitle = "";
  let milestoneDescription = "";
  let milestoneDueDate = "";
  let milestoneAmount = 0;

  // Status color mapping
  const statusColors = {
    pending: "neutral",
    in_progress: "blue",
    submitted: "yellow",
    approved: "green",
    rejected: "red",
  };

  // Status display names
  const statusNames = {
    pending: "Pending",
    in_progress: "In Progress",
    submitted: "Submitted",
    approved: "Approved",
    rejected: "Changes Requested",
  };

  function resetForm() {
    milestoneTitle = "";
    milestoneDescription = "";
    milestoneDueDate = "";
    milestoneAmount = contract?.totalAmount
      ? Math.round(contract.totalAmount * 0.5)
      : 0;
    files = [];
    rejectionReason = "";
    error = "";
  }

  function openAddMilestoneDialog() {
    resetForm();
    isAddingMilestone = true;
  }

  function openUpdateMilestoneDialog(milestone, action) {
    selectedMilestone = milestone;
    isUpdatingMilestone = true;

    // Reset fields
    rejectionReason = "";
    files = [];
    error = "";
  }

  async function handleAddMilestone() {
    try {
      if (!milestoneTitle.trim()) {
        error = "Title is required";
        return;
      }

      if (!milestoneAmount || milestoneAmount <= 0) {
        error = "Amount must be greater than 0";
        return;
      }

      isLoading = true;
      error = "";

      await createMilestone(contract.id, {
        title: milestoneTitle,
        description: milestoneDescription,
        dueDate: milestoneDueDate,
        amount: milestoneAmount,
      });

      isAddingMilestone = false;
      await onUpdate();
    } catch (err) {
      error = err.message || "Failed to add milestone";
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function startMilestone(milestoneId) {
    try {
      isLoading = true;
      error = "";

      await updateMilestoneStatus(milestoneId, "in_progress");
      await onUpdate();
    } catch (err) {
      error = err.message || "Failed to start milestone";
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function submitMilestone(milestoneId) {
    try {
      if (files.length === 0) {
        error = "Please attach at least one file for submission";
        return;
      }

      isLoading = true;
      error = "";

      // Upload files (mock)
      const attachmentUrls = await Promise.all(
        files.map(
          async (file) =>
            `https://storage.example.com/milestones/${milestoneId}/${file.name}`,
        ),
      );

      await updateMilestoneStatus(milestoneId, "submitted", { attachmentUrls });
      isUpdatingMilestone = false;
      await onUpdate();
    } catch (err) {
      error = err.message || "Failed to submit milestone";
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function approveMilestone(milestoneId) {
    try {
      isLoading = true;
      error = "";

      await updateMilestoneStatus(milestoneId, "approved");
      isUpdatingMilestone = false;
      await onUpdate();
    } catch (err) {
      error = err.message || "Failed to approve milestone";
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function rejectMilestone(milestoneId) {
    try {
      if (!rejectionReason.trim()) {
        error = "Please provide feedback for the changes needed";
        return;
      }

      isLoading = true;
      error = "";

      await updateMilestoneStatus(milestoneId, "rejected", { rejectionReason });
      isUpdatingMilestone = false;
      await onUpdate();
    } catch (err) {
      error = err.message || "Failed to reject milestone";
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
</script>

<!-- Add milestone dialog -->
<Dialog
  open={isAddingMilestone}
  title="Add New Milestone"
  onClose={() => (isAddingMilestone = false)}
>
  <div class="py-4 space-y-4">
    <TextField
      label="Milestone Title"
      bind:value={milestoneTitle}
      placeholder="e.g. Design Phase"
      required
    />

    <TextAreaField
      label="Description"
      bind:value={milestoneDescription}
      placeholder="Describe what should be delivered in this milestone"
      rows={3}
    />

    <div class="grid grid-cols-2 gap-4">
      <DatePickerField
        label="Due Date"
        bind:value={milestoneDueDate}
        placeholder="Select a date"
      />

      <CurrencyField
        label="Amount"
        bind:value={milestoneAmount}
        currency={contract?.currency || "USD"}
      />
    </div>

    {#if error}
      <AlertBox type="error">
        {error}
      </AlertBox>
    {/if}
  </div>

  <svelte:fragment slot="footer">
    <Button variant="neutral" on:click={() => (isAddingMilestone = false)}
      >Cancel</Button
    >
    <Button
      variant="primary"
      on:click={handleAddMilestone}
      disabled={isLoading}
    >
      {#if isLoading}
        <LoadingSpinner size="sm" class="mr-2" />
        Adding...
      {:else}
        Add Milestone
      {/if}
    </Button>
  </svelte:fragment>
</Dialog>

<!-- Update milestone dialog -->
<Dialog
  open={isUpdatingMilestone}
  title={selectedMilestone?.status === "submitted" && userRole === "client"
    ? "Review Milestone Submission"
    : selectedMilestone?.status === "in_progress" && userRole === "freelancer"
      ? "Submit Milestone for Review"
      : "Update Milestone"}
  onClose={() => (isUpdatingMilestone = false)}
>
  <div class="py-4 space-y-4">
    {#if selectedMilestone}
      <div class="mb-4">
        <h3 class="font-medium">{selectedMilestone.title}</h3>
        {#if selectedMilestone.description}
          <p class="text-sm text-neutral-600 mt-1">
            {selectedMilestone.description}
          </p>
        {/if}
        <div class="flex items-center mt-2">
          <Badge color={statusColors[selectedMilestone.status] || "neutral"}>
            {statusNames[selectedMilestone.status] || selectedMilestone.status}
          </Badge>
          <span class="ml-3 text-sm text-neutral-500">
            {selectedMilestone.formattedAmount}
          </span>
        </div>
      </div>

      {#if selectedMilestone.status === "in_progress" && userRole === "freelancer"}
        <!-- Freelancer submitting milestone -->
        <FileUploadField
          label="Deliverables"
          bind:files
          multiple
          accept="*/*"
          required
          helpText="Upload files related to this milestone"
        />
      {:else if selectedMilestone.status === "submitted" && userRole === "client"}
        <!-- Client reviewing milestone -->
        <div class="mb-4">
          <h4 class="text-sm font-medium mb-2">Attached Files:</h4>
          {#if selectedMilestone.attachmentUrls && selectedMilestone.attachmentUrls.length > 0}
            <div class="space-y-2">
              {#each selectedMilestone.attachmentUrls as url, i}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center p-2 border border-neutral-200 rounded hover:border-primary-300 hover:bg-primary-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-2 text-neutral-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  <span>Attachment {i + 1}</span>
                </a>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-neutral-500">No files attached</p>
          {/if}

          <div class="mt-4">
            <h4 class="text-sm font-medium mb-2">Actions:</h4>
            <div class="space-x-2">
              <Button
                variant="success"
                size="sm"
                on:click={() => approveMilestone(selectedMilestone.id)}
                disabled={isLoading}
              >
                {#if isLoading}
                  <LoadingSpinner size="sm" class="mr-1" />
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                {/if}
                Approve & Pay
              </Button>

              <Button variant="danger" size="sm">
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Request Changes
              </Button>
            </div>
          </div>

          <TextAreaField
            label="Feedback (required for rejection)"
            bind:value={rejectionReason}
            placeholder="Explain what changes are needed"
            rows={3}
            class="mt-4"
          />
        </div>
      {/if}

      {#if error}
        <AlertBox type="error">
          {error}
        </AlertBox>
      {/if}
    {/if}
  </div>

  <svelte:fragment slot="footer">
    <Button variant="neutral" on:click={() => (isUpdatingMilestone = false)}
      >Cancel</Button
    >

    {#if selectedMilestone?.status === "in_progress" && userRole === "freelancer"}
      <Button
        variant="primary"
        on:click={() => submitMilestone(selectedMilestone.id)}
        disabled={isLoading}
      >
        {#if isLoading}
          <LoadingSpinner size="sm" class="mr-2" />
          Submitting...
        {:else}
          Submit for Review
        {/if}
      </Button>
    {:else if selectedMilestone?.status === "submitted" && userRole === "client"}
      <Button
        variant="danger"
        on:click={() => rejectMilestone(selectedMilestone.id)}
        disabled={isLoading || !rejectionReason.trim()}
      >
        {#if isLoading}
          <LoadingSpinner size="sm" class="mr-2" />
          Submitting...
        {:else}
          Request Changes
        {/if}
      </Button>
    {/if}
  </svelte:fragment>
</Dialog>

<!-- Milestones content -->
<div>
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-medium">Milestones</h2>

    {#if userRole === "client" && contract.status === "draft"}
      <Button variant="outline" size="sm" on:click={openAddMilestoneDialog}>
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
        Add Milestone
      </Button>
    {/if}
  </div>

  {#if contract.milestones && contract.milestones.length > 0}
    <div class="space-y-6">
      {#each contract.milestones as milestone, index (milestone.id)}
        <Card class="overflow-visible">
          <div class="p-6">
            <div class="flex flex-wrap lg:flex-nowrap justify-between">
              <!-- Left side - milestone info -->
              <div class="w-full lg:w-2/3">
                <div class="flex items-center mb-2">
                  <div
                    class="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-200 text-neutral-700 text-xs font-medium mr-2"
                  >
                    {index + 1}
                  </div>
                  <h3 class="text-lg font-medium">{milestone.title}</h3>
                  <Badge
                    color={statusColors[milestone.status] || "neutral"}
                    class="ml-3"
                  >
                    {statusNames[milestone.status] || milestone.status}
                  </Badge>
                </div>

                {#if milestone.description}
                  <p class="text-neutral-600 text-sm mb-4">
                    {milestone.description}
                  </p>
                {/if}

                <div class="flex flex-wrap gap-6 text-sm">
                  <div>
                    <div class="text-neutral-500 mb-1">Amount</div>
                    <div class="font-medium">{milestone.formattedAmount}</div>
                  </div>

                  {#if milestone.dueDate}
                    <div>
                      <div class="text-neutral-500 mb-1">Due Date</div>
                      <div class="font-medium">
                        {format(new Date(milestone.dueDate), "MMM d, yyyy")}
                        {#if milestone.isOverdue}
                          <span class="text-red-600 ml-1"
                            >({Math.abs(milestone.daysUntilDue)} days overdue)</span
                          >
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>

                {#if milestone.rejectionReason}
                  <div class="mt-4 bg-red-50 p-3 rounded-md">
                    <div class="text-sm text-red-800 font-medium mb-1">
                      Changes Requested:
                    </div>
                    <p class="text-sm text-red-700">
                      {milestone.rejectionReason}
                    </p>
                  </div>
                {/if}
              </div>

              <!-- Right side - actions -->
              <div
                class="w-full lg:w-1/3 mt-4 lg:mt-0 flex flex-col items-start lg:items-end"
              >
                {#if milestone.status === "approved"}
                  <div class="flex items-center text-green-600 mb-3">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span
                      >{milestone.isPaid
                        ? "Completed & Paid"
                        : "Completed"}</span
                    >
                  </div>
                {:else if milestone.status === "pending" && contract.status === "active" && userRole === "client"}
                  <Button
                    variant="primary"
                    size="sm"
                    on:click={() => startMilestone(milestone.id)}
                    class="mb-2"
                  >
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
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Start Milestone
                  </Button>
                {:else if milestone.status === "in_progress" && userRole === "freelancer"}
                  <Button
                    variant="primary"
                    size="sm"
                    on:click={() =>
                      openUpdateMilestoneDialog(milestone, "submit")}
                    class="mb-2"
                  >
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Submit for Review
                  </Button>
                {:else if milestone.status === "submitted" && userRole === "client"}
                  <Button
                    variant="success"
                    size="sm"
                    on:click={() =>
                      openUpdateMilestoneDialog(milestone, "review")}
                    class="mb-2"
                  >
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Review Submission
                  </Button>
                {:else if milestone.status === "rejected" && userRole === "freelancer"}
                  <Button
                    variant="warning"
                    size="sm"
                    on:click={() =>
                      openUpdateMilestoneDialog(milestone, "submit")}
                    class="mb-2"
                  >
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Resubmit
                  </Button>
                {/if}

                {#if milestone.attachmentUrls && milestone.attachmentUrls.length > 0 && milestone.status !== "pending"}
                  <Button
                    variant="neutral"
                    size="xs"
                    on:click={() =>
                      openUpdateMilestoneDialog(milestone, "view")}
                  >
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
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    View Deliverables
                  </Button>
                {/if}
              </div>
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {:else}
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-neutral-900">
          No milestones defined
        </h3>
        <p class="mt-2 text-neutral-600 max-w-md mx-auto">
          This contract doesn't have any milestones defined yet.
        </p>

        {#if userRole === "client" && contract.status === "draft"}
          <div class="mt-6">
            <Button variant="primary" on:click={openAddMilestoneDialog}>
              Add Milestone
            </Button>
          </div>
        {/if}
      </div>
    </Card>
  {/if}
</div>
