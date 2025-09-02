<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Button from "../../../common/Button.svelte";
  import { dndzone } from "svelte-dnd-action";

  export let value: any[] = [];
  export let schema: any = {};

  const dispatch = createEventDispatcher();
  const itemType = schema.items?.type || "string";
  const allowedTypes = ["string", "object"];

  // Create a copy of the array to avoid directly modifying props
  let items = [...value];

  // Add new item
  function addItem() {
    if (itemType === "string") {
      items = [...items, ""];
    } else if (itemType === "object") {
      // Create a default object based on the schema properties
      const newItem: Record<string, any> = {};

      if (schema.items?.properties) {
        Object.keys(schema.items.properties).forEach((key) => {
          const propSchema = schema.items.properties[key];
          if (propSchema.type === "string") {
            newItem[key] = "";
          } else if (propSchema.type === "number") {
            newItem[key] = 0;
          } else if (propSchema.type === "boolean") {
            newItem[key] = false;
          } else if (propSchema.type === "array") {
            newItem[key] = [];
          } else if (propSchema.type === "object") {
            newItem[key] = {};
          }
        });
      }

      items = [...items, newItem];
    }

    dispatch("change", items);
  }

  // Remove an item
  function removeItem(index: number) {
    items = items.filter((_, i) => i !== index);
    dispatch("change", items);
  }

  // Update a string item
  function updateStringItem(index: number, value: string) {
    items[index] = value;
    dispatch("change", [...items]);
  }

  // Update an object item's property
  function updateObjectItemProp(index: number, prop: string, value: any) {
    items[index] = { ...items[index], [prop]: value };
    dispatch("change", [...items]);
  }

  // Handle DnD reordering
  function handleDndConsider(e: CustomEvent) {
    items = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent) {
    items = e.detail.items;
    dispatch("change", items);
  }
</script>

{#if allowedTypes.includes(itemType)}
  <div class="space-y-3">
    <!-- Items list -->
    <div
      use:dndzone={{ items, type: "list-editor" }}
      on:consider={handleDndConsider}
      on:finalize={handleDndFinalize}
    >
      {#if items.length === 0}
        <div
          class="text-sm text-neutral-500 text-center py-4 border border-dashed border-neutral-300 rounded-md"
        >
          No items. Click "Add Item" to create one.
        </div>
      {:else}
        {#each items as item, index (index)}
          <div
            class="bg-white border border-neutral-200 rounded-md p-3 mb-2 relative hover:border-neutral-300 transition-colors cursor-move"
            animate:flip={{ duration: 200 }}
          >
            <!-- Remove button -->
            <button
              class="absolute top-2 right-2 text-neutral-400 hover:text-red-500"
              on:click|stopPropagation={() => removeItem(index)}
              title="Remove item"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <!-- String item -->
            {#if itemType === "string"}
              <input
                type="text"
                class="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={item}
                on:input={(e) => updateStringItem(index, e.target.value)}
                placeholder="Enter value"
              />
              <!-- Object item -->
            {:else if itemType === "object" && schema.items?.properties}
              <div class="pt-3">
                <div class="grid grid-cols-1 gap-3">
                  {#each Object.entries(schema.items.properties) as [key, propSchema]}
                    <div>
                      <label
                        class="block text-xs font-medium text-neutral-700 mb-1"
                      >
                        {propSchema.title || key}
                      </label>

                      {#if propSchema.type === "string"}
                        <input
                          type="text"
                          class="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          value={item[key] || ""}
                          on:input={(e) =>
                            updateObjectItemProp(index, key, e.target.value)}
                          placeholder={`Enter ${propSchema.title || key}`}
                        />
                      {:else if propSchema.type === "number"}
                        <input
                          type="number"
                          class="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          value={item[key] || 0}
                          on:input={(e) =>
                            updateObjectItemProp(
                              index,
                              key,
                              parseFloat(e.target.value),
                            )}
                        />
                      {:else if propSchema.type === "boolean"}
                        <div class="flex items-center">
                          <input
                            type="checkbox"
                            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                            checked={item[key] || false}
                            on:change={(e) =>
                              updateObjectItemProp(
                                index,
                                key,
                                e.target.checked,
                              )}
                          />
                          <span class="ml-2 text-xs text-neutral-600"
                            >Enabled</span
                          >
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>

    <!-- Add button -->
    <Button variant="outline" size="sm" on:click={addItem} class="w-full">
      <svg
        class="h-4 w-4 mr-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
      Add Item
    </Button>
  </div>
{:else}
  <div class="text-sm text-neutral-500 bg-neutral-50 p-4 rounded-md">
    Editing for this type is not supported yet.
  </div>
{/if}
