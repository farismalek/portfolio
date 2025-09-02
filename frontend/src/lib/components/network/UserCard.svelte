<script lang="ts">
  import { authUser } from "$lib/stores/authStore";
  import Avatar from "../common/Avatar.svelte";
  import ConnectionButton from "./ConnectionButton.svelte";

  export let user;
  export let showConnectButton = true;

  // Get default profile
  $: defaultProfile =
    user?.profiles?.find((p) => p.isDefault) || user?.profiles?.[0];
  $: isCurrentUser = $authUser && user && $authUser.id === user.id;
</script>

<div
  class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
>
  <div class="p-4">
    <div class="flex items-center justify-between">
      <a href="/profile/{user.username}" class="group">
        <div class="flex items-center">
          <Avatar
            src={defaultProfile?.avatarUrl}
            alt={user.fullName || user.username || "User"}
            size="md"
          />

          <div class="ml-3">
            <h3
              class="font-medium text-neutral-900 group-hover:text-primary-600"
            >
              {user.fullName || user.username}
            </h3>

            {#if defaultProfile?.title}
              <p class="text-xs text-neutral-600 truncate max-w-36">
                {defaultProfile.title}
              </p>
            {/if}
          </div>
        </div>
      </a>

      {#if showConnectButton && !isCurrentUser}
        <ConnectionButton userId={user.id} size="sm" variant="outline" />
      {/if}
    </div>

    {#if defaultProfile?.bio}
      <p class="text-sm text-neutral-600 mt-3 line-clamp-2">
        {defaultProfile.bio}
      </p>
    {/if}

    {#if defaultProfile?.skills && defaultProfile.skills.length > 0}
      <div class="mt-3 flex flex-wrap gap-1">
        {#each defaultProfile.skills.slice(0, 3) as skill}
          <span
            class="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs rounded"
          >
            {skill}
          </span>
        {/each}
        {#if defaultProfile.skills.length > 3}
          <span class="px-2 py-0.5 text-neutral-500 text-xs">
            +{defaultProfile.skills.length - 3} more
          </span>
        {/if}
      </div>
    {/if}
  </div>
</div>
