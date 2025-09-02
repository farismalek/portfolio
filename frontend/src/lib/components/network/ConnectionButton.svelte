<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    checkFollowStatus,
    createConnection,
    updateConnection,
    removeConnection,
  } from "$lib/services/connectionService";
  import Button from "../common/Button.svelte";
  import { ConnectionType } from "$lib/types/network";
  import { authUser } from "$lib/stores/authStore";

  export let userId: string;
  export let size: "sm" | "md" | "lg" = "md";
  export let variant: "primary" | "secondary" | "outline" = "primary";
  export let fullWidth: boolean = false;
  export let showIcon: boolean = true;

  let isLoading = false;
  let followStatus = {
    isFollowing: false,
    isPending: false,
    isBlocked: false,
    connectionId: null,
  };
  let error: string | null = null;

  const dispatch = createEventDispatcher();

  // Check follow status on mount and whenever userId changes
  $: if (userId && $authUser) {
    loadFollowStatus();
  }

  async function loadFollowStatus() {
    if (!userId || !$authUser || userId === $authUser.id) return;

    try {
      followStatus = await checkFollowStatus($authUser.id, userId);
    } catch (err) {
      console.error("Failed to check follow status:", err);
      error = "Failed to check connection status";
    }
  }

  async function handleConnection() {
    if (!$authUser) return;
    if (isLoading) return;

    isLoading = true;
    error = null;

    try {
      if (followStatus.isFollowing || followStatus.isPending) {
        // Unfollow/cancel request
        if (followStatus.connectionId) {
          await removeConnection(followStatus.connectionId);
          followStatus = {
            isFollowing: false,
            isPending: false,
            isBlocked: false,
            connectionId: null,
          };
          dispatch("change", followStatus);
        }
      } else {
        // Follow/connect
        const connectionType = ConnectionType.FOLLOW;
        const connection = await createConnection({
          followerId: $authUser.id,
          followingId: userId,
          type: connectionType,
        });

        followStatus = {
          isFollowing: connection.status === "accepted",
          isPending: connection.status === "pending",
          isBlocked: connection.status === "blocked",
          connectionId: connection.id,
        };

        dispatch("change", followStatus);
      }
    } catch (err) {
      console.error("Connection action failed:", err);
      error = "Failed to update connection";
    } finally {
      isLoading = false;
    }
  }

  function getButtonText() {
    if (followStatus.isFollowing) {
      return "Following";
    } else if (followStatus.isPending) {
      return "Requested";
    } else {
      return "Follow";
    }
  }
</script>

{#if userId !== $authUser?.id}
  <Button
    {variant}
    {size}
    {fullWidth}
    loading={isLoading}
    on:click={handleConnection}
    class={followStatus.isFollowing ? "connection-active" : ""}
  >
    {#if showIcon}
      {#if followStatus.isFollowing}
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
            d="M5 13l4 4L19 7"
          />
        </svg>
      {:else if followStatus.isPending}
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
      {:else}
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      {/if}
    {/if}
    {getButtonText()}
  </Button>
{/if}

{#if error}
  <div class="text-red-500 text-xs mt-1">{error}</div>
{/if}

<style>
  :global(.connection-active:hover) {
    background-color: theme("colors.red.50") !important;
    border-color: theme("colors.red.300") !important;
    color: theme("colors.red.600") !important;
  }
</style>
