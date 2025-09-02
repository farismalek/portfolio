<script lang="ts">
  import { onMount } from "svelte";
  import { dndzone } from "svelte-dnd-action";
  import { fade, slide } from "svelte/transition";
  import { tasksStore } from "$lib/stores/tasksStore";
  import { workspaceStore } from "$lib/stores/workspaceStore";
  import { TaskStatus, TaskPriority } from "$lib/types/workspace";
  import { authUser } from "$lib/stores/authStore";
  import Button from "../common/Button.svelte";
  import TaskCard from "./TaskCard.svelte";
  import CreateTaskModal from "./CreateTaskModal.svelte";
  import TaskDetailModal from "./TaskDetailModal.svelte";
  import LoadingSpinner from "../common/LoadingSpinner.svelte";

  export let workspaceId;
  export let projectId = null;
  export let canEdit = false;

  let isLoading = true;
  let showCreateModal = false;
  let selectedTaskId = null;
  let showDetailModal = false;

  const statusColumns = [
    { id: TaskStatus.BACKLOG, name: "Backlog" },
    { id: TaskStatus.TODO, name: "To Do" },
    { id: TaskStatus.IN_PROGRESS, name: "In Progress" },
    { id: TaskStatus.REVIEW, name: "Review" },
    { id: TaskStatus.DONE, name: "Done" },
  ];

  onMount(async () => {
    isLoading = true;
    try {
      await tasksStore.loadTasks(workspaceId, projectId);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      isLoading = false;
    }
  });

  function handleTaskClick(taskId) {
    selectedTaskId = taskId;
    showDetailModal = true;
  }

  function handleCreateTask() {
    showCreateModal = true;
  }

  function handleTaskCreated(event) {
    showCreateModal = false;
    // The task is automatically added to the store
  }

  function handleDndConsider(event) {
    const { items, info } = event.detail;
    tasksStore.update((state) => {
      const result = { ...state };
      // Update the items for the list being considered
      result.tasks[info.id] = items;
      return result;
    });
  }

  function handleDndFinalize(event) {
    const { items, info } = event.detail;
    const sourceStatus = info.id;
    const destinationStatus = info.id;

    // If the task was moved within the same column, just update order
    if (event.detail.info.trigger === "reorder") {
      const newTaskIds = items.map((task) => task.id);
      tasksStore.reorderTasks(newTaskIds, destinationStatus);
    } else {
      // Otherwise, handle cross-column movement
      const taskId = event.detail.info.id;
      const newIndex = items.findIndex((task) => task.id === taskId);

      tasksStore.moveTask(taskId, sourceStatus, destinationStatus, newIndex);
    }
  }
</script>

<div class="h-full flex flex-col">
  <div class="flex justify-between items-center mb-4">
    <div>
      <h2 class="text-xl font-semibold text-neutral-900">Tasks Board</h2>
      <p class="text-sm text-neutral-500">
        {projectId ? `Tasks for project ${projectId}` : "All workspace tasks"}
      </p>
    </div>

    {#if canEdit}
      <Button variant="primary" on:click={handleCreateTask}>
        <svg
          class="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Task
      </Button>
    {/if}
  </div>

  {#if isLoading}
    <div class="flex justify-center py-12">
      <LoadingSpinner />
    </div>
  {:else}
    <div class="flex-1 overflow-x-auto">
      <div class="flex h-full space-x-4 pb-4">
        {#each statusColumns as column (column.id)}
          <div class="w-72 flex-shrink-0 flex flex-col h-full">
            <!-- Column header -->
            <div
              class="bg-neutral-100 rounded-t-md p-3 flex justify-between items-center"
            >
              <h3 class="font-medium text-neutral-700">{column.name}</h3>
              <span
                class="bg-neutral-200 text-neutral-700 text-xs px-2 py-0.5 rounded-full"
              >
                {$tasksStore.tasks[column.id]?.length || 0}
              </span>
            </div>

            <!-- Column content with tasks -->
            <div
              class="flex-1 bg-neutral-50 rounded-b-md p-2 overflow-y-auto"
              use:dndzone={{
                items: $tasksStore.tasks[column.id],
                type: "task",
                dropTargetStyle: {},
                dropFromOthersDisabled: !canEdit,
                dragDisabled: !canEdit,
                id: column.id,
              }}
              on:consider={handleDndConsider}
              on:finalize={handleDndFinalize}
            >
              {#if $tasksStore.tasks[column.id].length === 0}
                <div
                  class="h-full flex flex-col items-center justify-center p-4 text-center text-neutral-400"
                >
                  <svg
                    class="w-10 h-10 mb-2 text-neutral-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  <p class="text-sm">No tasks</p>
                </div>
              {:else}
                {#each $tasksStore.tasks[column.id] as task (task.id)}
                  <div class="mb-2" animate:fade={{ duration: 200 }}>
                    <TaskCard
                      {task}
                      onClick={() => handleTaskClick(task.id)}
                      {canEdit}
                    />
                  </div>
                {/each}
              {/if}

              {#if canEdit && !$tasksStore.tasks[column.id].length}
                <div class="mt-2">
                  <button
                    class="w-full py-2 px-3 bg-white border border-dashed border-neutral-300 rounded-md text-sm text-neutral-500 hover:bg-neutral-50 hover:border-neutral-400 transition-colors text-center"
                    on:click={() => {
                      showCreateModal = true;
                    }}
                  >
                    <svg
                      class="w-4 h-4 mx-auto mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add a task
                  </button>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Modals -->
<CreateTaskModal
  open={showCreateModal}
  {workspaceId}
  {projectId}
  on:close={() => (showCreateModal = false)}
  on:created={handleTaskCreated}
/>

<TaskDetailModal
  open={showDetailModal}
  taskId={selectedTaskId}
  {canEdit}
  on:close={() => (showDetailModal = false)}
  on:updated={() => tasksStore.loadTasks(workspaceId, projectId)}
  on:deleted={() => {
    showDetailModal = false;
    tasksStore.loadTasks(workspaceId, projectId);
  }}
/>
