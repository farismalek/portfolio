<script lang="ts">
  import { portfolioEditorStore } from "$lib/stores/portfolioEditorStore";

  export let data: any = {};
  export let isEditing: boolean = false;

  // Provide default values for new components
  $: {
    if (isEditing) {
      data = {
        title: data.title || "My Projects",
        subtitle: data.subtitle || "Check out some of my recent work",
        projects: data.projects || [
          {
            title: "Mobile App Design",
            description: "UI/UX design for a fitness tracking application",
            imageUrl:
              "https://images.unsplash.com/photo-1586880244406-556ebe35f282?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
            tags: ["UI/UX", "Mobile", "Fitness"],
          },
          {
            title: "E-commerce Website",
            description: "Complete redesign of an online fashion store",
            imageUrl:
              "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
            tags: ["Web Design", "E-commerce", "Fashion"],
          },
          {
            title: "Brand Identity",
            description: "Logo and brand identity for a tech startup",
            imageUrl:
              "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
            tags: ["Branding", "Logo Design", "Identity"],
          },
        ],
        layout: data.layout || "grid", // 'grid' or 'masonry'
        ...data,
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

    <!-- Grid layout -->
    {#if data.layout === "grid" || !data.layout}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each data.projects || [] as project}
          <div
            class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            {#if project.imageUrl}
              <div class="h-48 overflow-hidden">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            {:else}
              <div class="h-48 bg-neutral-100 flex items-center justify-center">
                <svg
                  class="h-12 w-12 text-neutral-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            {/if}

            <div class="p-6">
              <h3 class="text-lg font-semibold text-neutral-900 mb-2">
                {project.title}
              </h3>
              <p class="text-neutral-600 mb-4">{project.description}</p>

              {#if project.tags && project.tags.length > 0}
                <div class="flex flex-wrap gap-2">
                  {#each project.tags as tag}
                    <span
                      class="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded"
                    >
                      {tag}
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <!-- Masonry layout -->
    {:else if data.layout === "masonry"}
      <div class="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {#each data.projects || [] as project}
          <div
            class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 break-inside-avoid"
          >
            {#if project.imageUrl}
              <img
                src={project.imageUrl}
                alt={project.title}
                class="w-full h-auto object-cover"
              />
            {:else}
              <div class="h-48 bg-neutral-100 flex items-center justify-center">
                <svg
                  class="h-12 w-12 text-neutral-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            {/if}

            <div class="p-4">
              <h3 class="text-lg font-semibold text-neutral-900 mb-2">
                {project.title}
              </h3>
              {#if project.year}
                <p class="text-neutral-500 text-sm mb-1">{project.year}</p>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

{#if isEditing}
  <div class="bg-neutral-50 p-4 border-t border-neutral-200">
    <div class="text-sm text-neutral-500">
      Click to edit project content and layout options. Add or remove projects
      as needed.
    </div>
  </div>
{/if}
