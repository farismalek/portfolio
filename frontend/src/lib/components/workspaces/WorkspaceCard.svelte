<script lang="ts">
  import { format } from "date-fns";
  import Avatar from "../common/Avatar.svelte";
  import { authUser } from "$lib/stores/authStore";
  import { WorkspaceRole } from "$lib/types/workspace";

  export let workspace;

  // User's role in this workspace
  $: userMembership = workspace.members?.find(
    (m) => m.userId === $authUser?.id,
  );
  $: userRole = userMembership?.role || null;
  $: isOwner = userRole === WorkspaceRole.OWNER;

  // Format last updated date
  function formatDate(date) {
    if (!date) return "";
    return format(new Date(date), "MMM d, yyyy");
  }

  // Get role badge class
  function getRoleBadgeClass(role) {
    switch (role) {
      case WorkspaceRole.OWNER:
        return "bg-purple-100 text-purple-800";
      case WorkspaceRole.ADMIN:
        return "bg-red-100 text-red-800";
      case WorkspaceRole.EDITOR:
        return "bg-blue-100 text-blue-800";
      case WorkspaceRole.VIEWER:
        return "bg-green-100 text-green-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  }
</script>

<a
  href="/workspaces/{workspace.id}"
  class="block bg-white rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
>
  <div class="h-24 bg-gradient-to-r from-primary-500 to-primary-700 relative">
    {#if workspace.avatarUrl}
      <img
        src={workspace.avatarUrl}
        alt={workspace.name}
        class="w-full h-full object-cover"
      />
    {/if}

    <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-20 p-4">
      <h3 class="text-white font-semibold truncate">{workspace.name}</h3>
    </div>
  </div>

  <div class="p-4">
    <div class="mb-3 flex items-start justify-between">
      <div>
        <p class="text-sm text-neutral-500 mb-1">
          Created by {workspace.owner?.fullName ||
            workspace.owner?.username ||
            "Unknown"}
        </p>
        <p class="text-xs text-neutral-400">
          Last updated: {formatDate(workspace.updatedAt)}
        </p>
      </div>

      {#if userRole}
        <span
          class="text-xs px-2 py-0.5 rounded-full {getRoleBadgeClass(userRole)}"
        >
          {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
        </span>
      {/if}
    </div>

    <div class="text-sm text-neutral-600 line-clamp-2 mb-4 min-h-12">
      {workspace.description || "No description provided."}
    </div>

    <div class="flex items-center justify-between mt-2">
      <div class="flex items-center">
        <div class="flex -space-x-2 mr-2">
          {#each (workspace.members || []).slice(0, 3) as member}
            <Avatar
              src={member.user?.profiles?.[0]?.avatarUrl}
              alt={member.user?.fullName || member.user?.username || "Member"}
              size="xs"
              className="border-2 border-white"
            />
          {/each}
        </div>
        <span class="text-xs text-neutral-500">
          {workspace.memberCount || workspace.members?.length || 0} members
        </span>
      </div>

      <div class="flex items-center space-x-4 text-xs text-neutral-500">
        <div class="flex items-center">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          {workspace.projectCount || 0} projects
        </div>
      </div>
    </div>
  </div>
</a>
