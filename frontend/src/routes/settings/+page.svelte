<script lang="ts">
  import { onMount } from "svelte";
  import { currentUser, authStore } from "$lib/stores/authStore";
  import Button from "$lib/components/common/Button.svelte";
  import Input from "$lib/components/common/Input.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Avatar from "$lib/components/common/Avatar.svelte";
  import { updateUser } from "$lib/services/userService";

  // Form state
  let firstName = $currentUser?.given_name || "";
  let lastName = $currentUser?.family_name || "";
  let username = "";
  let email = $currentUser?.email || "";
  let avatarUrl = $currentUser?.picture || "";

  let isLoading = false;
  let isSaving = false;
  let error = null;
  let successMessage = "";

  // Tabs
  const tabs = [
    { id: "profile", name: "Profile" },
    { id: "account", name: "Account" },
    { id: "notifications", name: "Notifications" },
    { id: "privacy", name: "Privacy & Security" },
  ];
  let activeTab = "profile";

  onMount(async () => {
    isLoading = true;
    try {
      // In a real implementation, we would fetch the user data from the backend
      // For now we'll use what we have in the auth store
      if ($currentUser) {
        firstName = $currentUser.given_name || "";
        lastName = $currentUser.family_name || "";
        email = $currentUser.email || "";
        username = $currentUser.nickname || email.split("@")[0];
        avatarUrl = $currentUser.picture || "";
      }
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  });

  async function handleProfileSubmit() {
    isSaving = true;
    error = null;
    successMessage = "";

    try {
      // Update user profile in the backend
      await updateUser({
        firstName,
        lastName,
        username,
      });

      // Show success message
      successMessage = "Profile updated successfully";

      // In a real implementation, we would also update the auth store
      // with the new user data

      setTimeout(() => {
        successMessage = "";
      }, 5000);
    } catch (err) {
      error = err.message;
    } finally {
      isSaving = false;
    }
  }

  function setActiveTab(tabId) {
    activeTab = tabId;
  }
</script>

<svelte:head>
  <title>Settings | Portfolia</title>
</svelte:head>

<div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
  <h1 class="text-3xl font-bold text-neutral-900 mb-8">Settings</h1>

  <div class="flex flex-col md:flex-row">
    <!-- Sidebar tabs -->
    <div class="w-full md:w-64 mb-6 md:mb-0">
      <nav class="space-y-1" aria-label="Settings">
        {#each tabs as tab}
          <button
            on:click={() => setActiveTab(tab.id)}
            class="flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left {activeTab ===
            tab.id
              ? 'bg-primary-50 text-primary-700'
              : 'text-neutral-700 hover:bg-neutral-50'}"
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            {tab.name}
          </button>
        {/each}
      </nav>
    </div>

    <!-- Content area -->
    <div class="md:ml-6 flex-1">
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

      {#if successMessage}
        <div class="rounded-md bg-green-50 p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Profile tab -->
      {#if activeTab === "profile"}
        <Card padding="lg">
          <h2 class="text-xl font-medium text-neutral-900 mb-6">
            Your Profile
          </h2>

          <form
            on:submit|preventDefault={handleProfileSubmit}
            class="space-y-6"
          >
            <!-- Profile Image -->
            <div class="flex items-center">
              <Avatar
                name={`${firstName} ${lastName}`}
                src={avatarUrl}
                size="lg"
              />
              <div class="ml-5">
                <div class="flex space-x-3">
                  <Button variant="outline" size="sm" disabled={isLoading}>
                    Upload Image
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-red-600 hover:bg-red-50"
                    disabled={isLoading}
                  >
                    Remove
                  </Button>
                </div>
                <p class="mt-2 text-xs text-neutral-500">
                  JPG or PNG. 1MB max.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div class="sm:col-span-3">
                <Input
                  id="firstName"
                  label="First Name"
                  bind:value={firstName}
                  disabled={isLoading}
                />
              </div>

              <div class="sm:col-span-3">
                <Input
                  id="lastName"
                  label="Last Name"
                  bind:value={lastName}
                  disabled={isLoading}
                />
              </div>

              <div class="sm:col-span-4">
                <Input
                  id="username"
                  label="Username"
                  bind:value={username}
                  disabled={isLoading}
                  helperText="This will be used in your profile URL: portfolia.com/username"
                />
              </div>

              <div class="sm:col-span-4">
                <Input
                  id="email"
                  label="Email Address"
                  type="email"
                  bind:value={email}
                  disabled={true}
                  helperText="To change your email, go to Account settings"
                />
              </div>
            </div>

            <div class="pt-5 border-t border-neutral-200">
              <div class="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSaving}
                  disabled={isLoading}
                >
                  Save
                </Button>
              </div>
            </div>
          </form>
        </Card>
      {/if}

      <!-- Account tab -->
      {#if activeTab === "account"}
        <Card padding="lg">
          <h2 class="text-xl font-medium text-neutral-900 mb-6">
            Account Settings
          </h2>

          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-medium leading-6 text-neutral-900">
                Email
              </h3>
              <div class="mt-2 max-w-xl text-sm text-neutral-500">
                <p>Change the email address associated with your account.</p>
              </div>
              <div class="mt-3">
                <Input
                  id="account-email"
                  label="Email Address"
                  type="email"
                  value={email}
                  disabled={isLoading}
                />
                <Button variant="outline" class="mt-3" disabled={isLoading}>
                  Update Email
                </Button>
              </div>
            </div>

            <div class="pt-6 border-t border-neutral-200">
              <h3 class="text-lg font-medium leading-6 text-neutral-900">
                Password
              </h3>
              <div class="mt-2 max-w-xl text-sm text-neutral-500">
                <p>Update your password for additional security.</p>
              </div>
              <div class="mt-3">
                <Button variant="outline" disabled={isLoading}>
                  Change Password
                </Button>
              </div>
            </div>

            <div class="pt-6 border-t border-neutral-200">
              <h3 class="text-lg font-medium leading-6 text-red-900">
                Danger Zone
              </h3>
              <div class="mt-2 max-w-xl text-sm text-neutral-500">
                <p>
                  Once you delete your account, all of your data will be
                  permanently removed.
                </p>
              </div>
              <div class="mt-3">
                <Button
                  variant="ghost"
                  class="text-red-600 hover:bg-red-50"
                  disabled={isLoading}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </Card>
      {/if}

      <!-- Notifications tab -->
      {#if activeTab === "notifications"}
        <Card padding="lg">
          <h2 class="text-xl font-medium text-neutral-900 mb-6">
            Notification Preferences
          </h2>

          <div class="space-y-6">
            <fieldset>
              <legend class="text-base font-medium text-neutral-900"
                >Email Notifications</legend
              >
              <div class="mt-4 space-y-4">
                <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input
                      id="comments"
                      name="comments"
                      type="checkbox"
                      class="h-4 w-4 text-primary-600 border-neutral-300 rounded"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label for="comments" class="font-medium text-neutral-700"
                      >Profile interactions</label
                    >
                    <p class="text-neutral-500">
                      Get notified when someone comments, likes, or follows your
                      profile.
                    </p>
                  </div>
                </div>

                <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input
                      id="messages"
                      name="messages"
                      type="checkbox"
                      class="h-4 w-4 text-primary-600 border-neutral-300 rounded"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label for="messages" class="font-medium text-neutral-700"
                      >Messages</label
                    >
                    <p class="text-neutral-500">
                      Get notified when you receive a message.
                    </p>
                  </div>
                </div>

                <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input
                      id="opportunities"
                      name="opportunities"
                      type="checkbox"
                      class="h-4 w-4 text-primary-600 border-neutral-300 rounded"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label
                      for="opportunities"
                      class="font-medium text-neutral-700"
                      >Job opportunities</label
                    >
                    <p class="text-neutral-500">
                      Get notified about new job opportunities that match your
                      skills.
                    </p>
                  </div>
                </div>

                <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input
                      id="marketing"
                      name="marketing"
                      type="checkbox"
                      class="h-4 w-4 text-primary-600 border-neutral-300 rounded"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label for="marketing" class="font-medium text-neutral-700"
                      >Marketing</label
                    >
                    <p class="text-neutral-500">
                      Receive tips, product updates, and marketing emails from
                      Portfolia.
                    </p>
                  </div>
                </div>
              </div>
            </fieldset>

            <div class="pt-6 border-t border-neutral-200">
              <fieldset>
                <legend class="text-base font-medium text-neutral-900"
                  >Push Notifications</legend
                >
                <p class="text-sm text-neutral-500 mt-1">
                  Configure how you receive push notifications on your device.
                </p>
                <div class="mt-4 space-y-4">
                  <div class="flex items-center">
                    <input
                      id="push-everything"
                      name="push-notifications"
                      type="radio"
                      class="h-4 w-4 text-primary-600 border-neutral-300"
                    />
                    <label
                      for="push-everything"
                      class="ml-3 block text-sm font-medium text-neutral-700"
                    >
                      All notifications
                    </label>
                  </div>
                  <div class="flex items-center">
                    <input
                      id="push-important"
                      name="push-notifications"
                      type="radio"
                      class="h-4 w-4 text-primary-600 border-neutral-300"
                    />
                    <label
                      for="push-important"
                      class="ml-3 block text-sm font-medium text-neutral-700"
                    >
                      Important notifications only
                    </label>
                  </div>
                  <div class="flex items-center">
                    <input
                      id="push-none"
                      name="push-notifications"
                      type="radio"
                      class="h-4 w-4 text-primary-600 border-neutral-300"
                    />
                    <label
                      for="push-none"
                      class="ml-3 block text-sm font-medium text-neutral-700"
                    >
                      No push notifications
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>

            <div class="pt-5 border-t border-neutral-200">
              <div class="flex justify-end">
                <Button type="button" variant="primary">Save</Button>
              </div>
            </div>
          </div>
        </Card>
      {/if}

      <!-- Privacy & Security tab -->
      {#if activeTab === "privacy"}
        <Card padding="lg">
          <h2 class="text-xl font-medium text-neutral-900 mb-6">
            Privacy & Security
          </h2>

          <div class="space-y-6">
            <fieldset>
              <legend class="text-base font-medium text-neutral-900"
                >Privacy Settings</legend
              >
              <div class="mt-4 space-y-4">
                <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input
                      id="profile-visibility"
                      name="profile-visibility"
                      type="checkbox"
                      class="h-4 w-4 text-primary-600 border-neutral-300 rounded"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label
                      for="profile-visibility"
                      class="font-medium text-neutral-700"
                      >Profile visibility</label
                    >
                    <p class="text-neutral-500">
                      Make your profile visible to everyone, including
                      non-registered users.
                    </p>
                  </div>
                </div>

                <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input
                      id="search-discovery"
                      name="search-discovery"
                      type="checkbox"
                      class="h-4 w-4 text-primary-600 border-neutral-300 rounded"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label
                      for="search-discovery"
                      class="font-medium text-neutral-700"
                      >Search discovery</label
                    >
                    <p class="text-neutral-500">
                      Allow your profile to appear in search results and
                      discovery features.
                    </p>
                  </div>
                </div>

                <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input
                      id="contact-info"
                      name="contact-info"
                      type="checkbox"
                      class="h-4 w-4 text-primary-600 border-neutral-300 rounded"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label
                      for="contact-info"
                      class="font-medium text-neutral-700"
                      >Contact information</label
                    >
                    <p class="text-neutral-500">
                      Show your contact information on your public profile.
                    </p>
                  </div>
                </div>
              </div>
            </fieldset>

            <div class="pt-6 border-t border-neutral-200">
              <h3 class="text-base font-medium text-neutral-900">Security</h3>
              <div class="mt-2 max-w-xl text-sm text-neutral-500">
                <p>Additional security settings to protect your account.</p>
              </div>

              <div class="mt-4 space-y-4">
                <div>
                  <h4 class="text-sm font-medium text-neutral-900">
                    Two-factor authentication
                  </h4>
                  <div class="mt-2 flex items-center justify-between">
                    <p class="text-sm text-neutral-500">
                      Add an extra layer of security to your account.
                    </p>
                    <Button variant="outline" size="sm" disabled={isLoading}
                      >Enable 2FA</Button
                    >
                  </div>
                </div>

                <div>
                  <h4 class="text-sm font-medium text-neutral-900">
                    Active sessions
                  </h4>
                  <div class="mt-2 flex items-center justify-between">
                    <p class="text-sm text-neutral-500">
                      Manage devices where you're currently logged in.
                    </p>
                    <Button variant="outline" size="sm" disabled={isLoading}
                      >Manage sessions</Button
                    >
                  </div>
                </div>

                <div>
                  <h4 class="text-sm font-medium text-neutral-900">
                    Login activity
                  </h4>
                  <div class="mt-2 flex items-center justify-between">
                    <p class="text-sm text-neutral-500">
                      Review recent account activity.
                    </p>
                    <Button variant="outline" size="sm" disabled={isLoading}
                      >View activity</Button
                    >
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-neutral-200">
              <h3 class="text-base font-medium text-neutral-900">
                Data & Privacy
              </h3>
              <div class="mt-2 max-w-xl text-sm text-neutral-500">
                <p>Control how your data is used and accessed.</p>
              </div>

              <div class="mt-4 space-y-4">
                <div>
                  <Button variant="outline" size="sm" disabled={isLoading}
                    >Download your data</Button
                  >
                  <p class="mt-1 text-xs text-neutral-500">
                    Get a copy of all the data Portfolia has about you.
                  </p>
                </div>

                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    class="text-red-600 border-red-200 hover:bg-red-50"
                    disabled={isLoading}
                  >
                    Request data deletion
                  </Button>
                  <p class="mt-1 text-xs text-neutral-500">
                    Request permanent deletion of specific data points.
                  </p>
                </div>
              </div>
            </div>

            <div class="pt-5 border-t border-neutral-200">
              <div class="flex justify-end">
                <Button type="button" variant="primary">Save settings</Button>
              </div>
            </div>
          </div>
        </Card>
      {/if}
    </div>
  </div>
</div>
