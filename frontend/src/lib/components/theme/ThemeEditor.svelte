<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import { themeStore } from "$lib/stores/themeStore";
  import type { Theme, ColorPalette } from "$lib/types/themes";
  import {
    hexToHSL,
    hslToHex,
    generateColorPalette,
    createSemanticColors,
  } from "$lib/utils/themeUtils";
  import Button from "$lib/components/common/Button.svelte";
  import TextField from "$lib/components/common/TextField.svelte";
  import TextAreaField from "$lib/components/common/TextAreaField.svelte";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import ColorPicker from "$lib/components/theme/ColorPicker.svelte";
  import FontSelector from "$lib/components/theme/FontSelector.svelte";
  import BorderRadiusSelector from "$lib/components/theme/BorderRadiusSelector.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";

  export let theme: Theme | null = null;
  export let mode: "light" | "dark" = "light";

  const dispatch = createEventDispatcher();

  let editingTheme: Theme | null = null;
  let activeTab = "colors";
  let themeName = "";
  let themeDescription = "";
  let error = "";
  let saved = false;

  // Initialize editing theme based on props or create a new one
  $: {
    if (theme) {
      initFromTheme(theme);
    } else {
      initNewTheme();
    }
  }

  function initFromTheme(theme: Theme) {
    editingTheme = JSON.parse(JSON.stringify(theme));
    themeName = theme.name;
    themeDescription = theme.description || "";
  }

  function initNewTheme() {
    // Start with appropriate default theme based on mode
    const baseTheme =
      mode === "light"
        ? $themeStore.themes["luminous"]
        : $themeStore.themes["cosmic"];

    if (baseTheme) {
      editingTheme = JSON.parse(JSON.stringify(baseTheme));
      editingTheme.id = `theme-${Date.now()}`;
      editingTheme.name = `Custom ${mode === "light" ? "Light" : "Dark"} Theme`;
      editingTheme.description = "My custom theme";
      editingTheme.isBuiltIn = false;
      editingTheme.mode = mode;
      editingTheme.createdAt = new Date().toISOString();
      editingTheme.updatedAt = new Date().toISOString();

      themeName = editingTheme.name;
      themeDescription = editingTheme.description;
    }
  }

  function updateColor(colorType: string, shade: string, value: string) {
    if (!editingTheme) return;

    // Update the specific color in the palette
    editingTheme.settings.colors[colorType][shade] = value;

    // If updating the base color (500), regenerate the palette
    if (shade === "500") {
      const newPalette = generateColorPalette(value);
      editingTheme.settings.colors[colorType] = {
        ...editingTheme.settings.colors[colorType],
        ...newPalette,
      };
    }

    // Update semantic colors
    editingTheme.settings.semantic = createSemanticColors(
      editingTheme.settings.colors,
      editingTheme.mode,
    );

    // Apply changes for preview
    if (editingTheme) {
      themeStore.updateEditingTheme(editingTheme.settings);
    }
  }

  function updateFontFamily(fontType: string, value: string) {
    if (!editingTheme) return;

    editingTheme.settings.typography.fontFamily[fontType] = value;

    // Apply changes for preview
    themeStore.updateEditingTheme({
      typography: {
        ...editingTheme.settings.typography,
      },
    });
  }

  function updateBorderRadius(sizeKey: string, value: string) {
    if (!editingTheme) return;

    editingTheme.settings.borderStyles.radius[sizeKey] = value;

    // Apply changes for preview
    themeStore.updateEditingTheme({
      borderStyles: {
        ...editingTheme.settings.borderStyles,
      },
    });
  }

  function saveTheme() {
    if (!editingTheme) return;

    if (!themeName.trim()) {
      error = "Theme name is required";
      return;
    }

    try {
      // Update name and description
      editingTheme.name = themeName;
      editingTheme.description = themeDescription;
      editingTheme.updatedAt = new Date().toISOString();

      if (theme) {
        // Updating existing theme
        themeStore.updateTheme(editingTheme.id, editingTheme.settings);
      } else {
        // Creating new theme
        themeStore.createTheme(editingTheme);
      }

      saved = true;
      setTimeout(() => {
        saved = false;
      }, 3000);

      dispatch("save", { themeId: editingTheme.id });
    } catch (err) {
      error = err.message || "Failed to save theme";
    }
  }

  function cancelEdit() {
    dispatch("cancel");
  }
