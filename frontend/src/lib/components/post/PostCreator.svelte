<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade, slide } from "svelte/transition";
  import Avatar from "../common/Avatar.svelte";
  import Button from "../common/Button.svelte";
  import Menu from "../common/Menu.svelte";
  import MenuItem from "../common/MenuItem.svelte";
  import { createPost } from "$lib/services/postService";
  import { PostType, PostVisibility } from "$lib/types/network";
  import { authUser } from "$lib/stores/authStore";
  import MediaUploader from "./MediaUploader.svelte";
  import { portfoliosStore } from "$lib/stores/portfoliosStore";

  export let feedType: "personal" | "discovery" | "profile" | "group" =
    "personal";
  export let groupId: string | null = null;

  let postContent = "";
  let postTitle = "";
  let postType: PostType = PostType.TEXT;
  let visibility: PostVisibility = PostVisibility.PUBLIC;
  let isExpanded = false;
  let isSubmitting = false;
  let mediaContent: any = null;
  let selectedPortfolioId: string | null = null;
  let error: string | null = null;

  const dispatch = createEventDispatcher();
  const visibilityOptions = [
    { value: PostVisibility.PUBLIC, label: "Public", icon: "globe" },
    { value: PostVisibility.CONNECTIONS, label: "Connections", icon: "users" },
    { value: PostVisibility.PRIVATE, label: "Private", icon: "lock" },
  ];

  // Load user portfolios
  $: userPortfolios = $portfoliosStore?.portfolios || [];

  $: showTitleField = postType !== PostType.TEXT && postType !== PostType.IMAGE;
  $: isMediaType =
    postType === PostType.IMAGE ||
    postType === PostType.GALLERY ||
    postType === PostType.VIDEO;
  $: showPortfolioSelect = postType === PostType.PORTFOLIO;
  $: canSubmit = (postContent.trim() !== "" || mediaContent) && !isSubmitting;

  // Focus the textarea when expanded
  function expandCreator() {
    isExpanded = true;
    // Use setTimeout to ensure DOM is updated before focusing
    setTimeout(() => {
      const textarea = document.querySelector("#post-content");
      if (textarea) {
        (textarea as HTMLTextAreaElement).focus();
      }
    }, 100);
  }

  function resetForm() {
    postContent = "";
    postTitle = "";
    postType = PostType.TEXT;
    visibility = PostVisibility.PUBLIC;
    mediaContent = null;
    selectedPortfolioId = null;
    isExpanded = false;
    error = null;
  }

  async function submitPost() {
    if (!$authUser || !canSubmit) return;

    isSubmitting = true;
    error = null;

    try {
      const postData = {
        userId: $authUser.id,
        content: postContent,
        type: postType,
        visibility,
        title: postTitle || undefined,
        media: mediaContent,
        portfolioId: selectedPortfolioId || undefined,
      };

      const newPost = await createPost(postData);

      // If posting to a group, add the post to the group
      if (groupId) {
        // Call group post API (to be implemented)
      }

      dispatch("post", newPost);
      resetForm();
    } catch (err) {
      console.error("Failed to create post:", err);
      error = err.message || "Failed to create post. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }

  function handleMediaUpload(event) {
    mediaContent = event.detail;
  }

  function setPostType(type: PostType) {
    postType = type;

    // Reset media content if changing away from media types
    if (!isMediaType) {
      mediaContent = null;
    }
  }

  function getVisibilityIcon(visibilityType: PostVisibility) {
    const option = visibilityOptions.find(
      (opt) => opt.value === visibilityType,
    );

    switch (option?.icon) {
      case "globe":
        return `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `;
      case "users":
        return `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        `;
      case "lock":
        return `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        `;
      default:
        return "";
    }
  }
</script>

<div
  class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden"
>
  <div class="p-4">
    <!-- Initial collapsed state -->
    {#if !isExpanded}
      <div class="flex items-center space-x-3" on:click={expandCreator}>
        {#if $authUser}
          <Avatar
            src={$authUser.profiles?.[0]?.avatarUrl}
            alt={$authUser.fullName || $authUser.username || "User"}
            size="md"
          />
        {/if}
        <div
          class="flex-1 bg-neutral-50 rounded-full px-4 py-2 text-neutral-500 cursor-text hover:bg-neutral-100 transition-colors"
        >
          What's on your mind?
        </div>
      </div>
    {:else}
      <!-- Expanded state -->
      <div class="space-y-4">
        <div class="flex items-start space-x-3">
          {#if $authUser}
            <Avatar
              src={$authUser.profiles?.[0]?.avatarUrl}
              alt={$authUser.fullName || $authUser.username || "User"}
              size="md"
            />
          {/if}
          <div class="flex-1 space-y-2">
            {#if showTitleField}
              <input
                type="text"
                placeholder="Add a title..."
                class="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors"
                bind:value={postTitle}
              />
            {/if}

            <textarea
              id="post-content"
              placeholder="What's on your mind?"
              class="w-full min-h-20 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-colors"
              rows="3"
              bind:value={postContent}
            ></textarea>

            {#if isMediaType}
              <div transition:slide={{ duration: 200 }}>
                <MediaUploader
                  type={postType}
                  on:upload={handleMediaUpload}
                  currentMedia={mediaContent}
                />
              </div>
            {/if}

            {#if showPortfolioSelect && userPortfolios.length > 0}
              <div transition:slide={{ duration: 200 }}>
                <label class="block text-sm font-medium text-neutral-700 mb-1">
                  Select Portfolio
                </label>
                <select
                  class="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  bind:value={selectedPortfolioId}
                >
                  <option value="">-- Select a portfolio --</option>
                  {#each userPortfolios as portfolio}
                    <option value={portfolio.id}>{portfolio.title}</option>
                  {/each}
                </select>
              </div>
            {/if}
          </div>
        </div>

        {#if error}
          <div
            class="bg-red-50 text-red-700 p-3 rounded-md text-sm"
            transition:fade={{ duration: 200 }}
          >
            {error}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if isExpanded}
    <div
      class="border-t border-neutral-100 p-4"
      transition:slide={{ duration: 200 }}
    >
      <div class="flex justify-between items-center">
        <div class="flex space-x-1">
          <button
            class="p-2 rounded-full hover:bg-neutral-100 {postType ===
            PostType.TEXT
              ? 'text-primary-600 bg-primary-50'
              : 'text-neutral-700'}"
            title="Text post"
            on:click={() => setPostType(PostType.TEXT)}
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
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </button>

          <button
            class="p-2 rounded-full hover:bg-neutral-100 {postType ===
            PostType.IMAGE
              ? 'text-primary-600 bg-primary-50'
              : 'text-neutral-700'}"
            title="Image post"
            on:click={() => setPostType(PostType.IMAGE)}
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>

          <button
            class="p-2 rounded-full hover:bg-neutral-100 {postType ===
            PostType.GALLERY
              ? 'text-primary-600 bg-primary-50'
              : 'text-neutral-700'}"
            title="Gallery post"
            on:click={() => setPostType(PostType.GALLERY)}
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
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>

          <button
            class="p-2 rounded-full hover:bg-neutral-100 {postType ===
            PostType.VIDEO
              ? 'text-primary-600 bg-primary-50'
              : 'text-neutral-700'}"
            title="Video post"
            on:click={() => setPostType(PostType.VIDEO)}
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>

          <button
            class="p-2 rounded-full hover:bg-neutral-100 {postType ===
            PostType.PORTFOLIO
              ? 'text-primary-600 bg-primary-50'
              : 'text-neutral-700'}"
            title="Portfolio post"
            on:click={() => setPostType(PostType.PORTFOLIO)}
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </button>
        </div>

        <div class="flex items-center space-x-2">
          <Menu position="top-end">
            <svelte:fragment slot="trigger">
              <button
                class="flex items-center px-3 py-1.5 text-sm rounded-md border border-neutral-300 hover:bg-neutral-50"
              >
                <span class="mr-1">
                  {@html getVisibilityIcon(visibility)}
                </span>
                {visibilityOptions.find((v) => v.value === visibility)?.label ||
                  "Visibility"}
                <svg
                  class="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </svelte:fragment>

            {#each visibilityOptions as option}
              <MenuItem on:click={() => (visibility = option.value)}>
                <span class="mr-2">
                  {@html getVisibilityIcon(option.value)}
                </span>
                {option.label}
              </MenuItem>
            {/each}
          </Menu>

          <Button
            variant="primary"
            size="sm"
            on:click={submitPost}
            loading={isSubmitting}
            disabled={!canSubmit}
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>
