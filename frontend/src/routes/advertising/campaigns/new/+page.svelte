<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { 
    createAdCampaign, 
    fetchAdPlacements, 
    fetchAdAudiences, 
    getAdBudgetRecommendation 
  } from '$lib/services/adService';
  import type { 
    AdCampaign, 
    AdCampaignObjective,
    AdPlacement,
    AdAudience
  } from '$lib/types/advertising';
  import PageHeader from '$lib/components/common/PageHeader.svelte';
  import Card from '$lib/components/common/Card.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import TextField from '$lib/components/common/TextField.svelte';
  import TextAreaField from '$lib/components/common/TextAreaField.svelte';
  import Select from '$lib/components/common/Select.svelte';
  import Checkbox from '$lib/components/common/Checkbox.svelte';
  import DatePicker from '$lib/components/common/DatePicker.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import AlertBox from '$lib/components/common/AlertBox.svelte';
  import Tabs from '$lib/components/common/Tabs.svelte';
  import RangeSlider from '$lib/components/common/RangeSlider.svelte';
  
  let loading = true;
  let savingCampaign = false;
  let error: string | null = null;
  let success = false;
  let placements: AdPlacement[] = [];
  let audiences: AdAudience[] = [];
  let activeTab = 'details';
  let budgetRecommendation = null;
  
  // Campaign form data
  let campaign: Partial<AdCampaign> = {
    name: '',
    objective: 'awareness',
    budget: 200,
    dailyBudget: 20,
    startDate: new Date().toISOString(),
    targeting: {
      countries: [],
      languages: [],
      industries: [],
      skills: [],
      interests: []
    }
  };
  
  // Selected placements
  let selectedPlacements: string[] = [];
  
  // Selected audience
  let selectedAudience: string = '';
  
  // Form handling
  let isCustomBudget = false;
  
  // Objective options
  const objectiveOptions = [
    { value: 'awareness', label: 'Brand Awareness', description: 'Introduce your brand to a wider audience' },
    { value: 'traffic', label: 'Website Traffic', description: 'Drive visitors to your portfolio or website' },
    { value: 'engagement', label: 'Profile Engagement', description: 'Increase engagement with your profile' },
    { value: 'leads', label: 'Lead Generation', description: 'Collect leads and grow your network' },
    { value: 'conversions', label: 'Conversions', description: 'Drive specific actions like purchases or sign-ups' }
  ];
  
  onMount(async () => {
    try {
      // Fetch ad placements and audiences in parallel
      const [placementsData, audiencesData] = await Promise.all([
        fetchAdPlacements(),
        fetchAdAudiences()
      ]);
      
      placements = placementsData;
      audiences = audiencesData;
      
      // Set default placements
      if (placements.length > 0) {
        selectedPlacements = [placements[0].id];
      }
      
      // Get budget recommendation
      if (audiences.length > 0) {
        selectedAudience = audiences[0].id;
        await getBudgetRecommendation();
      }
      
      loading = false;
    } catch (err) {
      error = err.message || 'Failed to load campaign data';
      loading = false;
    }
  });
  
  async function getBudgetRecommendation() {
    if (!selectedAudience) return;
    
    try {
      const audience = audiences.find(a => a.id === selectedAudience);
      if (!audience) return;
      
      // Get targeting parameters from selected audience
      const targetAudience = [];
      if (audience.targeting.industries) targetAudience.push(...audience.targeting.industries);
      if (audience.targeting.skills) targetAudience.push(...audience.targeting.skills);
      if (audience.targeting.interests) targetAudience.push(...audience.targeting.interests);
      
      // Get objectives
      const objectives = [campaign.objective];
      
      budgetRecommendation = await getAdBudgetRecommendation(targetAudience, objectives);
      
      // Set default budget based on recommendation
      if (!isCustomBudget && budgetRecommendation) {
        campaign.budget = budgetRecommendation.recommendedBudget;
        campaign.dailyBudget = Math.round(budgetRecommendation.recommendedBudget / 30);
      }
    } catch (err) {
      console.error('Error getting budget recommendation:', err);
    }
  }
  
  // Format currency
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
  
  // Update daily budget based on total budget
  function updateDailyBudget() {
    if (!campaign.budget) return;
    
    // Estimate campaign duration as 30 days
    campaign.dailyBudget = Math.round(campaign.budget / 30);
  }
  
  // Update total budget based on daily budget
  function updateTotalBudget() {
    if (!campaign.dailyBudget) return;
    
    // Estimate campaign duration as 30 days
    campaign.budget = campaign.dailyBudget * 30;
  }
  
  // Save campaign
  async function saveCampaign() {
    if (!validateForm()) {
      return;
    }
    
    savingCampaign = true;
    error = null;
    
    try {
      // Add selected placements and audience to campaign
      const campaignData = {
        ...campaign,
        audienceId: selectedAudience,
        placements: selectedPlacements
      };
      
      await createAdCampaign(campaignData);
      success = true;
      
      // Redirect to campaign list after a short delay
      setTimeout(() => {
        goto('/advertising/campaigns');
      }, 2000);
    } catch (err) {
      error = err.message || 'Failed to create campaign';
      savingCampaign = false;
    }
  }
  
  // Validate form before submission
  function validateForm(): boolean {
    if (!campaign.name) {
      error = 'Campaign name is required';
      return false;
    }
    
    if (!campaign.objective) {
      error = 'Campaign objective is required';
      return false;
    }
    
    if (!campaign.budget || campaign.budget < 50) {
      error = 'Campaign budget must be at least $50';
      return false;
    }
    
    if (!campaign.dailyBudget || campaign.dailyBudget < 5) {
      error = 'Daily budget must be at least $5';
      return false;
    }
    
    if (!campaign.startDate) {
      error = 'Start date is required';
      return false;
    }
    
    if (!selectedAudience) {
      error = 'Please select a target audience';
      return false;
    }
    
    if (selectedPlacements.length === 0) {
      error = 'Please select at least one placement';
      return false;
    }
    
    return true;
  }
