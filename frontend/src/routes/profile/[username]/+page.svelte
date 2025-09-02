<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { authUser } from "$lib/stores/authStore";
  import { getUserByUsername } from "$lib/services/userService";
  import {
    checkFollowStatus,
    getFollowers,
    getFollowing,
  } from "$lib/services/connectionService";
  import { fade, slide } from "svelte/transition";

  import Avatar from "$lib/components/common/Avatar.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import ConnectionButton from "$lib/components/network/ConnectionButton.svelte";
  import TabGroup from "$lib/components/common/TabGroup.svelte";
  import Tab from "$lib/components/common/Tab.svelte";
  import FeedContainer from "$lib/components/feed/FeedContainer.svelte";
  import PortfolioCard from "$lib/components/portfolio/PortfolioCard.svelte";
  import UserCard from "$lib/components/network/UserCard.svelte";
  import LoadingSpinner from "$lib/components/common/LoadingSpinner.svelte";
  import ErrorAlert from "$lib/components/common/ErrorAlert.svelte";

  // Get username from URL params
  const username = $page.params.username;

  let user: any = null;
  let isLoading = true;
  let error: string | null = null;
  let activeTab = "posts";
  let followStatus = {
    isFollowing: false,
    isPending: false,
    isBlocked: false,
    connectionId: null,
  };

  let followers = [];
  let following = [];
  let isLoadingConnections = false;
  let portfolios = [];
  let isLoadingPortfolios = false;

  $: isOwnProfile = $authUser && user && $authUser.id === user.id;
  $: defaultProfile =
    user?.profiles?.find((p) => p.isDefault) || user?.profiles?.[0];

  onMount(async () => {
    await loadUserProfile();
  });

  async function loadUserProfile() {
    isLoading = true;
    error = null;

    try {
      user = await getUserByUsername(username);

      if ($authUser && user && $authUser.id !== user.id) {
        followStatus = await checkFollowStatus($authUser.id, user.id);
      }

      // Load user's portfolios in the background
      loadUserPortfolios();
    } catch (err) {
      console.error("Failed to load user profile:", err);
      error = err.message || "Failed to load user profile";
    } finally {
      isLoading = false;
    }
  }

  async function loadConnections(type: "followers" | "following") {
    if (
      (type === "followers" && followers.length > 0) ||
      (type === "following" && following.length > 0)
    ) {
      return; // Already loaded
    }

    isLoadingConnections = true;

    try {
      if (type === "followers") {
        const result = await getFollowers(user.id);
        followers = result.connections;
      } else {
        const result = await getFollowing(user.id);
        following = result.connections;
      }
    } catch (err) {
      console.error(`Failed to load ${type}:`, err);
    } finally {
      isLoadingConnections = false;
    }
  }

  async function loadUserPortfolios() {
    if (!user) return;

    isLoadingPortfolios = true;

    try {
      // This would be implemented in a portfolioService
      const response = await fetch(
        `/api/users/${user.id}/portfolios?visibility=public`,
      );
      if (!response.ok) throw new Error("Failed to load portfolios");

      portfolios = await response.json();
    } catch (err) {
      console.error("Failed to load portfolios:", err);
    } finally {
      isLoadingPortfolios = false;
    }
  }

  function handleFollowChange(event) {
    followStatus = event.detail;
  }

  function handleTabChange(event) {
    activeTab = event.detail;

    if (activeTab === "followers") {
      loadConnections("followers");
    } else if (activeTab === "following") {
      loadConnections("following");
    }
  }
</script>

