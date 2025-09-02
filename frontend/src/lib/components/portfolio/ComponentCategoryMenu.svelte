<script lang="ts">
  import type { ComponentCategory } from '$lib/types/portfolio';
  
  export let activeCategory: ComponentCategory | 'all';
  export let onSelectCategory: (category: ComponentCategory | 'all') => void;
  
  // Category definitions
  const categories = [
    { id: 'all', label: 'All Components', icon: 'grid' },
    { id: 'header', label: 'Headers', icon: 'menu' },
    { id: 'hero', label: 'Hero Sections', icon: 'image' },
    { id: 'about', label: 'About', icon: 'user' },
    { id: 'projects', label: 'Projects', icon: 'briefcase' },
    { id: 'skills', label: 'Skills', icon: 'chip' },
    { id: 'experience', label: 'Experience', icon: 'academic-cap' },
    { id: 'education', label: 'Education', icon: 'book-open' },
    { id: 'testimonials', label: 'Testimonials', icon: 'chat-bubble-left' },
    { id: 'contact', label: 'Contact', icon: 'envelope' },
    { id: 'gallery', label: 'Gallery', icon: 'photo' },
    { id: 'footer', label: 'Footers', icon: 'link' },
    { id: 'custom', label: 'Custom', icon: 'sparkles' },
  ];
</script>

<div class="overflow-x-auto whitespace-nowrap py-2 px-4 border-b border-neutral-200 scrollbar-hidden">
  <div class="flex space-x-2">
    {#each categories as category}
      <button
        class="px-3 py-1.5 text-xs rounded-full transition-colors {
          activeCategory === category.id ? 
          'bg-primary-100 text-primary-700 font-medium' : 
          'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }"
        on:click={() => onSelectCategory(category.id as any)}
      >
        {category.label}
      </button>
    {/each}
  </div>
</div>

<style>
  .scrollbar-hidden {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }
  .scrollbar-hidden::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }
</style>