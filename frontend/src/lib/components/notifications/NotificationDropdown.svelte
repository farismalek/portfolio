<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { fade, slide } from "svelte/transition";
  import { clickOutside } from "$lib/utils/clickOutside";
  import { notificationStore } from "$lib/stores/notificationStore";
  import NotificationItem from "./NotificationItem.svelte";
  import Button from "../common/Button.svelte";
  import LoadingSpinner from "../common/LoadingSpinner.svelte";
  import {
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } from "$lib/services/notificationService";
  import { goto } from "$app/navigation";

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  function handleClickOutside() {
    if (isOpen) {
      dispatch("close");
    }
  }

  async function handleMarkAsRead(event) {
    const notificationId = event.detail;

    try {
      await markAsRead([notificationId]);
      notificationStore.markAsRead(notificationId);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead();
      notificationStore.markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }

  async function handleDelete(event) {
    const notificationId = event.detail;

    try {
      await deleteNotification(notificationId);
      notificationStore.removeNotification(notificationId);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  }

  function handleNavigate(event) {
    const { url } = event.detail;
    if (url) {
      goto(url);
      dispatch("close");
    }
  }

  function viewAllNotifications() {
    goto("/notifications");
    dispatch("close");
  }
</script>

<div
  class="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-neutral-200 z-50"
  use:clickOutside={handleClickOutside}
  transition:slide={{ duration: 200 }}
>
  <div
    class="p-4 border-b border-neutral-100 flex items-center justify-between"
  >
    <h3 class="font-medium text-lg">Notifications</h3>
    {#if $notificationStore.notifications.length > 0}
      <Button variant="text" size="xs" on:click={handleMarkAllAsRead}>
        Mark all as read
      </Button>
    {/if}
  </div>

  <div class="max-h-96 overflow-y-auto">
    {#if $notificationStore.isLoading && $notificationStore.notifications.length === 0}
      <div class="p-8 flex justify-center">
        <LoadingSpinner size="md" />
      </div>
    {:else if $notificationStore.notifications.length === 0}
      <div class="p-8 text-center">
        <svg
          class="w-12 h-12 text-neutral-300 mx-auto mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <p class="text-neutral-500">You don't have any notifications yet</p>
      </div>
    {:else}
      {#each $notificationStore.notifications.slice(0, 5) as notification (notification.id)}
        <NotificationItem
          {notification}
          on:read={handleMarkAsRead}
          on:delete={handleDelete}
          on:navigate={handleNavigate}
        />
      {/each}
    {/if}
  </div>

  <div class="p-4 border-t border-neutral-100 text-center">
    <Button
      variant="outline"
      size="sm"
      fullWidth
      on:click={viewAllNotifications}
    >
      View All Notifications
    </Button>
  </div>
</div>
