<script lang="ts" >
  import { onMount, createEventDispatcher } from 'svelte';
import { portfolioEditorStore, selectedComponent } from '$lib/stores/portfolioEditorStore';
import Button from '../../common/Button.svelte';
import Input from '../../common/Input.svelte';
import TextEditor from './editors/TextEditor.svelte';
import ImageEditor from './editors/ImageEditor.svelte';
import ListEditor from './editors/ListEditor.svelte';
import ColorPicker from './editors/ColorPicker.svelte';
import ToggleEditor from './editors/ToggleEditor.svelte';
import LinkEditor from './editors/LinkEditor.svelte';
import type { ComponentInstance, Component } from '$lib/types/portfolio';

export let components: Component[] = [];

// Component definition from the available components
$: componentDef = components.find(c => c.id === $selectedComponent?.componentId);

// Dispatch events
const dispatch = createEventDispatcher();

// Update component data
function updateComponentData(key: string, value: any) {
  if (!$selectedComponent) return;

  const updatedData = {
    ...$selectedComponent.data,
    [key]: value
  };

  portfolioEditorStore.updateComponent($selectedComponent.id, updatedData);
}

// Delete component
function handleDeleteComponent() {
  if (!$selectedComponent) return;

  const confirmDelete = confirm('Are you sure you want to delete this component?');
  if (confirmDelete) {
    portfolioEditorStore.removeComponent($selectedComponent.id);
  }
}

// Duplicate component
function handleDuplicateComponent() {
  if (!$selectedComponent) return;

  // This functionality will be implemented in the portfolioEditorStore
  alert('Duplicate component feature coming soon');
}
</script>

{ #if $selectedComponent && componentDef }
<div class="h-full flex flex-col" >
  <!--Header -->
    <div class="px-4 py-3 border-b border-neutral-200 flex items-center justify-between bg-neutral-50" >
      <h3 class="font-medium text-neutral-900" > { componentDef.name } Settings </h3>
        < button
class="text-neutral-500 hover:text-neutral-700"
on: click = {() => portfolioEditorStore.selectComponent(null)}
title = "Close settings"
  >
  <svg class="h-5 w-5" fill = "none" stroke = "currentColor" viewBox = "0 0 24 24" >
    <path stroke - linecap="round" stroke - linejoin="round" stroke - width="2" d = "M6 18L18 6M6 6l12 12" />
      </svg>
      </button>
      </div>

      < !--Content -->
        <div class="flex-1 overflow-y-auto p-4" >
          <div class="space-y-6" >
            { #if componentDef.schema && componentDef.schema.properties }
{ #each Object.entries(componentDef.schema.properties) as [key, schema] }
<div class="form-field" >
  <label class="block text-sm font-medium text-neutral-700 mb-1" >
    { schema.title || key }
    </label>

{ #if schema.type === 'string' }
{ #if key.toLowerCase().includes('image') || key.toLowerCase().includes('avatar') || key.toLowerCase().includes('thumbnail') || key.toLowerCase().includes('photo') }
<ImageEditor 
                    value={ $selectedComponent.data[key] || '' }
on: change = { e => updateComponentData(key, e.detail) }
  />
  {: else if key.toLowerCase().includes('content') || key.toLowerCase().includes('description') || key.toLowerCase().includes('summary') || key.toLowerCase().includes('bio') }
  < TextEditor
value = { $selectedComponent.data[key] || '' }
on: change = { e => updateComponentData(key, e.detail) }
multiline = { true}
  />
  {: else if key.toLowerCase().includes('url') || key.toLowerCase().includes('link') }
  < LinkEditor
value = { $selectedComponent.data[key] || '' }
on: change = { e => updateComponentData(key, e.detail) }
  />
  {: else if key.toLowerCase().includes('color') }
  < ColorPicker
value = { $selectedComponent.data[key] || '#000000' }
on: change = { e => updateComponentData(key, e.detail) }
  />
  {: else}
  < TextEditor
value = { $selectedComponent.data[key] || '' }
on: change = { e => updateComponentData(key, e.detail) }
  />
  {/if}
{:else if schema.type === 'number'}
<Input
                  type="number"
id = {`field-${key}`}
value = { $selectedComponent.data[key] || 0 }
on: input = { e => updateComponentData(key, parseFloat(e.target.value))}
min = { schema.minimum }
max = { schema.maximum }
step = "any"
  />
  {: else if schema.type === 'boolean' }
  < ToggleEditor
value = { $selectedComponent.data[key] || false }
on: change = { e => updateComponentData(key, e.detail) }
  />
  {: else if schema.type === 'array' }
  < ListEditor
value = { $selectedComponent.data[key] || [] }
schema = { schema }
on: change = { e => updateComponentData(key, e.detail) }
  />
  {: else if schema.type === 'object' }
  < !--For simple objects, we'll handle them as JSON for now -->
    < div class="text-xs text-neutral-500 mb-2" >
      Object editing not yet supported in UI.Use JSON format.
                </div>
        < textarea
id = {`field-${key}`}
class="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
rows = "4"
value = { JSON.stringify($selectedComponent.data[key] || {}, null, 2) }
on: input = { e => {
  try {
    const parsed = JSON.parse(e.target.value);
    updateComponentData(key, parsed);
  } catch (err) {
    // Invalid JSON, ignore for now
  }
}}
                > </textarea>
{/if }

{ #if schema.description }
<p class="mt-1 text-xs text-neutral-500" > { schema.description } </p>
{/if }
</div>
{/each }
{:else }
<p class="text-neutral-500 text-center py-4" >
  This component does not have configurable properties.
          </p>
{/if }
</div>
  </div>

  < !--Footer with actions-- >
  <div class= "px-4 py-3 border-t border-neutral-200" >
    <div class="flex justify-between" >
      <Button 
          variant="outline"
size = "sm"
class="text-red-600 hover:bg-red-50"
on: click = { handleDeleteComponent }
  >
  Delete
  </Button>
  < Button
variant = "outline"
size = "sm"
on: click = { handleDuplicateComponent }
  >
  Duplicate
  </Button>
  </div>
  </div>
  </div>
{:else }
<div class="h-full flex flex-col items-center justify-center p-6 text-center" >
  <svg class="h-12 w-12 text-neutral-300 mb-4" fill = "none" stroke = "currentColor" viewBox = "0 0 24 24" >
    <path stroke - linecap="round" stroke - linejoin="round" stroke - width="2" d = "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      < h3 class="text-lg font-medium text-neutral-900" > No component selected </h3>
        < p class="mt-1 text-neutral-500" >
          Select a component from the editor to modify its properties.
    </p>
            </div>
{/if }