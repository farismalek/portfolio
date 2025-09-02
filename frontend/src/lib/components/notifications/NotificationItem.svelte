<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { formatDistanceToNow } from "date-fns";
  import Avatar from "../common/Avatar.svelte";
  import type { Notification, NotificationType } from "$lib/types/network";

  export let notification: Notification;

  const dispatch = createEventDispatcher();

  function formatDate(dateString: string): string {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  }

  function getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case "new_follower":
        return "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z";
      case "connection_request":
        return "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z";
      case "connection_accepted":
        return "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z";
      case "post_like":
        return "M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5";
      case "post_comment":
      case "comment_reply":
        return "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z";
      case "post_share":
        return "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z";
      case "mention":
        return "M20 16l-8-8m0 0L4 16m8-8v14";
      case "portfolio_view":
        return "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z";
      case "job_application":
        return "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z";
      default:
        return "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
    }
  }

  function getNotificationMessage(notification: Notification): string {
    const senderName =
      notification.sender?.fullName ||
      notification.sender?.username ||
      "Someone";

    switch (notification.type) {
      case "new_follower":
        return `${senderName} started following you`;
      case "connection_request":
        return `${senderName} sent you a connection request`;
      case "connection_accepted":
        return `${senderName} accepted your connection request`;
      case "post_like":
        return `${senderName} liked your post`;
      case "post_comment":
        return `${senderName} commented on your post`;
      case "comment_reply":
        return `${senderName} replied to your comment`;
      case "post_share":
        return `${senderName} shared your post`;
      case "mention":
        return `${senderName} mentioned you in a ${notification.commentId ? "comment" : "post"}`;
      case "portfolio_view":
        return `${senderName} viewed your portfolio`;
      case "job_application":
        return `${senderName} applied to your job posting`;
      default:
        return notification.message || "You have a new notification";
    }
  }

  function handleClick() {
    dispatch("read", notification.id);

    // Navigate based on notification type
    let url = "";

    if (notification.postId) {
      url = `/posts/${notification.postId}`;

      if (notification.commentId) {
        url += `?comment=${notification.commentId}`;
      }
    } else if (
      notification.type === "portfolio_view" &&
      notification.portfolioId
    ) {
      url = `/portfolios/${notification.portfolioId}`;
    } else if (
      notification.type === "connection_request" ||
      notification.type === "new_follower"
    ) {
      url = `/profile/${notification.sender?.username}`;
    } else if (
      notification.type === "job_application" &&
      notification.portfolioId
    ) {
      url = `/jobs/applications/${notification.portfolioId}`;
    }

    if (url) {
      dispatch("navigate", { url });
    }
  }

  function markAsRead(event: Event) {
    event.stopPropagation();
    dispatch("read", notification.id);
  }

  function handleDelete(event: Event) {
    event.stopPropagation();
    dispatch("delete", notification.id);
  }
</script>

<div
  class="p-4 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 {notification.isRead
    ? ''
    : 'bg-blue-50 hover:bg-blue-50'}"
  on:click={handleClick}
>
  <div class="flex">
    <!-- Notification icon or sender avatar -->
    <div class="flex-shrink-0">
      {#if notification.sender}
        <Avatar
          src={notification.sender.profiles?.[0]?.avatarUrl}
          alt={notification.sender.fullName ||
            notification.sender.username ||
            "User"}
          size="md"
        />
      {:else}
        <div
          class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center"
        >
          <svg
            class="h-5 w-5 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d={getNotificationIcon(notification.type)}
            />
          </svg>
        </div>
      {/if}
    </div>

    <!-- Notification content -->
    <div class="ml-3 flex-1">
      <p class="text-sm text-neutral-900">
        {getNotificationMessage(notification)}
      </p>
      <div class="flex justify-between mt-1">
        <p class="text-xs text-neutral-500">
          {formatDate(notification.createdAt)}
        </p>

        <div class="flex space-x-2">
          {#if !notification.isRead}
            <button
              class="text-xs text-primary-600 hover:text-primary-800"
              on:click={markAsRead}
            >
              Mark as read
            </button>
          {/if}
          <button
            class="text-xs text-neutral-500 hover:text-neutral-700"
            on:click={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
