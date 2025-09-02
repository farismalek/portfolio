<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import Modal from "../common/Modal.svelte";
  import Button from "../common/Button.svelte";
  import UserSearchSelect from "../common/UserSearchSelect.svelte";
  import { addWorkspaceMembers } from "$lib/services/workspaceService";
  import { authUser } from "$lib/stores/authStore";
  import { WorkspaceRole } from "$lib/types/workspace";

  export let open = false;
  export let workspaceId;

  let selectedUsers = [];
  let selectedRole = WorkspaceRole.EDITOR;
  let isSubmitting = false;
  let error = null;

  const dispatch = createEventDispatcher();

  $: isValid = selectedUsers.length > 0;

  const roleOptions = [
    { value: WorkspaceRole.ADMIN, label: "Admin" },
    { value: WorkspaceRole.EDITOR, label: "Editor" },
    { value: WorkspaceRole.VIEWER, label: "Viewer" },
  ];

  function handleClose() {
    dispatch("close");
    resetForm();
  }

  function resetForm() {
    selectedUsers = [];
    selectedRole = WorkspaceRole.EDITOR;
    error = null;
    isSubmitting = false;
  }

  async function handleSubmit() {
    if (!isValid || isSubmitting || !$authUser) return;

    isSubmitting = true;
    error = null;

    try {
      const userIds = selectedUsers.map((user) => user.id);

      await addWorkspaceMembers(workspaceId, {
        userIds,
        role: selectedRole,
      });

      dispatch("members-added", { userIds, role: selectedRole });
      resetForm();
    } catch (err) {
      console.error("Failed to invite members:", err);
      error = err.message || "Failed to invite members. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Modal {open} on:close={handleClose} size="md">
  <svelte:fragment slot="title">Invite Members</svelte:fragment>

  <svelte:fragment slot="content">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1">
          Select Users
        </label>
        <UserSearchSelect
          bind:selectedUsers
          multiple={true}
          placeholder="Search for users to invite..."
        />
        <p class="mt-1 text-xs text-neutral-500">
          You can invite up to 20 users at once.
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1">
          Role
        </label>
        <select
          bind:value={selectedRole}
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          disabled={isSubmitting}
        >
          {#each roleOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>

        <div class="mt-2 text-xs text-neutral-600">
          {#if selectedRole === WorkspaceRole.ADMIN}
            <p>
              <strong>Admin:</strong> Can manage workspace settings, members, and
              all content.
            </p>
          {:else if selectedRole === WorkspaceRole.EDITOR}
            <p>
              <strong>Editor:</strong> Can create and edit projects, tasks, and files,
              but cannot manage workspace settings.
            </p>
          {:else if selectedRole === WorkspaceRole.VIEWER}
            <p>
              <strong>Viewer:</strong> Can view all content but cannot create or
              edit anything.
            </p>
          {/if}
        </div>
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
      Invite
    </Button>
  </svelte:fragment>
</Modal>
