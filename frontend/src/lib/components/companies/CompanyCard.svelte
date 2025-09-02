<script lang="ts">
  import Avatar from "$lib/components/common/Avatar.svelte";
  import Badge from "$lib/components/common/Badge.svelte";
  import { getInitials } from "$lib/utils/stringUtils";

  export let company;

  // Calculate job count text
  $: jobCountText =
    company.jobCount === 1 ? "1 job" : `${company.jobCount} jobs`;
</script>

<a href="/companies/{company.slug}" class="block group">
  <div
    class="bg-white rounded-lg shadow-sm overflow-hidden border border-neutral-200 group-hover:shadow-md group-hover:border-primary-300 transition-all"
  >
    <!-- Cover/Header -->
    <div class="h-24 bg-gradient-to-r from-primary-600 to-primary-800 relative">
      {#if company.coverImageUrl}
        <img
          src={company.coverImageUrl}
          alt={company.name}
          class="w-full h-full object-cover"
        />
      {/if}

      <!-- Logo -->
      <div class="absolute -bottom-10 left-4">
        <div
          class="rounded-lg bg-white shadow-md p-1 w-20 h-20 flex items-center justify-center overflow-hidden"
        >
          {#if company.logoUrl}
            <img
              src={company.logoUrl}
              alt={company.name}
              class="max-w-full max-h-full object-contain"
            />
          {:else}
            <div
              class="w-full h-full rounded-md bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold"
            >
              {getInitials(company.name)}
            </div>
          {/if}
        </div>
      </div>

      <!-- Verification Badge -->
      {#if company.verificationStatus === "verified"}
        <div class="absolute top-2 right-2">
          <Badge color="blue" title="Verified Company">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </Badge>
        </div>
      {/if}
    </div>

    <!-- Content -->
    <div class="pt-12 px-4 pb-4">
      <h3
        class="font-bold text-lg text-neutral-900 group-hover:text-primary-700 transition-colors"
      >
        {company.name}
      </h3>

      {#if company.industry}
        <p class="text-sm text-neutral-500 mt-1">
          {company.industry}
        </p>
      {/if}

      {#if company.shortDescription}
        <p class="text-sm text-neutral-600 mt-3 line-clamp-2">
          {company.shortDescription}
        </p>
      {/if}

      <!-- Footer -->
      <div
        class="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500"
      >
        <div class="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span>{jobCountText}</span>
        </div>

        {#if company.headquarters}
          <div class="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
            <span>{company.headquarters}</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
</a>
