<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { portfolioEditorStore } from '$lib/stores/portfolioEditorStore';
  import { updatePortfolio } from '$lib/services/portfolioService';
  import Button from '../../common/Button.svelte';
  import Input from '../../common/Input.svelte';
  import ColorPicker from './editors/ColorPicker.svelte';
  import ToggleEditor from './editors/ToggleEditor.svelte';
  
  // Local state
  let isSaving = false;
  let error: string | null = null;
  let portfolioTitle = '';
  let portfolioDescription = '';
  let portfolioSlug = '';
  let portfolioVisibility: 'public' | 'private' | 'password_protected' = 'public';
  let portfolioPassword = '';
  
  const dispatch = createEventDispatcher();
  
  // Visibility options
  const visibilityOptions = [
    { id: 'public', label: 'Public', description: 'Visible to everyone' },
    { id: 'private', label: 'Private', description: 'Only visible to you' },
    { id: 'password_protected', label: 'Password Protected', description: 'Requires a password to view' }
  ];
  
  // Themes
  const themes = [
    { id: 'modern', name: 'Modern', primary: '#3B82F6', neutral: '#1F2937' },
    { id: 'creative', name: 'Creative', primary: '#EC4899', neutral: '#171717' },
    { id: 'professional', name: 'Professional', primary: '#2563EB', neutral: '#111827' },
    { id: 'tech', name: 'Tech', primary: '#14B8A6', neutral: '#0F172A' },
    { id: 'minimal', name: 'Minimal', primary: '#64748B', neutral: '#0F172A' }
  ];
  
  // Typography
  const fontFamilies = [
    { id: 'inter', name: 'Inter', sample: 'Inter, sans-serif' },
    { id: 'poppins', name: 'Poppins', sample: 'Poppins, sans-serif' },
    { id: 'roboto', name: 'Roboto', sample: 'Roboto, sans-serif' },
    { id: 'playfair', name: 'Playfair Display', sample: 'Playfair Display, serif' },
    { id: 'jetbrains', name: 'JetBrains Mono', sample: 'JetBrains Mono, monospace' }
  ];
  
  // Initialize state from store
  $: {
    if ($portfolioEditorStore.portfolio) {
      portfolioTitle = $portfolioEditorStore.portfolio.title || '';
      portfolioDescription = $portfolioEditorStore.portfolio.description || '';
      portfolioSlug = $portfolioEditorStore.portfolio.slug || '';
      portfolioVisibility = $portfolioEditorStore.portfolio.visibility as any || 'public';
      portfolioPassword = $portfolioEditorStore.portfolio.password || '';
    }
  }
  
  // Save portfolio settings
  async function savePortfolioSettings() {
    if (!$portfolioEditorStore.portfolio) return;
    
    isSaving = true;
    error = null;
    
    try {
      const updatedPortfolio = await updatePortfolio({
        id: $portfolioEditorStore.portfolio.id,
        title: portfolioTitle,
        description: portfolioDescription,
        visibility: portfolioVisibility,
        password: portfolioVisibility === 'password_protected' ? portfolioPassword : undefined
      });
      
      // Update local state
      portfolioEditorStore.update(state => ({
        ...state,
        portfolio: {
          ...state.portfolio!,
          title: updatedPortfolio.title,
          description: updatedPortfolio.description,
          visibility: updatedPortfolio.visibility,
          password: updatedPortfolio.password
        }
      }));
      
      // Show success message temporarily
      dispatch('success', 'Portfolio settings saved');
    } catch (err) {
      console.error('Failed to save portfolio settings:', err);
      error = err.message;
    } finally {
      isSaving = false;
    }
  }
  
  // Update theme
  function updateTheme(themeId: string) {
    const theme = themes.find(t => t.id === themeId);
    if (!theme || !$portfolioEditorStore.portfolio) return;
    
    const updatedSettings = {
      ...$portfolioEditorStore.portfolio.settings,
      colors: {
        primary: theme.primary,
        neutral: theme.neutral
      },
      theme: themeId
    };
    
    portfolioEditorStore.updatePortfolioSettings(updatedSettings);
  }
  
  // Update typography
  function updateTypography(fontId: string) {
    const font = fontFamilies.find(f => f.id === fontId);
    if (!font || !$portfolioEditorStore.portfolio) return;
    
    const updatedSettings = {
      ...$portfolioEditorStore.portfolio.settings,
      typography: {
        ...($portfolioEditorStore.portfolio.settings?.typography || {}),
        fontFamily: {
          heading: font.sample,
          body: font.sample
        }
      }
    };
    
    portfolioEditorStore.updatePortfolioSettings(updatedSettings);
  }
</script>

