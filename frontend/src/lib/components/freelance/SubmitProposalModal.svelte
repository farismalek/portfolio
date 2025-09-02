<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { submitProposal } from "$lib/services/freelanceService";
  import Modal from "$lib/components/common/Modal.svelte";
  import TextAreaField from "$lib/components/common/TextAreaField.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import FileUploadField from "$lib/components/common/FileUploadField.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import CurrencyField from "$lib/components/common/CurrencyField.svelte";
  import SelectField from "$lib/components/common/SelectField.svelte";
  import { authStore } from "$lib/stores/authStore";

  export let project;
  export let open = false;
  export let onClose = () => {};
  export let onSuccess = () => {};

  const dispatch = createEventDispatcher();

  // Form fields
  let coverLetter = "";
  let paymentAmount =
    project?.budgetType === "fixed"
      ? project?.budgetAmount
      : project?.budgetMinHourly;
  let paymentType = project?.budgetType || "fixed";
  let estimatedDuration = 0;
  let durationUnit = "days";
  let attachmentFiles = [];
  let isLoading = false;
  let error = "";

  // Duration unit options
  const durationUnits = [
    { value: "hours", label: "Hours" },
    { value: "days", label: "Days" },
    { value: "weeks", label: "Weeks" },
    { value: "months", label: "Months" },
  ];

  // Reset form when project changes
  $: if (project) {
    resetForm();
  }

  function resetForm() {
    coverLetter = "";
    paymentAmount =
      project?.budgetType === "fixed"
        ? project?.budgetAmount
        : project?.budgetMinHourly;
    paymentType = project?.budgetType || "fixed";
    estimatedDuration = 0;
    durationUnit = "days";
    attachmentFiles = [];
    error = "";
  }

  async function handleSubmit() {
    // Validate form
    if (!coverLetter.trim()) {
      error = "Cover letter is required";
      return;
    }

    if (
      !paymentAmount ||
      isNaN(Number(paymentAmount)) ||
      Number(paymentAmount) <= 0
    ) {
      error = "Please enter a valid payment amount";
      return;
    }

    try {
      isLoading = true;
      error = "";

      // Upload attachment files if any
      let attachmentUrls = [];
      if (attachmentFiles.length > 0) {
        attachmentUrls = await uploadAttachments();
      }

      // Create proposal
      await submitProposal(project.id, {
        coverLetter,
        paymentAmount: Number(paymentAmount),
        paymentType,
        estimatedDuration:
          estimatedDuration > 0 ? Number(estimatedDuration) : null,
        durationUnit: estimatedDuration > 0 ? durationUnit : null,
        attachmentUrls,
      });

      // Notify parent component
      onSuccess();
      dispatch("success");

      // Reset form
      resetForm();
    } catch (err) {
      error = err.message || "Failed to submit proposal";
      console.error("Proposal error:", err);
    } finally {
      isLoading = false;
    }
  }

  // Mock function to simulate file upload
  async function uploadAttachments() {
    // In a real app, this would upload to your backend
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return attachmentFiles.map(
      (_, i) => `https://storage.example.com/proposals/attachment-${i + 1}.pdf`,
    );
  }
</script>

<Modal {open} title="Submit Proposal" {onClose} maxWidth="md">
  <form on:submit|preventDefault={handleSubmit}>
    <div class="space-y-4">
      {#if error}
        <div class="bg-red-50 p-3 rounded-md text-red-700 text-sm">
          {error}
        </div>
      {/if}

      <div class="bg-neutral-50 p-4 rounded-md mb-4">
        <h3 class="font-medium mb-1">{project?.title}</h3>
        <p class="text-sm text-neutral-600">
          {project?.client?.fullName || project?.client?.username || "Client"}
          {#if project?.company}
            • {project?.company?.name}
          {/if}
        </p>
        {#if project?.formattedBudget}
          <div class="mt-2 text-sm">
            <span class="font-medium">Budget:</span>
            {project?.formattedBudget}
          </div>
        {/if}
      </div>

      <TextAreaField
        label="Cover Letter"
        bind:value={coverLetter}
        required
        rows={6}
        placeholder="Introduce yourself and explain why you're a good fit for this project"
        helpText="Personalize your proposal to stand out"
      />

      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2 md:col-span-1">
          <CurrencyField
            label="Your Rate"
            bind:value={paymentAmount}
            currency={project?.budgetCurrency || "USD"}
            helpText={paymentType === "hourly"
              ? "Hourly rate"
              : "Total project cost"}
            required
          />
        </div>

        <div class="col-span-2 md:col-span-1">
          <SelectField
            label="Payment Type"
            bind:value={paymentType}
            options={[
              { value: "fixed", label: "Fixed Price" },
              { value: "hourly", label: "Hourly Rate" },
            ]}
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-1">
          <TextAreaField
            label="Estimated Duration"
            bind:value={estimatedDuration}
            type="number"
            min="0"
            placeholder="e.g. 14"
            helpText={`How long will this take you? (in ${durationUnit})`}
          />
        </div>

        <div class="col-span-1">
          <SelectField
            label="Duration Unit"
            bind:value={durationUnit}
            options={durationUnits}
          />
        </div>
      </div>

      <FileUploadField
        label="Attachments (Optional)"
        bind:files={attachmentFiles}
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        helpText="Upload relevant work samples or references"
      />

      <div class="mt-2 text-xs text-neutral-500">
        By submitting a proposal, you agree to the terms of service and privacy
        policy.
      </div>
    </div>

    <div class="mt-6 flex justify-end gap-3">
      <Button type="button" variant="neutral" on:click={onClose}>Cancel</Button>
      <Button type="submit" variant="primary" disabled={isLoading}>
        {#if isLoading}
          <LoadingSpinner size="sm" class="mr-2" />
          Submitting...
        {:else}
          Submit Proposal
        {/if}
      </Button>
    </div>
  </form>
</Modal>
