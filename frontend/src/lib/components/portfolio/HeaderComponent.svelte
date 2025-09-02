<script lang="ts">
  import { portfolioEditorStore } from "$lib/stores/portfolioEditorStore";

  export let data: any = {};
  export let isEditing: boolean = false;

  // Provide default values for new components
  $: {
    if (isEditing) {
      data = {
        title: data.title || "Your Name",
        navigation: data.navigation || [
          { label: "Home", url: "#home" },
          { label: "About", url: "#about" },
          { label: "Projects", url: "#projects" },
          { label: "Contact", url: "#contact" },
        ],
        ctaText: data.ctaText || "Contact Me",
        ctaUrl: data.ctaUrl || "#contact",
        logoUrl: data.logoUrl || "",
        transparent: data.transparent ?? false,
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

<header class="bg-white shadow-sm">
  <div class="container mx-auto px-4 py-4 flex items-center justify-between">
    <div>
      {#if data.logoUrl}
        <img src={data.logoUrl} alt="Logo" class="h-8" />
      {:else}
        <h1 class="text-xl font-bold text-neutral-900">{data.title}</h1>
      {/if}
    </div>

    <nav>
      <ul class="hidden md:flex space-x-6">
        {#each data.navigation || [] as item}
          <li>
            <a
              href={item.url}
              class="text-neutral-600 hover:text-primary-600 text-sm font-medium"
            >
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>

    {#if data.ctaText}
      <div>
        <a
          href={data.ctaUrl}
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          {data.ctaText}
        </a>
      </div>
    {/if}

    <button class="md:hidden text-neutral-600">
      <svg
        class="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  </div>
</header>

{#if isEditing}
  <div class="bg-neutral-50 p-4 border-t border-neutral-200">
    <div class="text-sm text-neutral-500">
      Click to edit header content and navigation. Drag to reposition.
    </div>
  </div>
{/if}
