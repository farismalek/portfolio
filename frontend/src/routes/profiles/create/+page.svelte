<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Input from "$lib/components/common/Input.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import { createProfile } from "$lib/services/profileService";

  // Form state
  let title = "";
  let bio = "";
  let location = "";
  let websiteUrl = "";
  let skills = "";
  let avatarUrl = "";
  let coverImageUrl = "";
  let theme = "cosmic";

  let isLoading = false;
  let error = null;

  // Available themes
  const themes = [
    { id: "cosmic", name: "Cosmic (Dark)" },
    { id: "luminous", name: "Luminous (Light)" },
    { id: "forest", name: "Forest (Green)" },
    { id: "oceanic", name: "Oceanic (Blue)" },
    { id: "sunset", name: "Sunset (Orange)" },
  ];

  async function handleSubmit() {
    isLoading = true;
    error = null;

    try {
      // Convert comma-separated skills to array
      const skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");

      const newProfile = await createProfile({
        title,
        bio,
        location,
        websiteUrl,
        skills: skillsArray,
        avatarUrl,
        coverImageUrl,
        theme,
      });

      goto("/profiles");
    } catch (err) {
      error = err.message || "Failed to create profile";
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Create Profile | Portfolia</title>
</svelte:head>

<div class="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
  <div class="flex items-center mb-8">
    <button
      class="mr-4 text-neutral-500 hover:text-neutral-700"
      on:click={() => goto("/profiles")}
    >
      <svg
        class="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
    </button>
    <h1 class="text-2xl font-bold text-neutral-900">Create New Profile</h1>
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

  <Card padding="lg">
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
      <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div class="sm:col-span-6">
          <Input
            id="title"
            label="Profile Title"
            required={true}
            placeholder="e.g. Senior Frontend Developer"
            bind:value={title}
          />
        </div>

        <div class="sm:col-span-6">
          <label for="bio" class="block text-sm font-medium text-neutral-700"
            >Bio</label
          >
          <div class="mt-1">
            <textarea
              id="bio"
              name="bio"
              rows="4"
              class="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-neutral-300 rounded-md"
              placeholder="Tell us about yourself, your experience, and your career goals"
              bind:value={bio}
            ></textarea>
          </div>
        </div>

        <div class="sm:col-span-6">
          <Input
            id="skills"
            label="Skills"
            placeholder="JavaScript, React, UI Design, Project Management (comma separated)"
            bind:value={skills}
            helperText="Enter your skills separated by commas"
          />
        </div>

        <div class="sm:col-span-3">
          <Input
            id="location"
            label="Location"
            placeholder="e.g. New York, NY"
            bind:value={location}
          />
        </div>

        <div class="sm:col-span-3">
          <Input
            id="websiteUrl"
            label="Website URL"
            type="url"
            placeholder="https://yourwebsite.com"
            bind:value={websiteUrl}
          />
        </div>

        <div class="sm:col-span-6">
          <Input
            id="avatarUrl"
            label="Profile Image URL"
            type="url"
            placeholder="https://example.com/your-image.jpg"
            bind:value={avatarUrl}
            helperText="Direct link to a profile image (we'll add image upload later)"
          />
        </div>

        <div class="sm:col-span-6">
          <Input
            id="coverImageUrl"
            label="Cover Image URL"
            type="url"
            placeholder="https://example.com/your-cover-image.jpg"
            bind:value={coverImageUrl}
            helperText="Direct link to a cover image for your profile header"
          />
        </div>

        <div class="sm:col-span-6">
          <label for="theme" class="block text-sm font-medium text-neutral-700"
            >Theme</label
          >
          <select
            id="theme"
            name="theme"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            bind:value={theme}
          >
            {#each themes as themeOption}
              <option value={themeOption.id}>{themeOption.name}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="pt-5 border-t border-neutral-200">
        <div class="flex justify-end space-x-3">
          <Button
            variant="outline"
            on:click={() => goto("/profiles")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Create Profile
          </Button>
        </div>
      </div>
    </form>
  </Card>
</div>
