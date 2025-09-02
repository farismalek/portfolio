<script lang="ts">
  import type { SubscriptionPlan, SubscriptionFeature } from '$lib/types/subscription';
  import CheckIcon from '$lib/components/icons/CheckIcon.svelte';
  import XIcon from '$lib/components/icons/XIcon.svelte';
  
  export let plans: SubscriptionPlan[] = [];
  export let selectedInterval: 'monthly' | 'yearly' = 'yearly';
  
  // Get all unique feature keys across all plans
  $: featureKeys = [...new Set(
    plans.flatMap(plan => plan.features.map(feature => feature.key))
  )];
  
  // Group features by category
  $: featureCategories = groupFeaturesByCategory(plans, featureKeys);
  
  function groupFeaturesByCategory(plans: SubscriptionPlan[], allFeatureKeys: string[]) {
    const categories = {};
    
    // Find all categories
    plans.forEach(plan => {
      plan.features.forEach(feature => {
        if (!feature.category) feature.category = 'General';
        
        if (!categories[feature.category]) {
          categories[feature.category] = [];
        }
        
        if (!categories[feature.category].includes(feature.key)) {
          categories[feature.category].push(feature.key);
        }
      });
    });
    
    return Object.entries(categories).map(([name, keys]) => ({
      name,
      keys: keys as string[]
    }));
  }
  
  // Get feature for a specific plan
  function getFeature(plan: SubscriptionPlan, featureKey: string): SubscriptionFeature | null {
    return plan.features.find(f => f.key === featureKey) || null;
  }
  
  // Calculate price based on selected interval
  function getPrice(plan: SubscriptionPlan): number {
    if (selectedInterval === 'yearly') {
      return plan.price.yearly;
    }
    return plan.price.monthly;
  }
</script>

<div class="overflow-x-auto">
  <table class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
    <thead>
      <tr>
        <th class="py-3 pl-4 pr-3 text-left text-sm font-medium text-neutral-500 dark:text-neutral-400 sm:pl-0">
          Features
        </th>
        
        {#each plans as plan}
          <th class="px-3 py-3 text-center text-sm font-medium text-neutral-900 dark:text-white">
            <span class="text-lg font-bold">{plan.name}</span>
            {#if plan.mostPopular}
              <span class="block text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">Most Popular</span>
            {/if}
            <span class="block mt-2 text-xl font-bold">${getPrice(plan)}</span>
            <span class="text-xs text-neutral-500 dark:text-neutral-400">per {selectedInterval === 'yearly' ? 'year' : 'month'}</span>
          </th>
        {/each}
      </tr>
    </thead>
    
    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
      {#each featureCategories as category}
        <!-- Category Header -->
        <tr class="bg-neutral-50 dark:bg-neutral-800">
          <th
            colspan={plans.length + 1}
            class="py-3 pl-4 pr-3 text-left text-sm font-medium text-neutral-900 dark:text-white sm:pl-0"
          >
            {category.name}
          </th>
        </tr>
        
        <!-- Features in this category -->
        {#each category.keys as featureKey}
          <tr>
            <td class="py-3 pl-4 pr-3 text-sm text-neutral-900 dark:text-neutral-200 sm:pl-0">
              {#each plans as plan}
                {#if getFeature(plan, featureKey)}
                  {getFeature(plan, featureKey)?.name}
                  {#break}
                {/if}
              {/each}
            </td>
            
            {#each plans as plan}
              <td class="px-3 py-3 text-sm text-center">
                {#if getFeature(plan, featureKey)}
                  {@const feature = getFeature(plan, featureKey)}
                  {#if feature?.included}
                    <div class="flex justify-center">
                      {#if feature?.limit}
                        <span class="text-sm font-medium text-neutral-900 dark:text-white">
                          {feature.limit}
                        </span>
                      {:else}
                        <CheckIcon class="h-5 w-5 text-green-500" />
                      {/if}
                    </div>
                  {:else}
                    <div class="flex justify-center">
                      <XIcon class="h-5 w-5 text-neutral-400" />
                    </div>
                  {/if}
                {:else}
                  <div class="flex justify-center">
                    <XIcon class="h-5 w-5 text-neutral-400" />
                  </div>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      {/each}
    </tbody>
  </table>
</div>