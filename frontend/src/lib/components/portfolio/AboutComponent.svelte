<script lang="ts">
  import { portfolioEditorStore } from '$lib/stores/portfolioEditorStore';
  
  export let data: any = {};
  export let isEditing: boolean = false;
  
  // Provide default values for new components
  $: {
    if (isEditing) {
      data = {
        title: data.title || 'About Me',
        subtitle: data.subtitle || 'Get to know more about my background and expertise.',
        content: data.content || 'I'm a passionate designer with over 5 years of experience creating user-centered digital experiences. My approach combines strategic thinking with creative problem-solving to build products that people love to use.',
        imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=634&q=80',
        stats: data.stats || [
          { value: '5+', label: 'Years Experience' },
          { value: '20+', label: 'Projects Completed' },
          { value: '15+', label: 'Happy Clients' }
        ],
        ...data
      };
    }
  }
  
  // Update component data when values change
  function updateData(updates: any) {
    if (!isEditing) return;
    
    const updatedData = { ...data, ...updates };
    portfolioEditorStore.updateComponent(data.id, updatedData);
  }
</script>

<section class="py-16 bg-white">
  <div class="container mx-auto px-4">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-neutral-900 mb-4">{data.title}</h2>
      <p class="text-xl text-neutral-600 max-w-3xl mx-auto">{data.subtitle}</p>
    </div>

    <div class="flex flex-col lg:flex-row items-center gap-12">
      <div class="lg:w-2/5">
        {#if data.imageUrl}
          <img
            src={data.imageUrl}
            alt="About me"
            class="rounded-lg shadow-lg object-cover w-full max-h-96"
          />
        {:else}
          <div
            class="rounded-lg bg-neutral-200 w-full h-72 flex items-center justify-center"
          >
            <span class="text-neutral-400">Image placeholder</span>
          </div>
        {/if}
      </div>

      <div class="lg:w-3/5">
        <div class="prose prose-lg">
          <p>{data.content}</p>
        </div>

        {#if data.stats && data.stats.length > 0}
          <div class="mt-12 grid grid-cols-2 md:grid-cols-3 gap-8">
            {#each data.stats as stat}
              <div class="text-center">
                <div class="text-4xl font-bold text-primary-600">
                  {stat.value}
                </div>
                <div class="text-neutral-600 mt-1">{stat.label}</div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

{#if isEditing}
  <div class="bg-neutral-50 p-4 border-t border-neutral-200">
    <div class="text-sm text-neutral-500">
      Click to edit about section content and statistics.
    </div>
  </div>
{/if}
