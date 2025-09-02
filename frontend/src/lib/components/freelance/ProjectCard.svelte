<script lang="ts">
  import { formatDistanceToNow } from "date-fns";
  import Badge from "../common/Badge.svelte";
  import Avatar from "../common/Avatar.svelte";

  export let project;

  // Format complexity for display
  $: formattedComplexity = project.complexity
    ? project.complexity.charAt(0).toUpperCase() + project.complexity.slice(1)
    : "";

  // Format duration for display
  $: formattedDuration = formatDuration(project.duration);

  // Format published date
  $: publishedDate = project.publishedAt
    ? formatDistanceToNow(new Date(project.publishedAt), { addSuffix: true })
    : "Recently";

  // Format duration string
  function formatDuration(duration) {
    if (!duration) return "";

    switch (duration) {
      case "less_than_1_month":
        return "Less than 1 month";
      case "1_to_3_months":
        return "1-3 months";
      case "3_to_6_months":
        return "3-6 months";
      case "more_than_6_months":
        return "More than 6 months";
      default:
        return duration.replace(/_/g, " ");
    }
  }
</script>

<a href="/freelance/projects/{project.slug}" class="block group">
  <div
    class="bg-white rounded-lg border border-neutral-200 shadow-sm p-5 h-full flex flex-col transition-all duration-200 group-hover:border-primary-300 group-hover:shadow-md"
  >
    <!-- Header -->
    <div class="mb-3 flex justify-between items-start">
      <div>
        <h3
          class="font-semibold text-lg text-neutral-900 group-hover:text-primary-700 transition-colors"
        >
          {project.title}
        </h3>

        <div class="flex items-center mt-1 text-sm text-neutral-500">
          <span>Posted by</span>
          <div class="flex items-center ml-1">
            <Avatar
              src={project.client?.profiles?.[0]?.avatarUrl}
              alt={project.client?.fullName ||
                project.client?.username ||
                "Client"}
              size="xs"
            />
            <span class="ml-1">
              {project.client?.fullName || project.client?.username || "Client"}
              {#if project.company}
                <span class="ml-1">({project.company.name})</span>
              {/if}
            </span>
          </div>
        </div>
      </div>

      {#if project.isFeatured}
        <Badge color="yellow">Featured</Badge>
      {/if}
    </div>

    <!-- Project details -->
    <div class="space-y-2 flex-grow">
      {#if project.shortDescription}
        <p class="text-neutral-600 text-sm line-clamp-2">
          {project.shortDescription}
        </p>
      {/if}

      <div class="flex flex-wrap gap-2 mt-3">
        <Badge color="neutral">{project.category}</Badge>
        {#if formattedComplexity}
          <Badge color="neutral">{formattedComplexity}</Badge>
        {/if}
        {#if formattedDuration}
          <Badge color="neutral">{formattedDuration}</Badge>
        {/if}
      </div>

      {#if project.skills && project.skills.length > 0}
        <div class="mt-3">
          <div class="flex flex-wrap gap-1.5">
            {#each project.skills.slice(0, 3) as skill}
              <span
                class="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs"
              >
                {skill}
              </span>
            {/each}

            {#if project.skills.length > 3}
              <span
                class="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs"
              >
                +{project.skills.length - 3} more
              </span>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div
      class="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs"
    >
      <div class="font-medium text-neutral-900">
        {#if project.formattedBudget}
          {project.formattedBudget}
        {:else}
          Budget to be discussed
        {/if}
      </div>

      <div class="flex items-center text-neutral-500">
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
        <span class="mx-2">•</span>
        <span>{project.proposalCount || 0} proposals</span>
      </div>
    </div>

    <!-- Proposal indicator -->
    {#if project.hasProposed}
      <div
        class="mt-3 text-center py-2 bg-green-50 text-green-700 text-sm rounded-md"
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
        Proposal Submitted
      </div>
    {/if}
  </div>
</a>
