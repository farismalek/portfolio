<script lang="ts">
  import { login } from "$lib/auth/auth0";
  import Button from "$lib/components/common/Button.svelte";
  import Input from "$lib/components/common/Input.svelte";
  import { goto } from "$app/navigation";

  // Animation configuration
  import { fly } from "svelte/transition";

  // Form state
  let email = "";
  let password = "";
  let name = "";
  let isLoading = false;
  let errors = {};

  // Role selection
  let selectedRole = "creator";

  const roles = [
    {
      id: "creator",
      label: "Creator",
      description: "I want to showcase my work and build a portfolio",
    },
    {
      id: "recruiter",
      label: "Recruiter",
      description: "I want to find and connect with talented professionals",
    },
  ];

  async function handleSignup() {
    isLoading = true;

    // In a real implementation, we would validate the form data here
    // and then call a custom signup endpoint or Auth0's signup API

    try {
      // For now, we'll just redirect to the Auth0 login/signup flow
      await login();
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      isLoading = false;
    }
  }

  function handleRoleSelect(roleId) {
    selectedRole = roleId;
  }
</script>

<svelte:head>
  <title>Sign up for Portfolia</title>
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
          Create your account
        </h2>
        <p class="mt-2 text-sm text-neutral-600">
          Or
          <a
            href="/auth/login"
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            sign in if you already have an account
          </a>
        </p>
      </div>

      <div class="mt-8">
        <div class="space-y-5">
          <Button variant="outline" fullWidth={true} on:click={login}>
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
            Sign up with Google
          </Button>

          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-neutral-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-neutral-500"
                >Or sign up with email</span
              >
            </div>
          </div>

          <!-- Role selection -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-neutral-700 mb-2"
              >I am a:</label
            >
            <div class="space-y-3">
              {#each roles as role}
                <div
                  class="border rounded-lg p-3 transition-all cursor-pointer {selectedRole ===
                  role.id
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-neutral-200 hover:border-neutral-300'}"
                  on:click={() => handleRoleSelect(role.id)}
                  on:keydown={(e) =>
                    e.key === "Enter" && handleRoleSelect(role.id)}
                  tabindex="0"
                  role="radio"
                  aria-checked={selectedRole === role.id}
                >
                  <div class="flex items-start">
                    <div class="flex-shrink-0 mt-0.5">
                      <div
                        class="h-5 w-5 rounded-full border-2 flex items-center justify-center {selectedRole ===
                        role.id
                          ? 'border-primary-500'
                          : 'border-neutral-300'}"
                      >
                        {#if selectedRole === role.id}
                          <div
                            class="h-2.5 w-2.5 rounded-full bg-primary-500"
                          ></div>
                        {/if}
                      </div>
                    </div>
                    <div class="ml-3">
                      <h3 class="text-sm font-medium text-neutral-900">
                        {role.label}
                      </h3>
                      <p class="text-xs text-neutral-500">{role.description}</p>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <form class="space-y-5" on:submit|preventDefault={handleSignup}>
            <Input
              id="name"
              label="Full name"
              type="text"
              bind:value={name}
              placeholder="Enter your full name"
              required={true}
              error={errors?.name}
            />

            <Input
              id="email"
              label="Email address"
              type="email"
              bind:value={email}
              placeholder="Enter your email"
              required={true}
              error={errors?.email}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              bind:value={password}
              placeholder="Create a password"
              required={true}
              error={errors?.password}
              helperText="Must contain at least 8 characters, including a number and a special character"
            />

            <div class="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <label for="terms" class="ml-2 block text-sm text-neutral-700">
                I agree to the <a
                  href="/legal/terms"
                  class="text-primary-600 hover:text-primary-500"
                  >Terms of Service</a
                >
                and
                <a
                  href="/legal/privacy"
                  class="text-primary-600 hover:text-primary-500"
                  >Privacy Policy</a
                >
              </label>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth={true}
                loading={isLoading}
              >
                Create account
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Right side with image -->
  <div class="hidden lg:block relative w-0 flex-1">
    <div
      class="absolute inset-0 bg-gradient-to-bl from-primary-900 to-primary-700"
    >
      <!-- Decorative patterns -->
      <div
        class="absolute inset-0 opacity-10"
        style="background-image: url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"
      ></div>

      <!-- Content overlay -->
      <div class="absolute inset-0 flex flex-col justify-center px-8 lg:px-16">
        <div
          class="bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-2xl max-w-lg"
        >
          <h2 class="text-3xl font-bold text-white mb-4">
            Craft your professional story
          </h2>
          <p class="text-lg text-white text-opacity-90 mb-6">
            Portfolia gives you the tools to showcase your work, connect with
            opportunities, and grow your career in a community of professionals.
          </p>

          <div class="flex items-center space-x-4">
            <div class="flex -space-x-2">
              <img
                class="h-10 w-10 rounded-full ring-2 ring-white"
                src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
              />
              <img
                class="h-10 w-10 rounded-full ring-2 ring-white"
                src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
              />
              <img
                class="h-10 w-10 rounded-full ring-2 ring-white"
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80"
                alt=""
              />
            </div>
            <p class="text-white text-opacity-80">
              Join thousands of professionals already on Portfolia
            </p>
          </div>

          <div class="mt-8 grid grid-cols-3 gap-3">
            <div class="bg-white bg-opacity-20 p-3 rounded-lg">
              <div class="text-2xl font-bold text-white">15k+</div>
              <div class="text-sm text-white text-opacity-80">
                Active Portfolios
              </div>
            </div>
            <div class="bg-white bg-opacity-20 p-3 rounded-lg">
              <div class="text-2xl font-bold text-white">5k+</div>
              <div class="text-sm text-white text-opacity-80">
                Job Opportunities
              </div>
            </div>
            <div class="bg-white bg-opacity-20 p-3 rounded-lg">
              <div class="text-2xl font-bold text-white">98%</div>
              <div class="text-sm text-white text-opacity-80">
                User Satisfaction
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
