<script lang="ts">
  import { portfolioEditorStore } from '$lib/stores/portfolioEditorStore';
  
  export let data: any = {};
  export let isEditing: boolean = false;
  
  // Provide default values for new components
  $: {
    if (isEditing) {
      data = {
        title: data.title || 'Hi, I'm Sarah. I build amazing digital experiences.',
        subtitle: data.subtitle || 'I'm a product designer based in New York, specializing in UI/UX design, brand strategy, and visual design.',
        primaryButtonText: data.primaryButtonText || 'View My Work',
        primaryButtonUrl: data.primaryButtonUrl || '#projects',
        secondaryButtonText: data.secondaryButtonText || 'Contact Me',
        secondaryButtonUrl: data.secondaryButtonUrl || '#contact',
        backgroundImageUrl: data.backgroundImageUrl || '',
        imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        imagePosition: data.imagePosition || 'right',
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

<section
  class="py-16 {data.backgroundImageUrl
    ? 'bg-cover bg-center'
    : 'bg-neutral-50'}"
  style={data.backgroundImageUrl
    ? `background-image: url(${data.backgroundImageUrl});`
    : ""}
>
  <div class="container mx-auto px-4">
    <div class="flex flex-col md:flex-row items-center">
      <div
        class={`md:w-1/2 ${data.imagePosition === "left" ? "order-first md:pr-12" : "order-last md:pl-12"}`}
      >
        <h1 class="text-4xl font-bold text-neutral-900 mb-6">
          {data.title}
        </h1>
        <p class="text-xl text-neutral-600 mb-8">
          {data.subtitle}
        </p>

        <div class="flex flex-wrap gap-4">
          {#if data.primaryButtonText}
            <a
              href={data.primaryButtonUrl}
              class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              {data.primaryButtonText}
            </a>
          {/if}

          {#if data.secondaryButtonText}
            <a
              href={data.secondaryButtonUrl}
              class="inline-flex items-center px-6 py-3 border border-neutral-300 text-base font-medium rounded-md shadow-sm text-neutral-700 bg-white hover:bg-neutral-50"
            >
              {data.secondaryButtonText}
            </a>
          {/if}
        </div>
      </div>

      <div
        class={`md:w-1/2 mt-10 md:mt-0 ${data.imagePosition === "left" ? "order-last" : "order-first"}`}
      >
        {#if data.imageUrl}
          <img
            src={data.imageUrl}
            alt="Hero"
            class="rounded-lg shadow-lg object-cover object-center w-full h-auto max-h-96"
          />
        {:else}
          <div
            class="rounded-lg bg-neutral-200 w-full h-64 flex items-center justify-center"
          >
            <span class="text-neutral-400">Image placeholder</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

{#if isEditing}
  <div class="bg-neutral-50 p-4 border-t border-neutral-200">
    <div class="text-sm text-neutral-500">
      Click to edit hero content, image, and call-to-action buttons.
    </div>
  </div>
{/if}
