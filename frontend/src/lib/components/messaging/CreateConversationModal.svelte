<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import Modal from "../common/Modal.svelte";
  import Button from "../common/Button.svelte";
  import UserSearchSelect from "../common/UserSearchSelect.svelte";
  import { createConversation } from "$lib/services/conversationService";
  import { authUser } from "$lib/stores/authStore";
  import { ConversationType } from "$lib/types/network";

  export let open = false;

  let selectedType: ConversationType = ConversationType.DIRECT;
  let selectedUsers = [];
  let groupTitle = "";
  let isSubmitting = false;
  let error: string | null = null;
  let step = 1;

  const dispatch = createEventDispatcher();

  $: canSubmit =
    selectedUsers.length > 0 &&
    (selectedType === ConversationType.DIRECT ||
      (selectedType === ConversationType.GROUP && groupTitle.trim()));

  function handleClose() {
    dispatch("close");
    resetForm();
  }

  function resetForm() {
    selectedType = ConversationType.DIRECT;
    selectedUsers = [];
    groupTitle = "";
    error = null;
    step = 1;
    isSubmitting = false;
  }

  async function handleSubmit() {
    if (!$authUser || !canSubmit) return;

    isSubmitting = true;
    error = null;

    try {
      const conversation = await createConversation({
        type: selectedType,
        title: selectedType === ConversationType.GROUP ? groupTitle : undefined,
        createdById: $authUser.id,
        participantIds: selectedUsers.map((u) => u.id),
      });

      dispatch("created", conversation);
      resetForm();
    } catch (err) {
      console.error("Failed to create conversation:", err);
      error = err.message || "Failed to create conversation. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }

  function nextStep() {
    if (selectedUsers.length === 0) {
      error = "Please select at least one user";
      return;
    }

    if (selectedType === ConversationType.DIRECT && selectedUsers.length > 1) {
      // Switch to group type if multiple users selected
      selectedType = ConversationType.GROUP;
      step = 2;
    } else if (selectedType === ConversationType.DIRECT) {
      // Direct message with one user, submit directly
      handleSubmit();
    } else {
      // Group conversation, go to name entry step
      step = 2;
    }
  }

  function prevStep() {
    step = 1;
    error = null;
  }
</script>

<Modal {open} on:close={handleClose} size="md">
  <svelte:fragment slot="title">
    {step === 1 ? "New Conversation" : "Create Group Chat"}
  </svelte:fragment>

  <svelte:fragment slot="content">
    {#if step === 1}
      <div class="mb-4">
        <label class="block text-sm font-medium text-neutral-700 mb-1">
          Conversation Type
        </label>
        <div class="flex space-x-4">
          <label class="flex items-center cursor-pointer">
            <input
              type="radio"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
              name="conversationType"
              value={ConversationType.DIRECT}
              bind:group={selectedType}
            />
            <span class="ml-2 text-neutral-700">Direct Message</span>
          </label>
          <label class="flex items-center cursor-pointer">
            <input
              type="radio"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
              name="conversationType"
              value={ConversationType.GROUP}
              bind:group={selectedType}
            />
            <span class="ml-2 text-neutral-700">Group Chat</span>
          </label>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1">
          {selectedType === ConversationType.DIRECT
            ? "Select Recipient"
            : "Select Participants"}
        </label>
        <UserSearchSelect
          bind:selectedUsers
          multiple={selectedType === ConversationType.GROUP}
          placeholder={selectedType === ConversationType.DIRECT
            ? "Search for a user..."
            : "Add group members..."}
        />
        {#if selectedType === ConversationType.GROUP}
          <p class="mt-1 text-xs text-neutral-500">
            You can add up to 50 members to a group chat.
          </p>
        {/if}
      </div>
    {:else if step === 2}
      <div>
        <label
          for="groupTitle"
          class="block text-sm font-medium text-neutral-700 mb-1"
        >
          Group Name
        </label>
        <input
          id="groupTitle"
          type="text"
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          placeholder="Enter group name"
          bind:value={groupTitle}
        />
        <p class="mt-1 text-xs text-neutral-500">
          Selected participants: {selectedUsers.length}
        </p>
      </div>
    {/if}

    {#if error}
      <div
        class="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded"
        transition:fade={{ duration: 200 }}
      >
        {error}
      </div>
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="footer">
    {#if step === 1}
      <Button variant="outline" on:click={handleClose}>Cancel</Button>
      <Button
        variant="primary"
        disabled={selectedUsers.length === 0}
        loading={isSubmitting}
        on:click={nextStep}
      >
        {selectedType === ConversationType.DIRECT
          ? "Start Conversation"
          : "Next"}
      </Button>
    {:else}
      <Button variant="outline" on:click={prevStep}>Back</Button>
      <Button
        variant="primary"
        disabled={!groupTitle.trim()}
        loading={isSubmitting}
        on:click={handleSubmit}
      >
        Create Group
      </Button>
    {/if}
  </svelte:fragment>
</Modal>
