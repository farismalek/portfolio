<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { applyToJob } from "$lib/services/jobService";
  import Modal from "$lib/components/common/Modal.svelte";
  import TextField from "$lib/components/common/TextField.svelte";
  import TextAreaField from "$lib/components/common/TextAreaField.svelte";
  import DatePickerField from "$lib/components/common/DatePickerField.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import FileUploadField from "$lib/components/common/FileUploadField.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import CurrencyField from "$lib/components/common/CurrencyField.svelte";
  import { authStore } from "$lib/stores/authStore";
  import { format } from "date-fns";

  export let job;
  export let open = false;
  export let onClose = () => {};
  export let onSuccess = () => {};

  const dispatch = createEventDispatcher();

  // Form fields
  let resumeFile = null;
  let coverLetter = "";
  let salaryExpectation = job?.minSalary || "";
  let availableStartDate = "";
  let isLoading = false;
  let error = "";

  // Reset form when job changes
  $: if (job) {
    resetForm();
  }

  function resetForm() {
    resumeFile = null;
    coverLetter = "";
    salaryExpectation = job?.minSalary || "";
    availableStartDate = "";
    error = "";
  }

  async function handleSubmit() {
    // Validate form
    if (!resumeFile) {
      error = "Resume is required";
      return;
    }

    if (!coverLetter.trim()) {
      error = "Cover letter is required";
      return;
    }

    try {
      isLoading = true;
      error = "";

      // Upload resume file first
      const resumeUrl = await uploadResume();

      // Create application
      await applyToJob(job.id, {
        resumeUrl,
        coverLetter,
        salaryExpectation: parseInt(salaryExpectation) || undefined,
        availableStartDate: availableStartDate
          ? format(new Date(availableStartDate), "yyyy-MM-dd")
          : undefined,
      });

      // Notify parent component
      onSuccess();
      dispatch("success");

      // Reset form
      resetForm();
    } catch (err) {
      error = err.message || "Failed to submit application";
      console.error("Application error:", err);
    } finally {
      isLoading = false;
    }
  }

  // Mock function to simulate file upload
  async function uploadResume() {
    // In a real app, this would upload to your backend
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return "https://storage.example.com/resumes/sample-resume.pdf";
  }
</script>

<Modal {open} title="Apply for {job?.title}" {onClose} maxWidth="md">
  <form on:submit|preventDefault={handleSubmit}>
    <div class="space-y-4">
      {#if error}
        <div class="bg-red-50 p-3 rounded-md text-red-700 text-sm">
          {error}
        </div>
      {/if}

      <div class="bg-neutral-50 p-4 rounded-md mb-4">
        <h3 class="font-medium mb-1">{job?.title}</h3>
        <p class="text-sm text-neutral-600">
          {job?.company?.name}
          {#if job?.location}
            • {job?.location?.city}{job?.location?.state
              ? `, ${job?.location?.state}`
              : ""}
          {/if}
        </p>
      </div>

      <FileUploadField
        label="Resume/CV"
        bind:file={resumeFile}
        accept=".pdf,.doc,.docx"
        required
        helpText="Upload your resume (PDF, Word)"
      />

      <TextAreaField
        label="Cover Letter"
        bind:value={coverLetter}
        required
        rows={6}
        placeholder="Introduce yourself and explain why you're a good fit for this position"
      />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CurrencyField
          label="Salary Expectation"
          bind:value={salaryExpectation}
          currency={job?.salaryCurrency || "USD"}
          helpText={`${job?.salaryPeriod || "yearly"}`}
        />

        <DatePickerField
          label="Available Start Date"
          bind:value={availableStartDate}
          placeholder="Select date"
          min={format(new Date(), "yyyy-MM-dd")}
        />
      </div>

      <div class="mt-2 text-xs text-neutral-500">
        By applying, you agree to share your profile and resume with the
        employer.
      </div>
    </div>

    <div class="mt-6 flex justify-end gap-3">
      <Button type="button" variant="neutral" on:click={onClose}>Cancel</Button>
      <Button type="submit" variant="primary" disabled={isLoading}>
        {#if isLoading}
          <LoadingSpinner size="sm" class="mr-2" />
          Submitting...
        {:else}
          Submit Application
        {/if}
      </Button>
    </div>
  </form>
</Modal>