</script>

<div
  class="theme-editor bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700"
>
  <div
    class="border-b border-neutral-200 dark:border-neutral-700 p-4 flex justify-between items-center"
  >
    <div>
      <h2 class="text-xl font-medium text-neutral-900 dark:text-white">
        {theme ? "Edit Theme" : "Create New Theme"}
      </h2>
      <p class="text-neutral-500 dark:text-neutral-400 text-sm">
        {theme
          ? "Customize this theme"
          : "Create a custom theme for your portfolio"}
      </p>
    </div>

    <div class="space-x-2">
      <Button variant="neutral" on:click={cancelEdit}>Cancel</Button>
      <Button variant="primary" on:click={saveTheme}>
        {theme ? "Update Theme" : "Save Theme"}
      </Button>
    </div>
  </div>

  {#if error}
    <div class="px-4 pt-4">
      <AlertBox type="error" dismissible bind:visible={error}>
        {error}
      </AlertBox>
    </div>
  {/if}

  {#if saved}
    <div class="px-4 pt-4" transition:fade={{ duration: 200 }}>
      <AlertBox type="success" dismissible bind:visible={saved}>
        Theme {theme ? "updated" : "created"} successfully!
      </AlertBox>
    </div>
  {/if}

  <div class="p-4 border-b border-neutral-200 dark:border-neutral-700">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextField
        label="Theme Name"
        bind:value={themeName}
        placeholder="Enter a name for your theme"
        required
      />

      <TextAreaField
        label="Description"
        bind:value={themeDescription}
        placeholder="Describe your theme (optional)"
        rows={1}
      />
    </div>
  </div>

  <Tabs
    tabs={[
      { id: "colors", label: "Colors" },
      { id: "typography", label: "Typography" },
      { id: "borders", label: "Borders & Radius" },
      { id: "spacing", label: "Spacing" },
      { id: "effects", label: "Effects" },
    ]}
    bind:activeTab
  />

  <div class="p-4">
    {#if activeTab === "colors"}
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-medium mb-4">Primary Colors</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {#if editingTheme}
              <ColorPicker
                label="Primary"
                value={editingTheme.settings.colors.primary[500]}
                on:change={(e) => updateColor("primary", "500", e.detail)}
              />

              <ColorPicker
                label="Secondary"
                value={editingTheme.settings.colors.secondary[500]}
                on:change={(e) => updateColor("secondary", "500", e.detail)}
              />

              <ColorPicker
                label="Accent"
                value={editingTheme.settings.colors.accent[500]}
                on:change={(e) => updateColor("accent", "500", e.detail)}
              />

              <ColorPicker
                label="Neutral"
                value={editingTheme.settings.colors.neutral[500]}
                on:change={(e) => updateColor("neutral", "500", e.detail)}
              />
            {/if}
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-4">State Colors</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {#if editingTheme}
              <ColorPicker
                label="Success"
                value={editingTheme.settings.colors.success[500]}
                on:change={(e) => updateColor("success", "500", e.detail)}
              />

              <ColorPicker
                label="Warning"
                value={editingTheme.settings.colors.warning[500]}
                on:change={(e) => updateColor("warning", "500", e.detail)}
              />

              <ColorPicker
                label="Danger"
                value={editingTheme.settings.colors.danger[500]}
                on:change={(e) => updateColor("danger", "500", e.detail)}
              />

              <ColorPicker
                label="Info"
                value={editingTheme.settings.colors.info[500]}
                on:change={(e) => updateColor("info", "500", e.detail)}
              />
            {/if}
          </div>
        </div>

        <div>
          <h3 class="text-lg font-medium mb-4">Background & Text</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {#if editingTheme}
              <ColorPicker
                label="Background"
                value={editingTheme.settings.semantic.background.primary}
                on:change={(e) => {
                  if (!editingTheme) return;
                  editingTheme.settings.semantic.background.primary = e.detail;
                  themeStore.updateEditingTheme({
                    semantic: {
                      ...editingTheme.settings.semantic,
                    },
                  });
                }}
              />

              <ColorPicker
                label="Background Secondary"
                value={editingTheme.settings.semantic.background.secondary}
                on:change={(e) => {
                  if (!editingTheme) return;
                  editingTheme.settings.semantic.background.secondary =
                    e.detail;
                  themeStore.updateEditingTheme({
                    semantic: {
                      ...editingTheme.settings.semantic,
                    },
                  });
                }}
              />

              <ColorPicker
                label="Text Primary"
                value={editingTheme.settings.semantic.text.primary}
                on:change={(e) => {
                  if (!editingTheme) return;
                  editingTheme.settings.semantic.text.primary = e.detail;
                  themeStore.updateEditingTheme({
                    semantic: {
                      ...editingTheme.settings.semantic,
                    },
                  });
                }}
              />

              <ColorPicker
                label="Text Secondary"
                value={editingTheme.settings.semantic.text.secondary}
                on:change={(e) => {
                  if (!editingTheme) return;
                  editingTheme.settings.semantic.text.secondary = e.detail;
                  themeStore.updateEditingTheme({
                    semantic: {
                      ...editingTheme.settings.semantic,
                    },
                  });
                }}
              />

              <ColorPicker
                label="Border"
                value={editingTheme.settings.semantic.border.normal}
                on:change={(e) => {
                  if (!editingTheme) return;
                  editingTheme.settings.semantic.border.normal = e.detail;
                  themeStore.updateEditingTheme({
                    semantic: {
                      ...editingTheme.settings.semantic,
                    },
                  });
                }}
              />
            {/if}
          </div>
        </div>
      </div>
    {:else if activeTab === "typography"}
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-medium mb-4">Font Families</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#if editingTheme}
              <FontSelector
                label="Sans Font"
                value={editingTheme.settings.typography.fontFamily.sans}
                on:change={(e) => updateFontFamily("sans", e.detail)}
              />

              <FontSelector
                label="Serif Font"
                value={editingTheme.settings.typography.fontFamily.serif}
                on:change={(e) => updateFontFamily("serif", e.detail)}
              />

              <FontSelector
                label="Display Font"
                value={editingTheme.settings.typography.fontFamily.display}
                on:change={(e) => updateFontFamily("display", e.detail)}
              />

              <FontSelector
                label="Mono Font"
                value={editingTheme.settings.typography.fontFamily.mono}
                on:change={(e) => updateFontFamily("mono", e.detail)}
              />
            {/if}
          </div>
        </div>
      </div>
    {:else if activeTab === "borders"}
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-medium mb-4">Border Radius</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#if editingTheme}
              <BorderRadiusSelector
                label="Small Radius"
                value={editingTheme.settings.borderStyles.radius.sm}
                on:change={(e) => updateBorderRadius("sm", e.detail)}
              />

              <BorderRadiusSelector
                label="Default Radius"
                value={editingTheme.settings.borderStyles.radius.DEFAULT}
                on:change={(e) => updateBorderRadius("DEFAULT", e.detail)}
              />

              <BorderRadiusSelector
                label="Medium Radius"
                value={editingTheme.settings.borderStyles.radius.md}
                on:change={(e) => updateBorderRadius("md", e.detail)}
              />

              <BorderRadiusSelector
                label="Large Radius"
                value={editingTheme.settings.borderStyles.radius.lg}
                on:change={(e) => updateBorderRadius("lg", e.detail)}
              />

              <BorderRadiusSelector
                label="Extra Large Radius"
                value={editingTheme.settings.borderStyles.radius.xl}
                on:change={(e) => updateBorderRadius("xl", e.detail)}
              />

              <BorderRadiusSelector
                label="2XL Radius"
                value={editingTheme.settings.borderStyles.radius["2xl"]}
                on:change={(e) => updateBorderRadius("2xl", e.detail)}
              />
            {/if}
          </div>
        </div>
      </div>
    {:else if activeTab === "spacing"}
      <div
        class="p-4 flex justify-center items-center text-neutral-500 dark:text-neutral-400"
      >
        <p>Spacing settings coming soon</p>
      </div>
    {:else if activeTab === "effects"}
      <div
        class="p-4 flex justify-center items-center text-neutral-500 dark:text-neutral-400"
      >
        <p>Effects settings coming soon</p>
      </div>
    {/if}
  </div>
</div>
