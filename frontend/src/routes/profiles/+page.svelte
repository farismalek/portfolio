<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { currentUser } from "$lib/stores/authStore";
  import Button from "$lib/components/common/Button.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Avatar from "$lib/components/common/Avatar.svelte";
  import {
    fetchProfiles,
    setDefaultProfile,
    deleteProfile,
  } from "$lib/services/profileService";

  let profiles = [];
  let isLoading = true;
  let error = null;

  onMount(async () => {
    try {
      profiles = await fetchProfiles();
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  });

  async function handleSetDefault(profileId) {
    try {
      await setDefaultProfile(profileId);
      // Update the UI to reflect the new default profile
      profiles = profiles.map((p) => ({
        ...p,
        isDefault: p.id === profileId,
      }));
    } catch (err) {
      error = err.message;
    }
  }

  async function handleDelete(profileId) {
    if (!confirm("Are you sure you want to delete this profile?")) return;

    try {
      await deleteProfile(profileId);
      profiles = profiles.filter((p) => p.id !== profileId);
    } catch (err) {
      error = err.message;
    }
  }

  function handleEdit(profileId) {
    goto(`/profiles/${profileId}/edit`);
  }

  function handleView(profileId) {
    goto(`/profiles/${profileId}`);
  }

  function handleCreate() {
    goto("/profiles/create");
  }
</script>

<svelte:head>
  <title>Your Profiles | Portfolia</title>
</svelte:head>

<div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
  <div
    class="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
  >
    <div>
      <h1 class="text-3xl font-bold text-neutral-900">Your Profiles</h1>
      <p class="mt-1 text-sm text-neutral-500">
        Manage and customize your professional identities.
      </p>
    </div>
    <div class="mt-4 md:mt-0">
      <Button on:click={handleCreate}>
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
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Create Profile
      </Button>
    </div>
  </div>

  {#if error}
    <div class="rounded-md bg-red-50 p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-red-800">{error}</p>
        </div>
      </div>
    </div>
  {/if}

  {#if isLoading}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each Array(3) as _}
        <div
          class="bg-white border border-neutral-200 rounded-xl shadow-sm p-5"
        >
          <div class="animate-pulse flex flex-col">
            <div class="bg-neutral-100 h-6 w-3/4 rounded mb-4"></div>
            <div class="bg-neutral-100 h-4 w-full rounded mb-2"></div>
            <div class="bg-neutral-100 h-4 w-4/5 rounded mb-6"></div>
            <div class="flex items-center space-x-2 mb-6">
              <div class="bg-neutral-100 h-4 w-16 rounded"></div>
              <div class="bg-neutral-100 h-4 w-16 rounded"></div>
              <div class="bg-neutral-100 h-4 w-16 rounded"></div>
            </div>
            <div class="flex space-x-3">
              <div class="bg-neutral-100 h-10 w-full rounded"></div>
              <div class="bg-neutral-100 h-10 w-full rounded"></div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else if profiles.length === 0}
    <Card class="p-6 flex flex-col items-center justify-center text-center">
      <svg
        class="w-16 h-16 text-neutral-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-neutral-900">No profiles yet</h3>
      <p class="mt-1 text-neutral-500">
        Create your first profile to showcase your work and experience.
      </p>
      <div class="mt-6">
        <Button on:click={handleCreate}>
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Create your first profile
        </Button>
      </div>
    </Card>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each profiles as profile}
        <Card padding="lg" class="flex flex-col">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-medium text-neutral-900">
                {profile.title}
              </h3>
              {#if profile.isDefault}
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mt-1"
                >
                  Default
                </span>
              {/if}
            </div>
            <Avatar
              name={$currentUser?.name || profile.title}
              src={profile.avatarUrl}
              size="md"
            />
          </div>

          <p class="text-sm text-neutral-500 line-clamp-2 mb-4">
            {profile.bio || "No bio provided."}
          </p>

          <div class="flex flex-wrap gap-2 mb-6">
            {#if profile.skills && profile.skills.length > 0}
              {#each profile.skills.slice(0, 5) as skill}
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-800"
                >
                  {skill}
                </span>
              {/each}
              {#if profile.skills.length > 5}
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-800"
                >
                  +{profile.skills.length - 5} more
                </span>
              {/if}
            {:else}
              <span class="text-xs text-neutral-400">No skills specified</span>
            {/if}
          </div>

          <div class="mt-auto flex flex-col gap-3">
            <div class="flex space-x-3">
              <Button
                variant="outline"
                fullWidth={true}
                on:click={() => handleView(profile.id)}
              >
                View
              </Button>
              <Button
                variant="outline"
                fullWidth={true}
                on:click={() => handleEdit(profile.id)}
              >
                Edit
              </Button>
            </div>

            <div class="flex space-x-3">
              {#if !profile.isDefault}
                <Button
                  variant="ghost"
                  fullWidth={true}
                  on:click={() => handleSetDefault(profile.id)}
                >
                  Set as Default
                </Button>
              {/if}
              <Button
                variant="ghost"
                class="text-red-600 hover:bg-red-50"
                fullWidth={true}
                on:click={() => handleDelete(profile.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>
