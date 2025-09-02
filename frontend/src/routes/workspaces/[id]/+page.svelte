<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { fade, slide } from "svelte/transition";
  import { authUser } from "$lib/stores/authStore";
  import { workspacesStore } from "$lib/stores/workspacesStore";
  import { workspaceStore } from "$lib/stores/workspaceStore";
  import Button from "$lib/components/common/Button.svelte";
  import Avatar from "$lib/components/common/Avatar.svelte";
  import TabGroup from "$lib/components/common/TabGroup.svelte";
  import Tab from "$lib/components/common/Tab.svelte";
  import Menu from "$lib/components/common/Menu.svelte";
  import MenuItem from "$lib/components/common/MenuItem.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import ProjectList from "$lib/components/workspaces/ProjectList.svelte";
  import TaskBoard from "$lib/components/workspaces/TaskBoard.svelte";
  import FileExplorer from "$lib/components/workspaces/FileExplorer.svelte";
  import MemberList from "$lib/components/workspaces/MemberList.svelte";
  import BoardsList from "$lib/components/workspaces/BoardsList.svelte";
  import InviteMembersModal from "$lib/components/workspaces/InviteMembersModal.svelte";
  import CreateProjectModal from "$lib/components/workspaces/CreateProjectModal.svelte";
  import { WorkspaceRole } from "$lib/types/workspace";

  // Get workspace ID from URL
  $: workspaceId = $page.params.id;

  let isLoading = true;
  let activeTab = "projects"; // projects, tasks, files, members, boards
  let showInviteModal = false;
  let showCreateProjectModal = false;

  onMount(async () => {
    if (!$authUser) {
      goto("/login");
      return;
    }

    // Load workspace data
    isLoading = true;
    try {
      await workspaceStore.loadWorkspace(workspaceId);
    } catch (error) {
      console.error("Failed to load workspace:", error);
    } finally {
      isLoading = false;
    }
  });

  // Check user permissions
  $: userMembership = $workspaceStore.workspace?.members?.find(
    (m) => m.userId === $authUser?.id,
  );
  $: userRole = userMembership?.role || null;
  $: canManageWorkspace =
    userRole === WorkspaceRole.OWNER || userRole === WorkspaceRole.ADMIN;
  $: canEditWorkspace = canManageWorkspace || userRole === WorkspaceRole.EDITOR;
  $: isOwner = userRole === WorkspaceRole.OWNER;

  function handleInviteMembers() {
    showInviteModal = true;
  }

  function handleCreateProject() {
    showCreateProjectModal = true;
  }

  function handleTabChange(event) {
    activeTab = event.detail;
  }

  function handleMembersAdded() {
    showInviteModal = false;
    // Reload workspace to update member list
    workspaceStore.loadWorkspace(workspaceId);
  }

  function handleProjectCreated() {
    showCreateProjectModal = false;
    // Projects should load automatically via store subscription
  }
</script>

