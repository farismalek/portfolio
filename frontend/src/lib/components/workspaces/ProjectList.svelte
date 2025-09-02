<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { projectsStore } from "$lib/stores/projectsStore";
  import Button from "../common/Button.svelte";
  import ProjectCard from "./ProjectCard.svelte";
  import LoadingSpinner from "../common/LoadingSpinner.svelte";

  export let workspaceId;
  export let canCreate = false;

  let isLoading = true;

  onMount(async () => {
    isLoading = true;
    try {
      await projectsStore.loadProjects(workspaceId);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      isLoading = false;
    }
  });

  function handleCreate() {
    dispatch("create");
  }

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
</script>

<div>
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-semibold text-neutral-900">Projects</h2>

    {#if canCreate}
      <Button variant="primary" size="sm" on:click={handleCreate}>
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
        New Project
      </Button>
    {/if}
  </div>

  {#if isLoading}
    <div class="flex justify-center py-12">
      <LoadingSpinner />
    </div>
  {:else if $projectsStore.projects.length === 0}
    <div
      class="bg-white rounded-lg border border-neutral-200 shadow-sm p-8 text-center"
    >
      <div
        class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4"
      >
        <svg
          class="w-8 h-8 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-neutral-900 mb-2">No projects yet</h3>
      <p class="text-neutral-600 max-w-md mx-auto mb-6">
        {#if canCreate}
          Create your first project to organize your work, track tasks, and
          collaborate with your team.
        {:else}
          There are no projects in this workspace yet.
        {/if}
      </p>

      {#if canCreate}
        <Button variant="primary" on:click={handleCreate}>
          Create First Project
        </Button>
      {/if}
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each $projectsStore.projects as project (project.id)}
        <div transition:fade={{ duration: 200 }}>
          <ProjectCard {project} />
        </div>
      {/each}
    </div>
  {/if}
</div>
