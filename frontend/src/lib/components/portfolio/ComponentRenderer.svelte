<script lang="ts">
  import { portfolioEditorStore } from "$lib/stores/portfolioEditorStore";
  import type { ComponentInstance, Component } from "$lib/types/portfolio";
  import HeaderComponent from "./components/HeaderComponent.svelte";
  import HeroComponent from "./components/HeroComponent.svelte";
  import AboutComponent from "./components/AboutComponent.svelte";
  import ProjectsComponent from "./components/ProjectsComponent.svelte";
  import SkillsComponent from "./components/SkillsComponent.svelte";
  import ContactComponent from "./components/ContactComponent.svelte";
  import GenericComponent from "./components/GenericComponent.svelte";

  export let component: ComponentInstance;
  export let componentDefinitions: Component[] = [];
  export let isSelected: boolean = false;
  export let isEditing: boolean = false;

  // Find component definition from the list of available components
  $: componentDef = componentDefinitions.find(
    (def) => def.id === component.componentId,
  );

  // Delete component handler
  function handleDelete() {
    portfolioEditorStore.removeComponent(component.id);
  }

  // Select component handler
  function handleSelect() {
    if (!isEditing) return;
    portfolioEditorStore.selectComponent(component.id);
  }
</script>

<!-- Component wrapper with editor controls -->
<div
  class="relative {isEditing ? 'component-editable' : ''} {isSelected
    ? 'component-selected'
    : ''}"
  on:click|stopPropagation={handleSelect}
>
  {#if isEditing}
    <div
      class="absolute -top-4 right-2 z-10 flex bg-white rounded-md shadow-sm border border-neutral-200"
    >
      <!-- Component type label -->
      <div
        class="px-2 py-1 text-xs text-neutral-500 border-r border-neutral-200"
      >
        {componentDef?.name || component.type}
      </div>

      <!-- Delete button -->
      <button
        class="p-1 text-neutral-400 hover:text-red-600"
        on:click|stopPropagation={handleDelete}
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  {/if}

  <!-- Render the appropriate component based on type -->
  <div class="component-content">
    {#if component.type === "header"}
      <HeaderComponent data={component.data} {isEditing} />
    {:else if component.type === "hero"}
      <HeroComponent data={component.data} {isEditing} />
    {:else if component.type === "about"}
      <AboutComponent data={component.data} {isEditing} />
    {:else if component.type === "projects"}
      <ProjectsComponent data={component.data} {isEditing} />
    {:else if component.type === "skills"}
      <SkillsComponent data={component.data} {isEditing} />
    {:else if component.type === "contact"}
      <ContactComponent data={component.data} {isEditing} />
    {:else}
      <GenericComponent
        type={component.type}
        data={component.data}
        {isEditing}
      />
    {/if}
  </div>
</div>

<style>
  .component-editable {
    outline: 1px dashed transparent;
    transition: outline-color 0.2s ease-in-out;
  }

  .component-editable:hover {
    outline-color: rgba(59, 130, 246, 0.5); /* Blue-500 with opacity */
  }

  .component-selected {
    outline: 2px solid #3b82f6; /* Blue-500 */
  }

  .component-content {
    width: 100%;
  }
</style>
