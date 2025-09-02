<script lang="ts">
  import { onMount } from "svelte";
  import { getJobs } from "$lib/services/jobService";
  import JobCard from "./JobCard.svelte";
  import LoadingSpinner from "../common/LoadingSpinner.svelte";

  export let companyId = null;
  export let jobId = null;
  export let skills = [];

  let isLoading = false;
  let similarJobs = [];

  onMount(async () => {
    await loadSimilarJobs();
  });

  async function loadSimilarJobs() {
    if (!jobId) return;

    try {
      isLoading = true;

      // First try to get jobs from the same company
      if (companyId) {
        const { items } = await getJobs({
          companyId,
          limit: 4,
        });

        // Filter out the current job
        similarJobs = items.filter((job) => job.id !== jobId);
      }

      // If we don't have enough company jobs, supplement with skill-based recommendations
      if (similarJobs.length < 3 && skills.length > 0) {
        const { items } = await getJobs({
          skillsRequired: skills.slice(0, 2), // Use the first 2 skills
          limit: 4,
        });

        // Filter out the current job and any already included jobs
        const existingIds = new Set([jobId, ...similarJobs.map((j) => j.id)]);
        const additionalJobs = items.filter((job) => !existingIds.has(job.id));

        // Add as many as needed up to 3 total
        similarJobs = [
          ...similarJobs,
          ...additionalJobs.slice(0, 3 - similarJobs.length),
        ];
      }

      // If we still don't have enough, just get recent jobs
      if (similarJobs.length < 3) {
        const { items } = await getJobs({
          recent: true,
          limit: 4,
        });

        // Filter out the current job and any already included jobs
        const existingIds = new Set([jobId, ...similarJobs.map((j) => j.id)]);
        const additionalJobs = items.filter((job) => !existingIds.has(job.id));

        // Add as many as needed up to 3 total
        similarJobs = [
          ...similarJobs,
          ...additionalJobs.slice(0, 3 - similarJobs.length),
        ];
      }
    } catch (err) {
      console.error("Failed to load similar jobs:", err);
    } finally {
      isLoading = false;
    }
  }
</script>

{#if isLoading}
  <div class="py-8 flex justify-center">
    <LoadingSpinner />
  </div>
{:else if similarJobs.length > 0}
  <div>
    <h2 class="text-xl font-medium mb-4">Similar Jobs</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each similarJobs as job (job.id)}
        <JobCard {job} />
      {/each}
    </div>
  </div>
{/if}