<svelte:head>
  <title>
    {isLoading
      ? "Loading..."
      : $workspaceStore.workspace
        ? $workspaceStore.workspace.name
        : "Workspace"} | Portfolia
  </title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-6">
  {#if isLoading}
    <div class="flex justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>
  {:else if $workspaceStore.error}
    <div
      class="bg-white rounded-lg border border-neutral-200 shadow-sm p-8 text-center"
    >
      <div
        class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"
      >
        <svg
          class="w-8 h-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 class="text-xl font-semibold mb-2">Error Loading Workspace</h2>
      <p class="text-neutral-600 max-w-md mx-auto mb-6">
        {$workspaceStore.error}
      </p>
      <div class="flex justify-center space-x-4">
        <Button variant="outline" href="/workspaces">Back to Workspaces</Button>
        <Button
          variant="primary"
          on:click={() => workspaceStore.loadWorkspace(workspaceId)}
        >
          Try Again
        </Button>
      </div>
    </div>
  {:else if $workspaceStore.workspace}
    <!-- Workspace Header -->
    <div
      class="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden mb-6"
    >
      <div
        class="h-32 bg-gradient-to-r from-primary-500 to-primary-700 relative"
      >
        {#if $workspaceStore.workspace.avatarUrl}
          <img
            src={$workspaceStore.workspace.avatarUrl}
            alt={$workspaceStore.workspace.name}
            class="w-full h-full object-cover"
          />
        {/if}

        {#if canEditWorkspace}
          <div class="absolute top-3 right-3">
            <Button variant="light" size="sm">
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </Button>
          </div>
        {/if}
      </div>

      <div class="px-6 py-4">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-neutral-900 mb-1">
              {$workspaceStore.workspace.name}
            </h1>
            {#if $workspaceStore.workspace.description}
              <p class="text-neutral-600 mb-3">
                {$workspaceStore.workspace.description}
              </p>
            {/if}

            <div class="flex items-center text-sm text-neutral-500">
              <div class="flex items-center mr-4">
                <Avatar
                  src={$workspaceStore.workspace.owner?.profiles?.[0]
                    ?.avatarUrl}
                  alt={$workspaceStore.workspace.owner?.fullName ||
                    $workspaceStore.workspace.owner?.username ||
                    "Owner"}
                  size="xs"
                />
                <span class="ml-1">
                  Owned by {$workspaceStore.workspace.owner?.fullName ||
                    $workspaceStore.workspace.owner?.username ||
                    "Unknown"}
                </span>
              </div>

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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>
                  {$workspaceStore.workspace.members?.length || 0} members
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            {#if canManageWorkspace}
              <Button variant="outline" on:click={handleInviteMembers}>
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
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Invite
              </Button>
            {/if}

            {#if canEditWorkspace}
              <Button variant="primary" on:click={handleCreateProject}>
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

            <Menu position="bottom-end">
              <svelte:fragment slot="trigger">
                <button
                  class="p-2 rounded-full hover:bg-neutral-100 text-neutral-500"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
              </svelte:fragment>

              <MenuItem href={`/workspaces/${workspaceId}/settings`}>
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Workspace Settings
              </MenuItem>

              {#if isOwner}
                <MenuItem class="text-red-600">
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Workspace
                </MenuItem>
              {:else}
                <MenuItem class="text-red-600">
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Leave Workspace
                </MenuItem>
              {/if}
            </Menu>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <TabGroup {activeTab} on:change={handleTabChange}>
      <Tab id="projects" label="Projects" icon="template" />
      <Tab id="tasks" label="Tasks" icon="check-circle" />
      <Tab id="files" label="Files" icon="document" />
      <Tab id="boards" label="Boards" icon="collection" />
      <Tab id="members" label="Members" icon="users" />
    </TabGroup>

    <!-- Tab Content -->
    <div class="mt-6">
      {#if activeTab === "projects"}
        <ProjectList
          {workspaceId}
          canCreate={canEditWorkspace}
          onCreate={handleCreateProject}
        />
      {:else if activeTab === "tasks"}
        <TaskBoard {workspaceId} canEdit={canEditWorkspace} />
      {:else if activeTab === "files"}
        <FileExplorer {workspaceId} canUpload={canEditWorkspace} />
      {:else if activeTab === "boards"}
        <BoardsList {workspaceId} canCreate={canEditWorkspace} />
      {:else if activeTab === "members"}
        <MemberList
          {workspaceId}
          canManage={canManageWorkspace}
          onInvite={handleInviteMembers}
        />
      {/if}
    </div>
  {:else}
    <div
      class="bg-white rounded-lg border border-neutral-200 shadow-sm p-8 text-center"
    >
      <h2 class="text-xl font-semibold mb-2">Workspace Not Found</h2>
      <p class="text-neutral-600 max-w-md mx-auto mb-6">
        The workspace you're looking for doesn't exist or you don't have
        permission to view it.
      </p>
      <Button variant="primary" href="/workspaces">Back to Workspaces</Button>
    </div>
  {/if}
</div>

<!-- Modals -->
<InviteMembersModal
  open={showInviteModal}
  {workspaceId}
  on:close={() => (showInviteModal = false)}
  on:members-added={handleMembersAdded}
/>

<CreateProjectModal
  open={showCreateProjectModal}
  {workspaceId}
  on:close={() => (showCreateProjectModal = false)}
  on:created={handleProjectCreated}
/>
