<script lang="ts">
  import { onMount } from "svelte";
  import { fade, slide } from "svelte/transition";
  import { notificationStore } from "$lib/stores/notificationStore";
  import NotificationItem from "$lib/components/notifications/NotificationItem.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import {
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } from "$lib/services/notificationService";
  import { goto } from "$app/navigation";
  import { authUser } from "$lib/stores/authStore";

  let isFiltering = false;
  let filterType = "all";

  onMount(() => {
    if (!$authUser) {
      goto("/login");
      return;
    }

    // Initialize notifications
    notificationStore.initialize();

    // Set up intersection observer for infinite scrolling
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          !$notificationStore.isLoading &&
          $notificationStore.hasMore
        ) {
          loadMoreNotifications();
        }
      },
      { threshold: 0.5 },
    );

    const loadMoreTrigger = document.querySelector("#load-more-trigger");
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }

    return () => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger);
      }
    };
  });

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
    }
  }

  function loadMoreNotifications() {
    notificationStore.loadMore();
  }

  // Filter notifications based on type
  $: filteredNotifications =
    filterType === "all"
      ? $notificationStore.notifications
      : $notificationStore.notifications.filter((n) =>
          n.type.includes(filterType),
        );

  // Filter options
  const filterOptions = [
    { id: "all", label: "All" },
    { id: "follow", label: "Follows & Connections" },
    { id: "post", label: "Post Activity" },
    { id: "comment", label: "Comments" },
    { id: "mention", label: "Mentions" },
    { id: "portfolio", label: "Portfolio" },
    { id: "job", label: "Jobs" },
  ];
</script>

<svelte:head>
  <title>Notifications | Portfolia</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-6">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-neutral-900">Notifications</h1>

    <div class="flex items-center space-x-4">
      <button
        class="text-neutral-500 hover:text-neutral-700 flex items-center"
        on:click={() => (isFiltering = !isFiltering)}
      >
        <svg
          class="w-5 h-5 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filter
      </button>

      {#if $notificationStore.notifications.length > 0}
        <Button variant="outline" size="sm" on:click={handleMarkAllAsRead}>
          Mark all as read
        </Button>
      {/if}
    </div>
  </div>

  {#if isFiltering}
    <div
      class="mb-4 bg-white p-4 rounded-lg shadow-sm border border-neutral-200"
      transition:slide={{ duration: 200 }}
    >
      <div class="flex flex-wrap gap-2">
        {#each filterOptions as option}
          <button
            class="px-3 py-1 rounded-full text-sm {filterType === option.id
              ? 'bg-primary-100 text-primary-800 font-medium'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}"
            on:click={() => (filterType = option.id)}
          >
            {option.label}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <div
    class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden"
  >
    {#if $notificationStore.isLoading && $notificationStore.notifications.length === 0}
      <div class="p-12 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    {:else if filteredNotifications.length === 0}
      <div class="p-12 text-center">
        <svg
          class="w-16 h-16 text-neutral-300 mx-auto mb-3"
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
        <h2 class="text-xl font-medium text-neutral-700 mb-1">
          No notifications
        </h2>
        <p class="text-neutral-500">
          {#if filterType !== "all"}
            No notifications match your current filter.
          {:else}
            You don't have any notifications yet. When you get notifications,
            they'll appear here.
          {/if}
        </p>
      </div>
    {:else}
      {#each filteredNotifications as notification (notification.id)}
        <NotificationItem
          {notification}
          on:read={handleMarkAsRead}
          on:delete={handleDelete}
          on:navigate={handleNavigate}
        />
      {/each}

      {#if $notificationStore.isLoading}
        <div class="p-6 flex justify-center">
          <LoadingSpinner />
        </div>
      {/if}

      {#if $notificationStore.hasMore && !$notificationStore.isLoading}
        <div
          id="load-more-trigger"
          class="h-16 flex items-center justify-center"
        >
          <Button variant="text" on:click={loadMoreNotifications}>
            Load more
          </Button>
        </div>
      {/if}
    {/if}
  </div>
</div>
