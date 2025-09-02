<script lang="ts">
  import { login } from "$lib/auth/auth0";
  import Button from "$lib/components/common/Button.svelte";
  import { goto } from "$app/navigation";

  // Animation configuration
  import { fly } from "svelte/transition";

  // Track loading states
  let isLoading = false;

  async function handleLogin() {
    isLoading = true;
    try {
      await login();
    } catch (error) {
      console.error("Login error:", error);
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Log in to Portfolia</title>
</svelte:head>

<div class="min-h-screen flex">
  <!-- Left side with form -->
  <div
    class="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white"
  >
    <div
      class="mx-auto w-full max-w-sm lg:max-w-md"
      in:fly={{ y: 20, duration: 600, delay: 200 }}
    >
      <div>
        <a href="/" class="inline-block mb-6">
          <span class="text-3xl font-display font-bold text-neutral-900"
            >Portfolia</span
          >
        </a>
        <h2 class="mt-6 text-3xl font-extrabold text-neutral-900">
          Sign in to your account
        </h2>
        <p class="mt-2 text-sm text-neutral-600">
          Or
          <a
            href="/auth/signup"
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            create an account if you're new
          </a>
        </p>
      </div>

      <div class="mt-8">
        <div class="space-y-5">
          <Button
            variant="outline"
            fullWidth={true}
            on:click={handleLogin}
            loading={isLoading}
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <Button
            variant="outline"
            fullWidth={true}
            on:click={handleLogin}
            loading={isLoading}
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
              />
            </svg>
            Continue with Facebook
          </Button>

          <Button
            variant="outline"
            fullWidth={true}
            on:click={handleLogin}
            loading={isLoading}
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path
                fill-rule="evenodd"
                d="M12.146 0c-6.623 0-12 5.377-12 12 0 5.302 3.438 9.8 8.206 11.387.6.11.82-.26.82-.58 0-.29-.01-1.046-.015-2.054-3.338.726-4.042-1.61-4.042-1.61-.546-1.386-1.334-1.755-1.334-1.755-1.09-.746.083-.73.083-.73 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.895-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.623-5.377-12-12-12z"
                clip-rule="evenodd"
              />
            </svg>
            Continue with GitHub
          </Button>

          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-neutral-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-neutral-500"
                >Or continue with email</span
              >
            </div>
          </div>

          <form class="space-y-6" on:submit|preventDefault={handleLogin}>
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-neutral-700"
                >Email address</label
              >
              <div class="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                for="password"
                class="block text-sm font-medium text-neutral-700"
                >Password</label
              >
              <div class="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autocomplete="current-password"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label
                  for="remember-me"
                  class="ml-2 block text-sm text-neutral-700"
                >
                  Remember me
                </label>
              </div>

              <div class="text-sm">
                <a
                  href="/auth/reset-password"
                  class="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth={true}
                loading={isLoading}
              >
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Right side with illustration -->
  <div class="hidden lg:block relative w-0 flex-1 bg-primary-600">
    <div
      class="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800"
    >
      <!-- Decorative elements -->
      <div
        class="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary-700 opacity-30"
      ></div>
      <div
        class="absolute w-40 h-40 rounded-full bg-primary-500 opacity-20 top-20 left-20 animate-pulse"
      ></div>
      <div
        class="absolute w-56 h-56 rounded-full bg-primary-500 opacity-10 bottom-40 right-20"
      ></div>
      <div
        class="absolute w-24 h-24 rounded-full bg-white opacity-10 bottom-20 left-40"
      ></div>
    </div>

    <div class="absolute inset-0 flex items-center justify-center p-10">
      <div class="max-w-2xl text-white">
        <h2 class="text-4xl font-bold mb-4">
          Showcase your professional identity
        </h2>
        <p class="text-xl opacity-80">
          Build stunning portfolios and connect with opportunities tailored to
          your unique skills and experience.
        </p>

        <div class="mt-10 grid grid-cols-2 gap-6">
          <div class="bg-white bg-opacity-10 backdrop-blur-lg p-5 rounded-xl">
            <div class="text-primary-300 mb-2">✦ Talent Showcase</div>
            <p class="text-sm text-white opacity-80">
              Build beautiful portfolios that highlight your professional
              journey
            </p>
          </div>
          <div class="bg-white bg-opacity-10 backdrop-blur-lg p-5 rounded-xl">
            <div class="text-primary-300 mb-2">✦ Career Growth</div>
            <p class="text-sm text-white opacity-80">
              Connect with opportunities that match your skills and aspirations
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
