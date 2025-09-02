<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import Modal from "../common/Modal.svelte";
  import Button from "../common/Button.svelte";
  import { createWorkspace } from "$lib/services/workspaceService";
  import { authUser } from "$lib/stores/authStore";

  export let open = false;

  let name = "";
  let description = "";
  let isSubmitting = false;
  let error = null;

  const dispatch = createEventDispatcher();

  $: isValid = name.trim().length > 0;

  function handleClose() {
    dispatch("close");
    resetForm();
  }

  function resetForm() {
    name = "";
    description = "";
    error = null;
    isSubmitting = false;
  }

  async function handleSubmit() {
    if (!isValid || isSubmitting || !$authUser) return;

    isSubmitting = true;
    error = null;

    try {
      const workspace = await createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
        ownerId: $authUser.id,
      });

      dispatch("created", workspace);
      resetForm();
    } catch (err) {
      console.error("Failed to create workspace:", err);
      error = err.message || "Failed to create workspace. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Modal {open} on:close={handleClose} size="md">
  <svelte:fragment slot="title">Create a Workspace</svelte:fragment>

  <svelte:fragment slot="content">
    <div class="space-y-4">
      <div>
        <label
          for="workspace-name"
          class="block text-sm font-medium text-neutral-700 mb-1"
        >
          Workspace Name*
        </label>
        <input
          id="workspace-name"
          type="text"
          bind:value={name}
          placeholder="Enter workspace name"
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          for="workspace-description"
          class="block text-sm font-medium text-neutral-700 mb-1"
        >
          Description <span class="text-neutral-400">(optional)</span>
        </label>
        <textarea
          id="workspace-description"
          bind:value={description}
          placeholder="Describe what this workspace is for"
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500 h-24 resize-none"
          disabled={isSubmitting}
        ></textarea>
      </div>

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
      disabled={!isValid || isSubmitting}
      loading={isSubmitting}
      on:click={handleSubmit}
    >
      Create Workspace
    </Button>
  </svelte:fragment>
</Modal>