<svelte:head>
  <title>
    {isLoading
      ? "Loading..."
      : user
        ? `${user.fullName || user.username}'s Profile`
        : "Profile Not Found"} | Portfolia
  </title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-6">
  {#if isLoading}
    <div class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  {:else if error}
    <div class="py-8 max-w-lg mx-auto">
      <ErrorAlert message={error} />
      <div class="mt-4 text-center">
        <a href="/" class="text-primary-600 hover:text-primary-800">
          Go back to home
        </a>
      </div>
    </div>
  {:else if user}
    <div
      class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden mb-6"
    >
      <!-- Cover image -->
      <div
        class="h-48 bg-gradient-to-r from-primary-500 to-primary-700 relative"
      >
        {#if defaultProfile?.coverUrl}
          <img
            src={defaultProfile.coverUrl}
            alt="Profile cover"
            class="w-full h-full object-cover"
          />
        {/if}

        {#if isOwnProfile}
          <div class="absolute top-4 right-4">
            <Button variant="light" href="/settings/profile">
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
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Edit Profile
            </Button>
          </div>
        {/if}
      </div>

      <div class="px-6 md:px-8 pt-0 pb-6 relative">
        <!-- Avatar -->
        <div class="flex justify-between">
          <div class="-mt-12 md:-mt-16 mb-4">
            <Avatar
              src={defaultProfile?.avatarUrl}
              alt={user.fullName || user.username || "User"}
              size="xl"
              className="border-4 border-white shadow-md"
            />
          </div>

          <!-- Follow button -->
          {#if !isOwnProfile}
            <div class="mt-4">
              <ConnectionButton
                userId={user.id}
                on:change={handleFollowChange}
                size="md"
              />
            </div>
          {/if}
        </div>

        <!-- User info -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-neutral-900 mb-1">
            {user.fullName || user.username}
          </h1>

          {#if defaultProfile?.title}
            <p class="text-neutral-600 mb-2">{defaultProfile.title}</p>
          {/if}

          {#if defaultProfile?.bio}
            <p class="text-neutral-700 whitespace-pre-line mt-3">
              {defaultProfile.bio}
            </p>
          {/if}

          <div class="flex flex-wrap gap-4 mt-4">
            {#if defaultProfile?.location}
              <div class="flex items-center text-sm text-neutral-600">
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
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {defaultProfile.location}
              </div>
            {/if}

            {#if defaultProfile?.website}
              <div class="flex items-center text-sm">
                <svg
                  class="w-4 h-4 mr-1 text-neutral-600"
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
                <a
                  href={defaultProfile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary-600 hover:text-primary-800"
                >
                  {defaultProfile.website
                    .replace(/^https?:\/\//, "")
                    .replace(/\/$/, "")}
                </a>
              </div>
            {/if}

            <div class="flex items-center text-sm text-neutral-600">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Joined {new Date(user.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
              })}
            </div>
          </div>

          <!-- Skills -->
          {#if defaultProfile?.skills && defaultProfile.skills.length > 0}
            <div class="mt-4">
              <div class="flex flex-wrap gap-2">
                {#each defaultProfile.skills as skill}
                  <span
                    class="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-md"
                  >
                    {skill}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Social links -->
          {#if defaultProfile?.socialLinks && Object.keys(defaultProfile.socialLinks).length > 0}
            <div class="mt-4 flex space-x-3">
              {#each Object.entries(defaultProfile.socialLinks) as [platform, url]}
                {#if url}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-neutral-500 hover:text-primary-600"
                    title={platform}
                  >
                    <svg
                      class="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <!-- This would need a helper function to get the appropriate SVG path for each platform -->
                      <path
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                  </a>
                {/if}
              {/each}
            </div>
          {/if}
        </div>

        <!-- Stats -->
        <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600">
          <button
            class="flex items-center"
            on:click={() => {
              activeTab = "followers";
              loadConnections("followers");
            }}
          >
            <span class="font-semibold text-neutral-900 mr-1"
              >{defaultProfile?.followerCount || 0}</span
            > Followers
          </button>
          <button
            class="flex items-center"
            on:click={() => {
              activeTab = "following";
              loadConnections("following");
            }}
          >
            <span class="font-semibold text-neutral-900 mr-1"
              >{defaultProfile?.followingCount || 0}</span
            > Following
          </button>
          <div class="flex items-center">
            <span class="font-semibold text-neutral-900 mr-1"
              >{defaultProfile?.postCount || 0}</span
            > Posts
          </div>
          <div class="flex items-center">
            <span class="font-semibold text-neutral-900 mr-1"
              >{portfolios.length || 0}</span
            > Portfolios
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <TabGroup {activeTab} on:change={handleTabChange}>
      <Tab id="posts" label="Posts" icon="document-text" />
      <Tab id="portfolios" label="Portfolios" icon="template" />
      <Tab id="followers" label="Followers" icon="users" />
      <Tab id="following" label="Following" icon="user-add" />
      <Tab id="about" label="About" icon="information-circle" />
    </TabGroup>

    <!-- Tab content -->
    <div class="mt-6">
      {#if activeTab === "posts"}
        <FeedContainer
          feedType="profile"
          userId={user.id}
          showPostCreator={isOwnProfile}
        />
      {:else if activeTab === "portfolios"}
        {#if isLoadingPortfolios}
          <div class="py-8 flex justify-center">
            <LoadingSpinner />
          </div>
        {:else if portfolios.length === 0}
          <div
            class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center"
          >
            <svg
              class="w-16 h-16 text-neutral-300 mx-auto mb-2"
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
            <h3 class="text-lg font-medium text-neutral-900">
              No portfolios yet
            </h3>
            <p class="mt-1 text-neutral-500">
              {isOwnProfile
                ? "Create your first portfolio to showcase your work!"
                : "This user has not created any public portfolios yet."}
            </p>

            {#if isOwnProfile}
              <div class="mt-4">
                <Button variant="primary" href="/portfolios/create">
                  Create Portfolio
                </Button>
              </div>
            {/if}
          </div>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each portfolios as portfolio}
              <PortfolioCard {portfolio} />
            {/each}
          </div>
        {/if}
      {:else if activeTab === "followers"}
        {#if isLoadingConnections}
          <div class="py-8 flex justify-center">
            <LoadingSpinner />
          </div>
        {:else if followers.length === 0}
          <div
            class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center"
          >
            <svg
              class="w-16 h-16 text-neutral-300 mx-auto mb-2"
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
            <h3 class="text-lg font-medium text-neutral-900">
              No followers yet
            </h3>
            <p class="mt-1 text-neutral-500">
              {isOwnProfile
                ? "When people follow you, they'll appear here."
                : "This user doesn't have any followers yet."}
            </p>
          </div>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each followers as connection}
              <UserCard user={connection.follower} />
            {/each}
          </div>
        {/if}
      {:else if activeTab === "following"}
        {#if isLoadingConnections}
          <div class="py-8 flex justify-center">
            <LoadingSpinner />
          </div>
        {:else if following.length === 0}
          <div
            class="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center"
          >
            <svg
              class="w-16 h-16 text-neutral-300 mx-auto mb-2"
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
            <h3 class="text-lg font-medium text-neutral-900">
              Not following anyone yet
            </h3>
            <p class="mt-1 text-neutral-500">
              {isOwnProfile
                ? "When you follow people, they'll appear here."
                : "This user isn't following anyone yet."}
            </p>

            {#if isOwnProfile}
              <div class="mt-4">
                <Button variant="primary" href="/network/suggestions">
                  Find People to Follow
                </Button>
              </div>
            {/if}
          </div>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each following as connection}
              <UserCard user={connection.following} />
            {/each}
          </div>
        {/if}
      {:else if activeTab === "about"}
        <div
          class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
        >
          <!-- Experience -->
          {#if defaultProfile?.experience && defaultProfile.experience.length > 0}
            <section class="mb-8">
              <h3 class="text-lg font-semibold text-neutral-900 mb-4">
                Experience
              </h3>
              <div class="space-y-6">
                {#each defaultProfile.experience as job}
                  <div class="flex">
                    <div class="flex-shrink-0 mt-1">
                      <div
                        class="w-10 h-10 bg-neutral-100 rounded-md flex items-center justify-center"
                      >
                        {#if job.companyLogo}
                          <img
                            src={job.companyLogo}
                            alt={job.company}
                            class="w-8 h-8 object-contain"
                          />
                        {:else}
                          <svg
                            class="w-5 h-5 text-neutral-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        {/if}
                      </div>
                    </div>

                    <div class="ml-4">
                      <h4 class="text-base font-medium text-neutral-900">
                        {job.title}
                      </h4>
                      <p class="text-sm text-neutral-700">{job.company}</p>
                      <p class="text-xs text-neutral-500">
                        {job.startDate} - {job.endDate || "Present"}
                        {#if job.location}
                          &bull; {job.location}
                        {/if}
                      </p>

                      {#if job.description}
                        <p
                          class="mt-2 text-sm text-neutral-600 whitespace-pre-line"
                        >
                          {job.description}
                        </p>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </section>
          {/if}

          <!-- Education -->
          {#if defaultProfile?.education && defaultProfile.education.length > 0}
            <section class="mb-8">
              <h3 class="text-lg font-semibold text-neutral-900 mb-4">
                Education
              </h3>
              <div class="space-y-6">
                {#each defaultProfile.education as edu}
                  <div class="flex">
                    <div class="flex-shrink-0 mt-1">
                      <div
                        class="w-10 h-10 bg-neutral-100 rounded-md flex items-center justify-center"
                      >
                        {#if edu.schoolLogo}
                          <img
                            src={edu.schoolLogo}
                            alt={edu.school}
                            class="w-8 h-8 object-contain"
                          />
                        {:else}
                          <svg
                            class="w-5 h-5 text-neutral-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 14l9-5-9-5-9 5 9 5z"
                            />
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 14l9-5-9-5-9 5 9 5zm0 0L3 9m9 5v5m-9-6v2m18-2v2"
                            />
                          </svg>
                        {/if}
                      </div>
                    </div>

                    <div class="ml-4">
                      <h4 class="text-base font-medium text-neutral-900">
                        {edu.school}
                      </h4>
                      <p class="text-sm text-neutral-700">
                        {edu.degree}{#if edu.fieldOfStudy}, {edu.fieldOfStudy}{/if}
                      </p>
                      <p class="text-xs text-neutral-500">
                        {edu.startYear} - {edu.endYear || "Present"}
                      </p>

                      {#if edu.description}
                        <p
                          class="mt-2 text-sm text-neutral-600 whitespace-pre-line"
                        >
                          {edu.description}
                        </p>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </section>
          {/if}

          <!-- If no experience or education -->
          {#if (!defaultProfile?.experience || defaultProfile.experience.length === 0) && (!defaultProfile?.education || defaultProfile.education.length === 0)}
            <div class="text-center py-8">
              <p class="text-neutral-500">
                {isOwnProfile
                  ? "Add details about your experience and education to your profile."
                  : "This user has not added any experience or education details yet."}
              </p>

              {#if isOwnProfile}
                <div class="mt-4">
                  <Button variant="outline" href="/settings/profile">
                    Complete Your Profile
                  </Button>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <div class="py-8 text-center">
      <h2 class="text-2xl font-bold text-neutral-900 mb-2">User not found</h2>
      <p class="text-neutral-600">
        The user you're looking for doesn't exist or may have been removed.
      </p>
      <div class="mt-6">
        <Button variant="primary" href="/">Return to Home</Button>
      </div>
    </div>
  {/if}
</div>