<div class="h-full flex flex-col">
  <!-- Header -->
  <div class="px-4 py-3 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
    <h3 class="font-medium text-neutral-900">Portfolio Settings</h3>
  </div>
  
  <!-- Content -->
  <div class="flex-1 overflow-y-auto">
    <div class="p-4 space-y-6">
      <!-- Basic information -->
      <div>
        <h4 class="text-sm font-medium text-neutral-900 mb-3">Basic Information</h4>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1">
              Portfolio Title
            </label>
            <Input
              bind:value={portfolioTitle}
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              class="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              rows="3"
              bind:value={portfolioDescription}
              placeholder="Briefly describe your portfolio"
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1">
              Portfolio URL
            </label>
            <div class="flex rounded-md shadow-sm">
              <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-neutral-300 bg-neutral-50 text-neutral-500 sm:text-sm">
                portfolia.com/p/
              </span>
              <input
                type="text"
                class="flex-1 rounded-none rounded-r-md border-neutral-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={portfolioSlug}
                disabled
              />
            </div>
            <p class="mt-1 text-xs text-neutral-500">Slug customization coming soon</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1">
              Visibility
            </label>
            <div class="space-y-2">
              {#each visibilityOptions as option}
                <div class="flex items-center">
                  <input
                    id={`visibility-${option.id}`}
                    name="visibility"
                    type="radio"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
                    checked={portfolioVisibility === option.id}
                    on:change={() => portfolioVisibility = option.id as any}
                  />
                  <label for={`visibility-${option.id}`} class="ml-3 flex flex-col">
                    <span class="block text-sm font-medium text-neutral-700">{option.label}</span>
                    <span class="block text-xs text-neutral-500">{option.description}</span>
                  </label>
                </div>
              {/each}
            </div>
          </div>
          
          {#if portfolioVisibility === 'password_protected'}
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                bind:value={portfolioPassword}
                placeholder="Enter a password"
              />
            </div>
          {/if}
          
          <div class="pt-5 border-t border-neutral-200">
            <Button
              variant="primary"
              on:click={savePortfolioSettings}
              loading={isSaving}
            >
              Save Settings
            </Button>
            
            {#if error}
              <p class="mt-2 text-sm text-red-600">{error}</p>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Theme settings -->
      <div>
        <h4 class="text-sm font-medium text-neutral-900 mb-3">Theme & Appearance</h4>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              Theme
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {#each themes as theme}
                <div 
                  class="border rounded-md p-3 cursor-pointer hover:border-primary-300 transition-colors {$portfolioEditorStore.portfolio?.settings?.theme === theme.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-neutral-200'}"
                  on:click={() => updateTheme(theme.id)}
                  on:keydown={e => e.key === 'Enter' && updateTheme(theme.id)}
                  tabindex="0"
                  role="button"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium">{theme.name}</span>
                    {#if $portfolioEditorStore.portfolio?.settings?.theme === theme.id}
                      <svg class="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    {/if}
                  </div>
                  <div class="flex space-x-1">
                    <div class="w-6 h-6 rounded-full" style="background-color: {theme.primary}"></div>
                    <div class="w-6 h-6 rounded-full" style="background-color: {theme.neutral}"></div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              Typography
            </label>
            <div class="space-y-2">
              {#each fontFamilies as font}
                <div 
                  class="border rounded-md p-3 cursor-pointer hover:border-primary-300 transition-colors {$portfolioEditorStore.portfolio?.settings?.typography?.fontFamily?.heading?.includes(font.id) ? 'border-primary-500 bg-primary-50' : 'border-neutral-200'}"
                  on:click={() => updateTypography(font.id)}
                  on:keydown={e => e.key === 'Enter' && updateTypography(font.id)}
                  tabindex="0"
                  role="button"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-base" style="font-family: {font.sample}">{font.name}</span>
                    {#if $portfolioEditorStore.portfolio?.settings?.typography?.fontFamily?.heading?.includes(font.id)}
                      <svg class="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- Color Customization -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              Color Customization
            </label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-neutral-500 mb-1">Primary Color</label>
                <ColorPicker
                  value={$portfolioEditorStore.portfolio?.settings?.colors?.primary || '#3B82F6'}
                  on:change={e => {
                    const updatedSettings = {
                      ...$portfolioEditorStore.portfolio?.settings,
                      colors: {
                        ...($portfolioEditorStore.portfolio?.settings?.colors || {}),
                        primary: e.detail
                      }
                    };
                    portfolioEditorStore.updatePortfolioSettings(updatedSettings);
                  }}
                />
              </div>
              <div>
                <label class="block text-xs text-neutral-500 mb-1">Text Color</label>
                <ColorPicker
                  value={$portfolioEditorStore.portfolio?.settings?.colors?.neutral || '#1F2937'}
                  on:change={e => {
                    const updatedSettings = {
                      ...$portfolioEditorStore.portfolio?.settings,
                      colors: {
                        ...($portfolioEditorStore.portfolio?.settings?.colors || {}),
                        neutral: e.detail
                      }
                    };
                    portfolioEditorStore.updatePortfolioSettings(updatedSettings);
                  }}
                />
              </div>
            </div>
          </div>
          
          <!-- Layout Settings -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              Layout Settings
            </label>
            <div class="space-y-3">
              <div>
                <label class="block text-xs text-neutral-500 mb-1">Header Style</label>
                <select class="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                  <option value="fixed">Fixed</option>
                  <option value="sticky">Sticky</option>
                  <option value="static">Static</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              
              <div>
                <label class="block text-xs text-neutral-500 mb-1">Content Width</label>
                <select class="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                  <option value="narrow">Narrow (1000px)</option>
                  <option value="standard">Standard (1200px)</option>
                  <option value="wide">Wide (1440px)</option>
                  <option value="full">Full Width</option>
                </select>
              </div>
              
              <div>
                <label class="block text-xs text-neutral-500 mb-1">Dark Mode</label>
                <ToggleEditor
                  value={$portfolioEditorStore.portfolio?.settings?.darkMode || false}
                  label="Enable dark mode option"
                  on:change={e => {
                    const updatedSettings = {
                      ...$portfolioEditorStore.portfolio?.settings,
                      darkMode: e.detail
                    };
                    portfolioEditorStore.updatePortfolioSettings(updatedSettings);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>