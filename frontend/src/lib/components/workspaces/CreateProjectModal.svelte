<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import Modal from "../common/Modal.svelte";
  import Button from "../common/Button.svelte";
  import { createProject } from "$lib/services/projectService";
  import { authUser } from "$lib/stores/authStore";
  import { projectsStore } from "$lib/stores/projectsStore";

  export let open = false;
  export let workspaceId;

  let name = "";
  let description = "";
  let startDate = "";
  let dueDate = "";
  let isSubmitting = false;
  let error = null;

  const dispatch = createEventDispatcher();

  $: isValid = name.trim().length > 0;
  $: isDateValid =
    !startDate || !dueDate || new Date(startDate) <= new Date(dueDate);

  function handleClose() {
    dispatch("close");
    resetForm();
  }

  function resetForm() {
    name = "";
    description = "";
    startDate = "";
    dueDate = "";
    error = null;
    isSubmitting = false;
  }

  async function handleSubmit() {
    if (!isValid || !isDateValid || isSubmitting || !$authUser) return;

    isSubmitting = true;
    error = null;

    try {
      const project = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        workspaceId,
        createdById: $authUser.id,
        status: "active",
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
      });

      // Add to store
      projectsStore.addProject(project);

      dispatch("created", project);
      resetForm();
    } catch (err) {
      console.error("Failed to create project:", err);
      error = err.message || "Failed to create project. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Modal {open} on:close={handleClose} size="md">
  <svelte:fragment slot="title">Create a Project</svelte:fragment>

  <svelte:fragment slot="content">
    <div class="space-y-4">
      <div>
        <label
          for="project-name"
          class="block text-sm font-medium text-neutral-700 mb-1"
        >
          Project Name*
        </label>
        <input
          id="project-name"
          type="text"
          bind:value={name}
          placeholder="Enter project name"
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          for="project-description"
          class="block text-sm font-medium text-neutral-700 mb-1"
        >
          Description <span class="text-neutral-400">(optional)</span>
        </label>
        <textarea
          id="project-description"
          bind:value={description}
          placeholder="Describe what this project is about"
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500 h-24 resize-none"
          disabled={isSubmitting}
        ></textarea>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            for="start-date"
            class="block text-sm font-medium text-neutral-700 mb-1"
          >
            Start Date <span class="text-neutral-400">(optional)</span>
          </label>
          <input
            id="start-date"
            type="date"
            bind:value={startDate}
            class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            for="due-date"
            class="block text-sm font-medium text-neutral-700 mb-1"
          >
            Due Date <span class="text-neutral-400">(optional)</span>
          </label>
          <input
            id="due-date"
            type="date"
            bind:value={dueDate}
            class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {#if !isDateValid}
        <div class="p-3 bg-yellow-50 text-yellow-700 text-sm rounded">
          Due date must be after start date.
        </div>
      {/if}

      {#if error}
        <div
          class="p-3 bg-red-50 text-red-700 text-sm rounded"
          transition:fade={{ duration: 200 }}
        >
          {error}
        </div>
      {/if}
    </div>
  </svelte:fragment>

  <svelte:fragment slot="footer">
    <Button variant="outline" on:click={handleClose} disabled={isSubmitting}>
      Cancel
    </Button>
    <Button
      variant="primary"
      disabled={!isValid || !isDateValid || isSubmitting}
      loading={isSubmitting}
      on:click={handleSubmit}
    >
      Create Project
    </Button>
  </svelte:fragment>
</Modal>
