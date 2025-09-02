<script lang="ts">
  import { goto } from '$app/navigation';
  import { portfolioEditorStore } from '$lib/stores/portfolioEditorStore';
  import { updatePortfolio } from '$lib/services/portfolioService';
  import Button from '../common/Button.svelte';

  // Publishing state
  let isPublishing = false;
  let publishError: string | null = null;
  
  // Preview mode options
  const previewModes = [
    { id: 'desktop', icon: 'desktop', label: 'Desktop' },
    { id: 'tablet', icon: 'tablet', label: 'Tablet' },
    { id: 'mobile', icon: 'mobile', label: 'Mobile' }
  ];
  
  // Handle publishing portfolio
  async function handlePublish() {
    if (!$portfolioEditorStore.portfolio) return;
    
    isPublishing = true;
    publishError = null;
    
    try {
      await updatePortfolio({
        id: $portfolioEditorStore.portfolio.id,
        status: 'published',
        // If it's the first publish, also set visibility to public
        ...(
          $portfolioEditorStore.portfolio.status !== 'published' ? 
          { visibility: 'public' } : {}
        ),
      });
      
      // Update local state
      portfolioEditorStore.update(state => ({
        ...state,
        portfolio: state.portfolio ? {
          ...state.portfolio,
          status: 'published'
        } : null
      }));
      
      // Show success message
      alert('Portfolio published successfully!');
    } catch (err) {
      publishError = err.message;
    } finally {
      isPublishing = false;
    }
  }
  
  // Handle preview mode change
  function setPreviewMode(mode: 'desktop' | 'tablet' | 'mobile') {
    portfolioEditorStore.setPreviewMode(mode);
  }
  
  // Handle zoom change
  function setZoom(zoom: number) {
    portfolioEditorStore.setPreviewZoom(zoom);
  }
  
  // Exit editor
  function exitEditor() {
    if ($portfolioEditorStore.hasChanges) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    
    goto('/portfolios');
  }
</script>

<div class="h-16 border-b border-neutral-200 bg-white flex items-center px-4 justify-between shadow-sm">
  <!-- Left section: Portfolio title & status -->
  <div class="flex items-center">
    {#if $portfolioEditorStore.portfolio}
      <h1 class="font-medium text-neutral-900 mr-2 truncate max-w-xs">
        {$portfolioEditorStore.portfolio.title || 'Untitled Portfolio'}
      </h1>
      
      <!-- Status badge -->
      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {
        $portfolioEditorStore.portfolio.status === 'published' ? 'bg-green-100 text-green-800' :
        $portfolioEditorStore.portfolio.status === 'draft' ? 'bg-amber-100 text-amber-800' :
        'bg-neutral-100 text-neutral-800'
      }">
        {$portfolioEditorStore.portfolio.status === 'published' ? 'Published' :
         $portfolioEditorStore.portfolio.status === 'draft' ? 'Draft' : 'Archived'}
      </span>
    {/if}
  </div>
  
  <!-- Middle section: Preview controls -->
  <div class="flex items-center space-x-4">
    <!-- Device preview toggles -->
    <div class="bg-neutral-100 p-0.5 rounded-md flex">
      {#each previewModes as mode}
        <button
          class="p-1.5 rounded {$portfolioEditorStore.previewMode === mode.id ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}"
          on:click={() => setPreviewMode(mode.id as any)}
          title={mode.label}
        >
          {#if mode.id === 'desktop'}
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          {:else if mode.id === 'tablet'}
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          {:else if mode.id === 'mobile'}
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          {/if}
        </button>
      {/each}
    </div>
    
    <!-- Zoom controls -->
    <div class="flex items-center space-x-2">
      <button 
        class="p-1 text-neutral-500 hover:text-neutral-900 rounded-md hover:bg-neutral-100"
        on:click={() => setZoom($portfolioEditorStore.previewZoom - 0.1)}
        disabled={$portfolioEditorStore.previewZoom <= 0.5}
        title="Zoom out"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>
      
      <span class="text-sm text-neutral-700">{Math.round($portfolioEditorStore.previewZoom * 100)}%</span>
      
      <button 
        class="p-1 text-neutral-500 hover:text-neutral-900 rounded-md hover:bg-neutral-100"
        on:click={() => setZoom($portfolioEditorStore.previewZoom + 0.1)}
        disabled={$portfolioEditorStore.previewZoom >= 1.5}
        title="Zoom in"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12M6 12h12" />
        </svg>
      </button>
    </div>
  </div>
  
  <!-- Right section: Actions -->
  <div class="flex items-center space-x-3">
    <!-- Undo/Redo -->
    <div class="flex">
      <button 
        class="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-md hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        on:click={() => portfolioEditorStore.undo()}
        disabled={!$portfolioEditorStore.undoable}
        title="Undo"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <button 
        class="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-md hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        on:click={() => portfolioEditorStore.redo()}
        disabled={!$portfolioEditorStore.redoable}
        title="Redo"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
    
    <!-- Preview button -->
    <Button variant="outline" on:click={() => goto(`/p/${$portfolioEditorStore.portfolio?.slug}`)}>
      <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      Preview
    </Button>
    
    <!-- Publish button -->
    <Button 
      variant="primary"
      on:click={handlePublish}
      loading={isPublishing}
    >
      <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      {$portfolioEditorStore.portfolio?.status === 'published' ? 'Update' : 'Publish'}
    </Button>
    
    <!-- Exit button -->
    <button 
      class="p-2 text-neutral-500 hover:text-neutral-900 rounded-md hover:bg-neutral-100"
      on:click={exitEditor}
      title="Exit editor"
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</div>