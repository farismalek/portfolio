<script lang="ts">
  import { formatDistanceToNow } from "date-fns";
  import Badge from "../common/Badge.svelte";

  export let job;

  // Format employment type for display
  $: formattedEmploymentType = job.employmentType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Format experience level for display
  $: formattedExperienceLevel = job.experienceLevel
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Format published date
  $: publishedDate = job.publishedAt
    ? formatDistanceToNow(new Date(job.publishedAt), { addSuffix: true })
    : "Recently";

  // Format location or remote status
  $: locationText =
    job.remotePolicy === "remote"
      ? "Remote"
      : job.location?.city
        ? `${job.location.city}${job.location.state ? `, ${job.location.state}` : ""}`
        : job.remotePolicy === "hybrid"
          ? "Hybrid"
          : "On-site";
</script>

<a href="/jobs/{job.slug}" class="block group">
  <div
    class="bg-white rounded-lg border border-neutral-200 shadow-sm p-5 h-full flex flex-col transition-all duration-200 group-hover:border-primary-300 group-hover:shadow-md"
  >
    <!-- Header -->
    <div class="mb-3 flex justify-between items-start">
      <div>
        <h3
          class="font-semibold text-lg text-neutral-900 group-hover:text-primary-700 transition-colors"
        >
          {job.title}
        </h3>

        {#if job.company}
          <p class="text-neutral-500 text-sm">
            {job.company.name}
          </p>
        {/if}
      </div>

      {#if job.isFeatured}
        <Badge color="yellow">Featured</Badge>
      {/if}
    </div>

    <!-- Job details -->
    <div class="space-y-2 flex-grow">
      {#if job.shortDescription}
        <p class="text-neutral-600 text-sm line-clamp-2">
          {job.shortDescription}
        </p>
      {/if}

      <div class="flex flex-wrap gap-2 mt-3">
        <Badge color="neutral">{formattedEmploymentType}</Badge>
        <Badge color="neutral">{formattedExperienceLevel}</Badge>
        <Badge color="neutral">{locationText}</Badge>
      </div>

      {#if job.skills && job.skills.length > 0}
        <div class="mt-3">
          <div class="flex flex-wrap gap-1.5">
            {#each job.skills.slice(0, 3) as skill}
              <span
                class="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs"
              >
                {skill.skillName}
              </span>
            {/each}

            {#if job.skills.length > 3}
              <span
                class="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs"
              >
                +{job.skills.length - 3} more
              </span>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div
      class="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500"
    >
      <div>
        {#if job.showSalary && job.formattedSalary}
          <div class="font-medium text-neutral-900">
            {job.formattedSalary}
          </div>
        {/if}
      </div>

      <div class="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{publishedDate}</span>
      </div>
    </div>

    <!-- Apply button/indicator -->
    {#if job.hasApplied}
      <div
        class="mt-4 text-center py-2 bg-green-50 text-green-700 text-sm rounded-md"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 inline mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        Applied
      </div>
    {/if}
  </div>
</a>
