<script lang="ts">
  import { onMount } from "svelte";
  import { getProjects } from "$lib/services/freelanceService";
  import ProjectCard from "./ProjectCard.svelte";
  import LoadingSpinner from "../common/LoadingSpinner.svelte";

  export let category = null;
  export let projectId = null;
  export let skills = [];

  let isLoading = false;
  let similarProjects = [];

  onMount(async () => {
    await loadSimilarProjects();
  });

  async function loadSimilarProjects() {
    if (!projectId) return;

    try {
      isLoading = true;

      // First try to get projects in the same category
      if (category) {
        const { items } = await getProjects({
          category,
          limit: 4,
        });

        // Filter out the current project
        similarProjects = items.filter((project) => project.id !== projectId);
      }

      // If we don't have enough category projects, supplement with skill-based recommendations
      if (similarProjects.length < 3 && skills.length > 0) {
        const { items } = await getProjects({
          skills: skills.slice(0, 2), // Use the first 2 skills
          limit: 4,
        });

        // Filter out the current project and any already included projects
        const existingIds = new Set([
          projectId,
          ...similarProjects.map((p) => p.id),
        ]);
        const additionalProjects = items.filter(
          (project) => !existingIds.has(project.id),
        );

        // Add as many as needed up to 3 total
        similarProjects = [
          ...similarProjects,
          ...additionalProjects.slice(0, 3 - similarProjects.length),
        ];
      }

      // If we still don't have enough, just get recent projects
      if (similarProjects.length < 3) {
        const { items } = await getProjects({
          recent: true,
          limit: 4,
        });

        // Filter out the current project and any already included projects
        const existingIds = new Set([
          projectId,
          ...similarProjects.map((p) => p.id),
        ]);
        const additionalProjects = items.filter(
          (project) => !existingIds.has(project.id),
        );

        // Add as many as needed up to 3 total
        similarProjects = [
          ...similarProjects,
          ...additionalProjects.slice(0, 3 - similarProjects.length),
        ];
      }
    } catch (err) {
      console.error("Failed to load similar projects:", err);
    } finally {
      isLoading = false;
    }
  }
</script>

{#if isLoading}
  <div class="py-8 flex justify-center">
    <LoadingSpinner />
  </div>
{:else if similarProjects.length > 0}
  <div>
    <h2 class="text-xl font-medium mb-4">Similar Projects</h2>

    <div class="grid grid-cols-1 gap-4">
      {#each similarProjects as project (project.id)}
        <ProjectCard {project} />
      {/each}
    </div>
  </div>
{/if}
