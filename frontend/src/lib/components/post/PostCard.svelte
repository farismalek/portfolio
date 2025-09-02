<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { formatDistanceToNow } from "date-fns";
  import { fly, fade } from "svelte/transition";
  import { flip } from "svelte/animate";
  import Avatar from "../common/Avatar.svelte";
  import Button from "../common/Button.svelte";
  import Menu from "../common/Menu.svelte";
  import MenuItem from "../common/MenuItem.svelte";
  import ConfirmDialog from "../common/ConfirmDialog.svelte";
  import { createReaction, deletePost } from "$lib/services/postService";
  import type { Post, Comment } from "$lib/types/network";
  import { authUser } from "$lib/stores/authStore";
  import CommentList from "./CommentList.svelte";
  import CommentForm from "./CommentForm.svelte";
  import { PostType } from "$lib/types/network";
  import { goto } from "$app/navigation";
  import ImageGallery from "./content/ImageGallery.svelte";
  import VideoPlayer from "./content/VideoPlayer.svelte";
  import PortfolioPreview from "./content/PortfolioPreview.svelte";
  import ProjectPreview from "./content/ProjectPreview.svelte";
  import JobPreview from "./content/JobPreview.svelte";

  export let post: Post;
  export let minimal = false;
  export let showComments = false;

  // Animated reactions
  let reactionAnimating = false;
  let showConfirmDelete = false;
  let isDeleting = false;
  let showCommentForm = false;
  let commentsExpanded = false;
  let comments: Comment[] = [];

  const dispatch = createEventDispatcher();

  $: isAuthor = $authUser && post.userId === $authUser.id;
  $: formattedDate = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
  });
  $: hasReacted = post.hasUserReacted;

  // Format content - extract hashtags and mentions
  $: formattedContent = post.content ? formatPostContent(post.content) : "";

  function formatPostContent(content: string) {
    // Convert hashtags to links
    let formatted = content.replace(
      /#(\w+)/g,
      '<a href="/search?hashtag=$1" class="text-primary-600 hover:text-primary-800">#$1</a>',
    );

    // Convert mentions to links
    formatted = formatted.replace(
      /@(\w+)/g,
      '<a href="/profile/$1" class="text-primary-600 hover:text-primary-800">@$1</a>',
    );

    // Convert URLs to clickable links
    formatted = formatted.replace(
      /((https?:\/\/|www\.)[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-800">$1</a>',
    );

    return formatted;
  }

  async function handleReaction() {
    if (!$authUser) {
      goto("/login");
      return;
    }

    reactionAnimating = true;

    try {
      await createReaction({
        userId: $authUser.id,
        postId: post.id,
        type: "like",
      });

      // Update local state
      post = {
        ...post,
        hasUserReacted: !hasReacted,
        reactionCount: hasReacted
          ? post.reactionCount - 1
          : post.reactionCount + 1,
      };

      dispatch("update", post);
    } catch (err) {
      console.error("Failed to react to post:", err);
    } finally {
      setTimeout(() => {
        reactionAnimating = false;
      }, 800);
    }
  }

  function toggleComments() {
    if (!commentsExpanded) {
      commentsExpanded = true;
      showCommentForm = true;
    } else {
      commentsExpanded = false;
      showCommentForm = false;
    }
  }

  function handlePostClick() {
    if (!minimal) {
      goto(`/posts/${post.id}`);
    }
  }

  async function handleDeletePost() {
    if (!isAuthor) return;

    isDeleting = true;

    try {
      await deletePost(post.id);
      dispatch("delete", post.id);
      showConfirmDelete = false;
    } catch (err) {
      console.error("Failed to delete post:", err);
    } finally {
      isDeleting = false;
    }
  }

  function onCommentAdded(event) {
    const comment = event.detail;
    comments = [comment, ...comments];
    post = {
      ...post,
      commentCount: post.commentCount + 1,
    };
    dispatch("update", post);
  }
</script>

<article
  class="bg-white rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
>
  <!-- Post header with user info -->
  <header class="p-4 flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <Avatar
        src={post.user?.profiles?.[0]?.avatarUrl}
        alt={post.user?.fullName || "User"}
        size="md"
      />
      <div>
        <h3 class="font-medium text-neutral-900">
          <a
            href="/profile/{post.user?.username}"
            class="hover:text-primary-600"
          >
            {post.user?.fullName || post.user?.username}
          </a>
        </h3>
        <p class="text-xs text-neutral-500">{formattedDate}</p>
      </div>
    </div>

    <!-- Post actions menu -->
    {#if !minimal}
      <Menu>
        <svelte:fragment slot="trigger">
          <button
            class="p-1 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100"
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
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
              ></path>
            </svg>
          </button>
        </svelte:fragment>

        <MenuItem on:click={() => goto(`/posts/${post.id}`)}>
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
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Copy link
        </MenuItem>

        <MenuItem on:click={() => dispatch("share", post)}>
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
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share
        </MenuItem>

        <MenuItem on:click={() => dispatch("bookmark", post)}>
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
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          Bookmark
        </MenuItem>

        {#if isAuthor}
          <MenuItem on:click={() => dispatch("edit", post)}>
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit post
          </MenuItem>

          <MenuItem
            on:click={() => (showConfirmDelete = true)}
            class="text-red-600 hover:bg-red-50"
          >
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
            Delete
          </MenuItem>
        {:else}
          <MenuItem on:click={() => dispatch("report", post)}>
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Report
          </MenuItem>
        {/if}
      </Menu>
    {/if}
  </header>

  <!-- Post title if any -->
  {#if post.title}
    <div class="px-4 pb-1">
      <h2 class="text-lg font-semibold text-neutral-900">
        {post.title}
      </h2>
    </div>
  {/if}

  <!-- Post content -->
  {#if post.content}
    <div class="px-4 py-2">
      {#if minimal && post.content.length > 280}
        <p class="text-neutral-700 whitespace-pre-line">
          {@html formattedContent.substring(0, 280) + "..."}
          <a
            href={`/posts/${post.id}`}
            class="text-primary-600 hover:text-primary-800 font-medium"
            >Read more</a
          >
        </p>
      {:else}
        <p class="text-neutral-700 whitespace-pre-line">
          {@html formattedContent}
        </p>
      {/if}
    </div>
  {/if}

  <!-- Media content based on post type -->
  <div class="mt-2">
    {#if post.type === PostType.IMAGE && post.media?.url}
      <div class="cursor-pointer" on:click|stopPropagation={handlePostClick}>
        <img
          src={post.media.url}
          alt={post.media.alt || post.title || "Post image"}
          class="w-full max-h-96 object-cover"
        />
      </div>
    {:else if post.type === PostType.GALLERY && post.media?.images}
      <ImageGallery images={post.media.images} />
    {:else if post.type === PostType.VIDEO && post.media?.url}
      <VideoPlayer url={post.media.url} thumbnail={post.media.thumbnail} />
    {:else if post.type === PostType.PORTFOLIO && post.portfolioId}
      <PortfolioPreview portfolioId={post.portfolioId} />
    {:else if post.type === PostType.PROJECT && post.media?.project}
      <ProjectPreview project={post.media.project} />
    {:else if post.type === PostType.JOB && post.media?.job}
      <JobPreview job={post.media.job} />
    {/if}
  </div>

  <!-- Post stats and actions -->
  {#if !minimal}
    <div
      class="px-4 py-2 flex justify-between text-sm text-neutral-500 border-t border-neutral-100"
    >
      <div class="flex space-x-4">
        <span>
          {post.reactionCount}
          {post.reactionCount === 1 ? "like" : "likes"}
        </span>
        <span>
          {post.commentCount}
          {post.commentCount === 1 ? "comment" : "comments"}
        </span>
      </div>
      <div>
        {post.viewCount} views
      </div>
    </div>

    <!-- Action buttons -->
    <div class="px-4 py-2 flex border-t border-neutral-100">
      <button
        class="flex-1 flex items-center justify-center py-1 text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors {hasReacted
          ? 'text-primary-600 font-medium'
          : ''}"
        on:click={handleReaction}
      >
        <div class="relative">
          <svg
            class="w-5 h-5 mr-2"
            fill={hasReacted ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>

          {#if reactionAnimating}
            <div
              in:fly={{ y: -20, duration: 700 }}
              class="absolute -top-8 left-0 text-primary-500 text-xl font-bold"
            >
              +1
            </div>
          {/if}
        </div>
        Like
      </button>

      <button
        class="flex-1 flex items-center justify-center py-1 text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
        on:click={toggleComments}
      >
        <svg
          class="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        Comment
      </button>

      <button
        class="flex-1 flex items-center justify-center py-1 text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
        on:click={() => dispatch("share", post)}
      >
        <svg
          class="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        Share
      </button>
    </div>

    <!-- Comments section -->
    {#if showCommentForm || commentsExpanded || showComments}
      <div
        class="border-t border-neutral-100"
        transition:slide={{ duration: 300 }}
      >
        {#if showCommentForm || showComments}
          <div class="p-4">
            <CommentForm postId={post.id} on:comment={onCommentAdded} />
          </div>
        {/if}

        {#if commentsExpanded || showComments}
          <div class="px-4 pb-4">
            <CommentList postId={post.id} bind:comments />
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</article>

<ConfirmDialog
  open={showConfirmDelete}
  title="Delete post"
  message="Are you sure you want to delete this post? This action cannot be undone."
  confirmLabel="Delete"
  confirmVariant="danger"
  isLoading={isDeleting}
  on:confirm={handleDeletePost}
  on:cancel={() => (showConfirmDelete = false)}
/>
