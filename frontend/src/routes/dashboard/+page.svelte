<script lang="ts">
  import { onMount } from "svelte";
  import { currentUser } from "$lib/stores/authStore";
  import Card from "$lib/components/common/Card.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Avatar from "$lib/components/common/Avatar.svelte";

  // Page data
  let welcomeMessage = "";
  let isLoading = true;

  onMount(async () => {
    // Simulate loading data
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Get time of day for greeting
    const hour = new Date().getHours();
    if (hour < 12) welcomeMessage = "Good morning";
    else if (hour < 18) welcomeMessage = "Good afternoon";
    else welcomeMessage = "Good evening";

    isLoading = false;
  });
</script>

<svelte:head>
  <title>Dashboard | Portfolia</title>
</svelte:head>

<div class="py-10">
  <header class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="md:flex md:items-center md:justify-between">
      <div class="min-w-0 flex-1">
        <h1 class="text-3xl font-bold text-neutral-900">
          {#if isLoading}
            <div class="animate-pulse bg-neutral-100 h-10 w-64 rounded"></div>
          {:else}
            {welcomeMessage}, {$currentUser?.name?.split(" ")[0] || "there"}!
          {/if}
        </h1>
        <p class="mt-1 text-sm text-neutral-500">
          Let's bring your professional story to life.
        </p>
      </div>
      <div class="mt-4 flex md:mt-0 md:ml-4">
        <Button variant="outline" class="mr-3">
          <svg
            class="mr-1.5 h-4 w-4"
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
          Weekly planner
        </Button>
        <Button>Create new</Button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto sm:px-6 lg:px-8">
    <!-- Quick actions section -->
    <div class="px-4 sm:px-0 mt-8">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {#each [{ title: "Complete your profile", icon: "👤", cta: "Update profile" }, { title: "Create your first portfolio", icon: "🎨", cta: "Start building" }, { title: "Explore connections", icon: "🔍", cta: "Find people" }, { title: "Discover job opportunities", icon: "💼", cta: "View jobs" }] as action, i}
          <Card variant="interactive" class="flex flex-col justify-between">
            <div>
              <div class="text-xl mb-2">{action.icon}</div>
              <h3 class="text-lg font-medium text-neutral-900">
                {action.title}
              </h3>
              <p class="mt-1 text-sm text-neutral-500">
                {#if isLoading}
                  <div
                    class="animate-pulse bg-neutral-100 h-4 w-full rounded mb-1"
                  ></div>
                  <div
                    class="animate-pulse bg-neutral-100 h-4 w-3/4 rounded"
                  ></div>
                {:else}
                  {i === 0
                    ? "Complete your profile to increase visibility and get personalized recommendations."
                    : i === 1
                      ? "Showcase your work with our stunning portfolio templates."
                      : i === 2
                        ? "Grow your network by connecting with other professionals."
                        : "Browse relevant job listings that match your skills."}
                {/if}
              </p>
            </div>
            <Button variant="outline" class="mt-4 text-sm w-full"
              >{action.cta}</Button
            >
          </Card>
        {/each}
      </div>
    </div>

    <!-- Portfolio preview section -->
    <div class="mt-10 px-4 sm:px-0">
      <h2 class="text-lg font-medium text-neutral-900 mb-4">Your portfolios</h2>
      {#if isLoading}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each Array(2) as _}
            <div
              class="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden"
            >
              <div class="animate-pulse bg-neutral-100 h-48 w-full"></div>
              <div class="p-4">
                <div
                  class="animate-pulse bg-neutral-100 h-5 w-3/4 rounded mb-2"
                ></div>
                <div
                  class="animate-pulse bg-neutral-100 h-4 w-full rounded mb-1"
                ></div>
                <div
                  class="animate-pulse bg-neutral-100 h-4 w-2/3 rounded"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div
          class="bg-neutral-50 border border-neutral-200 border-dashed rounded-lg p-6 text-center"
        >
          <svg
            class="mx-auto h-12 w-12 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-neutral-900">
            No portfolios yet
          </h3>
          <p class="mt-1 text-sm text-neutral-500">
            Create your first portfolio to showcase your work.
          </p>
          <div class="mt-6">
            <Button>
              <svg
                class="mr-1.5 h-4 w-4"
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
              Create a portfolio
            </Button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Activity and stats section -->
    <div class="mt-10 px-4 sm:px-0">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Recent activity -->
        <Card padding="lg" class="lg:col-span-2">
          <h2 class="text-lg font-medium text-neutral-900 mb-6">
            Recent activity
          </h2>
          {#if isLoading}
            {#each Array(3) as _, i}
              <div
                class="flex items-start pb-4 {i < 2
                  ? 'border-b border-neutral-200 mb-4'
                  : ''}"
              >
                <div
                  class="animate-pulse bg-neutral-100 h-10 w-10 rounded-full mr-3"
                ></div>
                <div class="flex-1">
                  <div
                    class="animate-pulse bg-neutral-100 h-4 w-3/4 rounded mb-2"
                  ></div>
                  <div
                    class="animate-pulse bg-neutral-100 h-4 w-1/2 rounded"
                  ></div>
                </div>
              </div>
            {/each}
          {:else}
            <div class="flex flex-col items-center justify-center py-6">
              <svg
                class="h-12 w-12 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p class="mt-2 text-sm text-neutral-500">No recent activity</p>
              <p class="text-xs text-neutral-400">
                Activity will appear here as you use the platform
              </p>
            </div>
          {/if}
        </Card>

        <!-- Profile completion -->
        <Card padding="lg">
          <h2 class="text-lg font-medium text-neutral-900 mb-4">
            Profile completion
          </h2>
          {#if isLoading}
            <div class="animate-pulse bg-neutral-100 h-4 rounded mb-2"></div>
            <div
              class="animate-pulse bg-neutral-100 h-3 w-3/4 rounded mb-4"
            ></div>
            <div
              class="animate-pulse bg-neutral-100 h-2 rounded-full mb-6"
            ></div>
            <div class="animate-pulse bg-neutral-100 h-24 rounded"></div>
          {:else}
            <div class="flex items-center">
              <div
                class="relative h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center"
              >
                <span class="text-primary-700 font-medium">25%</span>
                <svg
                  class="absolute top-0 left-0 h-16 w-16"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke-width="10"
                    stroke="#E0F2FE"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke-width="10"
                    stroke="#0EA5E9"
                    stroke-dasharray="282.74"
                    stroke-dashoffset="212.055"
                    stroke-linecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              </div>
              <div class="ml-4">
                <h4 class="font-medium">Your profile needs attention</h4>
                <p class="text-sm text-neutral-500">
                  Complete your profile to increase visibility
                </p>
              </div>
            </div>

            <div class="mt-6 space-y-4">
              {#each [{ task: "Add a profile picture", completed: true }, { task: "Add work experience", completed: false }, { task: "Add education details", completed: false }, { task: "Add your skills", completed: true }] as item}
                <div class="flex items-center">
                  <div
                    class={`flex-shrink-0 h-5 w-5 rounded-full border ${item.completed ? "bg-primary-500 border-primary-500" : "border-neutral-300"} flex items-center justify-center`}
                  >
                    {#if item.completed}
                      <svg
                        class="h-3 w-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    {/if}
                  </div>
                  <span
                    class="ml-2 text-sm {item.completed
                      ? 'text-neutral-500 line-through'
                      : 'text-neutral-700'}">{item.task}</span
                  >
                </div>
              {/each}
            </div>

            <Button variant="outline" fullWidth={true} class="mt-6"
              >Complete profile</Button
            >
          {/if}
        </Card>
      </div>
    </div>
  </main>
</div>