</script>

<svelte:head>
  <title>Create Advertising Campaign | Portfolia</title>
  <meta name="description" content="Create a new advertising campaign to promote your portfolio" />
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <PageHeader
    title="Create Advertising Campaign"
    description="Promote your portfolio and reach more professionals"
  >
    <Button href="/advertising/campaigns" variant="ghost">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Campaigns
    </Button>
  </PageHeader>
  
  {#if loading}
    <div class="flex justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>
  {:else if success}
    <AlertBox type="success" class="my-8">
      Campaign created successfully! Redirecting to campaigns page...
    </AlertBox>
  {:else}
    <Card>
      <div class="p-6">
        {#if error}
          <AlertBox type="error" dismissible bind:visible={error} class="mb-6">
            {error}
          </AlertBox>
        {/if}
        
        <Tabs
          tabs={[
            { id: 'details', label: 'Campaign Details' },
            { id: 'audience', label: 'Target Audience' },
            { id: 'budget', label: 'Budget & Schedule' },
            { id: 'placement', label: 'Ad Placement' }
          ]}
          bind:activeTab
        />
        
        <div class="mt-6">
          <!-- Campaign Details Tab -->
          {#if activeTab === 'details'}
            <div class="space-y-6">
              <TextField 
                label="Campaign Name"
                bind:value={campaign.name}
                placeholder="e.g., Portfolio Promotion Summer 2025"
                required
              />
              
              <div>
                <label class="block text-sm font-medium mb-2">
                  Campaign Objective
                </label>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {#each objectiveOptions as option}
                    <div 
                      class="border rounded-lg p-4 cursor-pointer transition-colors {campaign.objective === option.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'}"
                      on:click={() => {
                        campaign.objective = option.value as AdCampaignObjective;
                        getBudgetRecommendation();
                      }}
                    >
                      <div class="flex items-center">
                        <input
                          type="radio"
                          name="objective"
                          value={option.value}
                          checked={campaign.objective === option.value}
                          class="form-radio h-4 w-4 text-primary-600"
                        />
                        <span class="font-medium ml-2">{option.label}</span>
                      </div>
                      <p class="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                        {option.description}
                      </p>
                    </div>
                  {/each}
                </div>
              </div>
              
              <TextAreaField
                label="Campaign Description (Optional)"
                bind:value={campaign.description}
                placeholder="Describe the goal of your campaign"
                rows={3}
              />
              
              <div class="flex justify-end">
                <Button variant="primary" on:click={() => activeTab = 'audience'}>
                  Continue to Target Audience
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          
          <!-- Audience Tab -->
          {:else if activeTab === 'audience'}
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium mb-2">
                  Target Audience
                </label>
                
                {#if audiences.length > 0}
                  <div class="space-y-4">
                    {#each audiences as audience}
                      <div 
                        class="border rounded-lg p-4 cursor-pointer transition-colors {selectedAudience === audience.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'}"
                        on:click={() => {
                          selectedAudience = audience.id;
                          getBudgetRecommendation();
                        }}
                      >
                        <div class="flex items-center justify-between">
                          <div class="flex items-center">
                            <input
                              type="radio"
                              name="audience"
                              value={audience.id}
                              checked={selectedAudience === audience.id}
                              class="form-radio h-4 w-4 text-primary-600"
                            />
                            <span class="font-medium ml-2">{audience.name}</span>
                          </div>
                          <span class="text-sm text-neutral-500">
                            {audience.size ? `Est. ${audience.size.toLocaleString()} users` : 'Custom audience'}
                          </span>
                        </div>
                        
                        {#if audience.description}
                          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            {audience.description}
                          </p>
                        {/if}
                        
                        <div class="mt-3 flex flex-wrap gap-2">
                          {#if audience.targeting.industries && audience.targeting.industries.length > 0}
                            {#each audience.targeting.industries.slice(0, 3) as industry}
                              <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                {industry}
                              </span>
                            {/each}
                            {#if audience.targeting.industries.length > 3}
                              <span class="px-2 py-1 text-xs rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                                +{audience.targeting.industries.length - 3} more
                              </span>
                            {/if}
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                  
                  <div class="mt-4 text-right">
                    <Button variant="outline" href="/advertising/audiences/new" size="sm">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create New Audience
                    </Button>
                  </div>
                {:else}
                  <div class="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-8 text-center">
                    <p class="text-neutral-600 dark:text-neutral-400 mb-4">
                      You don't have any saved audiences yet.
                    </p>
                    <Button variant="primary" href="/advertising/audiences/new">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create New Audience
                    </Button>
                  </div>
                {/if}
              </div>
              
              <div class="flex justify-between">
                <Button variant="outline" on:click={() => activeTab = 'details'}>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
                <Button variant="primary" on:click={() => activeTab = 'budget'}>
                  Continue to Budget & Schedule
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          
          <!-- Budget Tab -->
          {:else if activeTab === 'budget'}
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-medium mb-4">Campaign Budget</h3>
                
                {#if budgetRecommendation}
                  <div class="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg mb-6">
                    <h4 class="text-sm font-medium mb-2">Recommended Budget</h4>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      Based on your objective and target audience, we recommend a budget of <strong>{formatCurrency(budgetRecommendation.recommendedBudget)}</strong> for optimal results.
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div class="p-3 bg-white dark:bg-neutral-700 rounded-md">
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">Estimated Reach</p>
                        <p class="text-lg font-medium">
                          {budgetRecommendation.estimatedReach.min.toLocaleString()} - {budgetRecommendation.estimatedReach.max.toLocaleString()}
                        </p>
                      </div>
                      <div class="p-3 bg-white dark:bg-neutral-700 rounded-md">
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">Estimated Clicks</p>
                        <p class="text-lg font-medium">
                          {budgetRecommendation.estimatedClicks.min.toLocaleString()} - {budgetRecommendation.estimatedClicks.max.toLocaleString()}
                        </p>
                      </div>
                      <div class="p-3 bg-white dark:bg-neutral-700 rounded-md">
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">Avg. Cost Per Click</p>
                        <p class="text-lg font-medium">
                          ${budgetRecommendation.estimatedCPC.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                {/if}
                
                <div class="flex items-center mb-4">
                  <Checkbox
                    bind:checked={isCustomBudget}
                    label="Set custom budget"
                  />
                </div>
                
                {#if !isCustomBudget && budgetRecommendation}
                  <div class="grid grid-cols-3 gap-4">
                    <button 
                      class="p-4 border rounded-lg text-center transition {campaign.budget === budgetRecommendation.minimumBudget ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-neutral-200 dark:border-neutral-700'}"
                      on:click={() => {
                        campaign.budget = budgetRecommendation.minimumBudget;
                        updateDailyBudget();
                      }}
                    >
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">Starter</p>
                      <p class="text-xl font-bold mt-1">{formatCurrency(budgetRecommendation.minimumBudget)}</p>
                    </button>
                    
                    <button 
                      class="p-4 border rounded-lg text-center transition {campaign.budget === budgetRecommendation.recommendedBudget ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-neutral-200 dark:border-neutral-700'}"
                      on:click={() => {
                        campaign.budget = budgetRecommendation.recommendedBudget;
                        updateDailyBudget();
                      }}
                    >
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">Recommended</p>
                      <p class="text-xl font-bold mt-1">{formatCurrency(budgetRecommendation.recommendedBudget)}</p>
                      <p class="text-xs mt-1 text-primary-600 dark:text-primary-400">Best value</p>
                    </button>
                    
                    <button 
                      class="p-4 border rounded-lg text-center transition {campaign.budget === budgetRecommendation.recommendedBudget * 2 ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-neutral-200 dark:border-neutral-700'}"
                      on:click={() => {
                        campaign.budget = budgetRecommendation.recommendedBudget * 2;
                        updateDailyBudget();
                      }}
                    >
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">Premium</p>
                      <p class="text-xl font-bold mt-1">{formatCurrency(budgetRecommendation.recommendedBudget * 2)}</p>
                    </button>
                  </div>
                {/if}
                
                <div class="mt-6 {isCustomBudget || !budgetRecommendation ? '' : 'hidden'}">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <TextField
                        label="Total Budget"
                        type="number"
                        min="50"
                        step="10"
                        bind:value={campaign.budget}
                        placeholder="500"
                        prefix="$"
                        required
                        on:input={updateDailyBudget}
                      />
                      <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Minimum budget: $50
                      </p>
                    </div>
                    
                    <div>
                      <TextField
                        label="Daily Budget"
                        type="number"
                        min="5"
                        step="1"
                        bind:value={campaign.dailyBudget}
                        placeholder="50"
                        prefix="$"
                        required
                        on:input={updateTotalBudget}
                      />
                      <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Minimum daily budget: $5
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <h3 class="text-lg font-medium mb-4">Campaign Schedule</h3>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium mb-2">
                      Start Date
                    </label>
                    <DatePicker
                      bind:value={campaign.startDate}
                      minDate={new Date().toISOString()}
                      placeholder="Select start date"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium mb-2">
                      End Date (Optional)
                    </label>
                    <DatePicker
                      bind:value={campaign.endDate}
                      minDate={campaign.startDate}
                      placeholder="Select end date"
                    />
                    <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      Leave blank to run continuously until budget is spent
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="flex justify-between">
                <Button variant="outline" on:click={() => activeTab = 'audience'}>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
                <Button variant="primary" on:click={() => activeTab = 'placement'}>
                  Continue to Ad Placement
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          
          <!-- Placement Tab -->
          {:else if activeTab === 'placement'}
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-medium mb-2">Ad Placements</h3>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Select where you want your ads to appear across the platform.
                </p>
                
                {#if placements.length > 0}
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {#each placements as placement}
                      <label 
                        class="border rounded-lg p-4 cursor-pointer transition-colors {selectedPlacements.includes(placement.id) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'}"
                      >
                        <div class="flex items-start">
                          <input
                            type="checkbox"
                            value={placement.id}
                            checked={selectedPlacements.includes(placement.id)}
                            on:change={(e) => {
                              if (e.target.checked) {
                                selectedPlacements = [...selectedPlacements, placement.id];
                              } else {
                                selectedPlacements = selectedPlacements.filter(id => id !== placement.id);
                              }
                            }}
                            class="form-checkbox h-5 w-5 mt-0.5 text-primary-600"
                          />
                          
                          <div class="ml-3">
                            <div class="font-medium">{placement.name}</div>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                              {placement.description}
                            </p>
                            
                            <div class="mt-2 text-xs text-neutral-500 flex items-center">
                              <span>Min. bid: ${placement.minBid}</span>
                              {#if placement.avgCtr}
                                <span class="mx-2">•</span>
                                <span>Avg. CTR: {placement.avgCtr}%</span>
                              {/if}
                            </div>
                            
                            {#if placement.requirements}
                              <div class="mt-2 text-xs">
                                <span class="text-neutral-500">Formats:</span> 
                                <span>{placement.requirements.formats.join(', ')}</span>
                                
                                {#if placement.requirements.aspectRatio}
                                  <span class="mx-1 text-neutral-500">•</span>
                                  <span>{placement.requirements.aspectRatio}</span>
                                {/if}
                              </div>
                            {/if}
                          </div>
                        </div>
                      </label>
                    {/each}
                  </div>
                {/if}
              </div>
              
              <div class="pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <div class="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg">
                  <h3 class="text-lg font-medium mb-4">Campaign Summary</h3>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div class="text-sm font-medium text-neutral-500 mb-1">Campaign Name</div>
                      <div>{campaign.name || 'Untitled Campaign'}</div>
                      
                      <div class="text-sm font-medium text-neutral-500 mt-3 mb-1">Objective</div>
                      <div>
                        {objectiveOptions.find(o => o.value === campaign.objective)?.label || 'Not selected'}
                      </div>
                      
                      <div class="text-sm font-medium text-neutral-500 mt-3 mb-1">Target Audience</div>
                      <div>
                        {audiences.find(a => a.id === selectedAudience)?.name || 'Not selected'}
                      </div>
                      
                      <div class="text-sm font-medium text-neutral-500 mt-3 mb-1">Ad Placements</div>
                      <div>
                        {selectedPlacements.length > 0
                          ? selectedPlacements.map(id => placements.find(p => p.id === id)?.name).filter(Boolean).join(', ')
                          : 'None selected'}
                      </div>
                    </div>
                    
                    <div>
                      <div class="text-sm font-medium text-neutral-500 mb-1">Total Budget</div>
                      <div>{formatCurrency(campaign.budget || 0)}</div>
                      
                      <div class="text-sm font-medium text-neutral-500 mt-3 mb-1">Daily Budget</div>
                      <div>{formatCurrency(campaign.dailyBudget || 0)}</div>
                      
                      <div class="text-sm font-medium text-neutral-500 mt-3 mb-1">Start Date</div>
                      <div>
                        {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'Not set'}
                      </div>
                      
                      <div class="text-sm font-medium text-neutral-500 mt-3 mb-1">End Date</div>
                      <div>
                        {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Continuous'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="flex justify-between">
                <Button variant="outline" on:click={() => activeTab = 'budget'}>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
                
                                <div class="flex space-x-3">
                  <Button variant="outline" on:click={() => goto('/advertising/campaigns')}>
                    Cancel
                  </Button>
                  <Button 
                    variant="primary"
                    on:click={saveCampaign}
                    disabled={savingCampaign}
                  >
                    {#if savingCampaign}
                      <LoadingSpinner size="sm" class="mr-2" />
                      Creating Campaign...
                    {:else}
                      Create Campaign
                    {/if}
                  </Button>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </Card>
  {/if}
</div>