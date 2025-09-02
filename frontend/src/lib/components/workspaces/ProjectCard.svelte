<script lang="ts">
  import { format } from "date-fns";
  import Avatar from "../common/Avatar.svelte";
  import ProgressBar from "../common/ProgressBar.svelte";

  export let project;

  // Format date
  function formatDate(date) {
    if (!date) return "No date";
    return format(new Date(date), "MMM d, yyyy");
  }

  // Calculate days remaining or overdue
  function getDaysRemaining() {
    if (!project.dueDate) return null;

    const dueDate = new Date(project.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} overdue`;
    } else if (diffDays === 0) {
      return "Due today";
    } else {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} left`;
    }
  }

  // Status badge class
  function getStatusBadgeClass(status) {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "on-hold":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "archived":
        return "bg-neutral-100 text-neutral-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  }

  // Days remaining badge class
  $: daysRemaining = getDaysRemaining();
  $: isOverdue = daysRemaining?.includes("overdue");
  $: daysRemainingClass = isOverdue
    ? "text-red-700 bg-red-50"
    : daysRemaining === "Due today"
      ? "text-yellow-700 bg-yellow-50"
      : "text-neutral-700 bg-neutral-50";
</script>

<a
  href="/projects/{project.id}"
  class="block bg-white rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
>
  <div class="p-5">
    <div class="flex items-start justify-between mb-3">
      <h3 class="font-medium text-lg text-neutral-900">{project.name}</h3>

      <span
        class="text-xs px-2 py-1 rounded-full {getStatusBadgeClass(
          project.status,
        )}"
      >
        {project.status}
      </span>
    </div>

    <p class="text-sm text-neutral-600 line-clamp-2 h-10 mb-4">
      {project.description || "No description provided."}
    </p>

    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center">
        <Avatar
          src={project.createdBy?.profiles?.[0]?.avatarUrl}
          alt={project.createdBy?.fullName ||
            project.createdBy?.username ||
            "Project Owner"}
          size="xs"
        />
        <span class="ml-2 text-xs text-neutral-500">
          Created by {project.createdBy?.fullName ||
            project.createdBy?.username ||
            "Unknown"}
        </span>
      </div>
    </div>

    <div class="mb-4">
      <div class="flex justify-between text-xs text-neutral-500 mb-1">
        <span>Progress</span>
        <span>{Math.round(project.progress || 0)}%</span>
      </div>
      <ProgressBar value={project.progress || 0} />
    </div>

    <div class="flex items-center justify-between text-xs">
      <div>
        <div class="flex space-x-2">
          <div class="flex items-center">
            <svg
              class="w-4 h-4 mr-1 text-neutral-500"
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
            <span>{project.taskCount || 0} tasks</span>
          </div>

          <div class="flex items-center">
            <svg
              class="w-4 h-4 mr-1 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{project.completedTaskCount || 0} done</span>
          </div>
        </div>
      </div>

      {#if daysRemaining}
        <span class="px-2 py-0.5 rounded-full {daysRemainingClass}">
          {daysRemaining}
        </span>
      {/if}
    </div>
  </div>
</a>
