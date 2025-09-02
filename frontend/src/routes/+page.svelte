<script lang="ts">
  import { onMount } from "svelte";
  import { fly, fade } from "svelte/transition";
  import Button from "$lib/components/common/Button.svelte";

  let isPageLoaded = false;

  onMount(() => {
    isPageLoaded = true;
  });
</script>

<svelte:head>
  <title>Portfolia - Showcase Your Professional Identity</title>
</svelte:head>

<!-- Hero section -->
<div class="relative overflow-hidden bg-white">
  <div class="absolute inset-y-0 h-full w-full" aria-hidden="true">
    <div class="relative h-full">
      <svg
        class="absolute right-full translate-y-1/3 translate-x-1/4 transform sm:translate-x-1/2 md:translate-y-1/2 lg:translate-x-full"
        width="404"
        height="784"
        fill="none"
        viewBox="0 0 404 784"
      >
        <defs>
          <pattern
            id="e229dbec-10e9-49ee-8ec3-0286ca089edf"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0"
              y="0"
              width="4"
              height="4"
              class="text-neutral-100"
              fill="currentColor"
            />
          </pattern>
        </defs>
        <rect
          width="404"
          height="784"
          fill="url(#e229dbec-10e9-49ee-8ec3-0286ca089edf)"
        />
      </svg>
      <svg
        class="absolute left-full -translate-y-3/4 -translate-x-1/4 transform sm:-translate-x-1/2 md:-translate-y-1/2 lg:-translate-x-3/4"
        width="404"
        height="784"
        fill="none"
        viewBox="0 0 404 784"
      >
        <defs>
          <pattern
            id="d2a68204-c383-44b1-b99f-42ccff4e5365"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0"
              y="0"
              width="4"
              height="4"
              class="text-neutral-100"
              fill="currentColor"
            />
          </pattern>
        </defs>
        <rect
          width="404"
          height="784"
          fill="url(#d2a68204-c383-44b1-b99f-42ccff4e5365)"
        />
      </svg>
    </div>
  </div>

  <div class="relative pt-6 pb-16 sm:pb-24">
    <div class="mx-auto mt-16 max-w-7xl px-4 sm:mt-24 sm:px-6">
      <div class="text-center">
        {#if isPageLoaded}
          <h1
            class="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl"
          >
            <span class="block" in:fly={{ y: -20, duration: 800 }}
              >Showcase your</span
            >
            <span
              class="block text-primary-600"
              in:fly={{ y: -20, duration: 800, delay: 200 }}
            >
              professional identity
            </span>
          </h1>
          <p
            class="mx-auto mt-3 max-w-md text-base text-neutral-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl"
            in:fly={{ y: 20, duration: 800, delay: 400 }}
          >
            Build stunning portfolios, connect with opportunities, and grow your
            career in a community of professionals.
          </p>
          <div
            class="mx-auto mt-5 max-w-md sm:flex sm:justify-center md:mt-8"
            in:fade={{ duration: 800, delay: 600 }}
          >
            <div class="rounded-md shadow">
              <Button variant="primary" class="w-full py-3 px-8 text-base">
                Get started
              </Button>
            </div>
            <div class="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Button variant="outline" class="w-full py-3 px-8 text-base">
                Learn more
              </Button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Feature section -->
  <div class="relative bg-white pt-16 pb-32 overflow-hidden">
    {#if isPageLoaded}
      <div class="relative" in:fade={{ duration: 800, delay: 800 }}>
        <div
          class="lg:mx-auto lg:max-w-7xl lg:px-8 lg:grid lg:grid-cols-2 lg:grid-flow-col-dense lg:gap-24"
        >
          <div
            class="px-4 max-w-xl mx-auto sm:px-6 lg:py-16 lg:max-w-none lg:mx-0 lg:px-0"
          >
            <div>
              <div class="mt-6">
                <h2
                  class="text-3xl font-extrabold tracking-tight text-neutral-900"
                >
                  Showcase your work with stunning portfolios
                </h2>
                <p class="mt-4 text-lg text-neutral-500">
                  Create professional portfolios that highlight your skills,
                  experience, and accomplishments. Choose from a variety of
                  templates and customize them to reflect your unique style.
                </p>
                <div class="mt-6">
                  <Button>Start building</Button>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-12 sm:mt-16 lg:mt-0">
            <div
              class="pl-4 -mr-48 sm:pl-6 md:-mr-16 lg:px-0 lg:m-0 lg:relative lg:h-full"
            >
              <img
                class="w-full rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 lg:absolute lg:left-0 lg:h-full lg:w-auto lg:max-w-none"
                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2072&q=80"
                alt="Portfolio dashboard"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-24" in:fade={{ duration: 800, delay: 1000 }}>
        <div
          class="lg:mx-auto lg:max-w-7xl lg:px-8 lg:grid lg:grid-cols-2 lg:grid-flow-col-dense lg:gap-24"
        >
          <div
            class="px-4 max-w-xl mx-auto sm:px-6 lg:py-32 lg:max-w-none lg:mx-0 lg:px-0 lg:col-start-2"
          >
            <div>
              <div class="mt-6">
                <h2
                  class="text-3xl font-extrabold tracking-tight text-neutral-900"
                >
                  Connect with opportunities tailored to your skills
                </h2>
                <p class="mt-4 text-lg text-neutral-500">
                  Discover job opportunities that match your skills and
                  experience. Connect with recruiters and companies looking for
                  talent like yours.
                </p>
                <div class="mt-6">
                  <Button>Explore opportunities</Button>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-12 sm:mt-16 lg:mt-0 lg:col-start-1">
            <div
              class="pr-4 -ml-48 sm:pr-6 md:-ml-16 lg:px-0 lg:m-0 lg:relative lg:h-full"
            >
              <img
                class="w-full rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 lg:absolute lg:right-0 lg:h-full lg:w-auto lg:max-w-none"
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
                alt="Job opportunities"
              />
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- CTA section -->
  <div class="bg-primary-700" in:fade={{ duration: 800, delay: 1200 }}>
    <div
      class="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8"
    >
      <h2 class="text-3xl font-extrabold text-white sm:text-4xl">
        <span class="block">Ready to level up your professional presence?</span>
      </h2>
      <p class="mt-4 text-lg leading-6 text-primary-100">
        Join thousands of professionals showcasing their work and advancing
        their careers with Portfolia.
      </p>
      <Button
        class="mt-8 w-full sm:w-auto px-5 py-3 text-base font-medium rounded-md shadow bg-white text-primary-600 hover:bg-primary-50"
      >
        Sign up for free
      </Button>
    </div>
  </div>
</div>
