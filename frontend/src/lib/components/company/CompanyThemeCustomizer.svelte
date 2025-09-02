<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { themeStore } from "$lib/stores/themeStore";
  import {
    generateColorPalette,
    createSemanticColors,
  } from "$lib/utils/themeUtils";
  import Button from "$lib/components/common/Button.svelte";
  import ColorPicker from "$lib/components/theme/ColorPicker.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Switch from "$lib/components/common/Switch.svelte";
  import AlertBox from "$lib/components/common/AlertBox.svelte";

  export let company = null;
  export let brandColors = {
    primary: "#0ea5e9", // Default blue
    secondary: "#8b5cf6", // Default purple
    accent: "#f59e0b", // Default amber
  };
  export let useCompanyTheme = false;

  const dispatch = createEventDispatcher();

  let previewTheme = null;
  let error = "";
  let success = "";
  let showPreview = true;

  // Generate preview theme from company brand colors
  $: {
    if (brandColors) {
      previewTheme = generateCompanyTheme(brandColors);
    }
  }

  // Generate a theme based on company brand colors
  function generateCompanyTheme(colors) {
    const primaryPalette = generateColorPalette(colors.primary);
    const secondaryPalette = generateColorPalette(colors.secondary);
    const accentPalette = generateColorPalette(colors.accent);

    // Get base theme based on current mode
    const baseTheme =
      $themeStore.mode === "light"
        ? $themeStore.themes["luminous"]
        : $themeStore.themes["cosmic"];

    if (!baseTheme) return null;

    // Create new theme with company colors
    const companyTheme = JSON.parse(JSON.stringify(baseTheme));

    // Set new color palettes
    companyTheme.settings.colors.primary = primaryPalette;
    companyTheme.settings.colors.secondary = secondaryPalette;
    companyTheme.settings.colors.accent = accentPalette;

    // Generate semantic colors
    companyTheme.settings.semantic = createSemanticColors(
      companyTheme.settings.colors,
      companyTheme.mode,
    );

    // Set company theme metadata
    companyTheme.id = `company-${company?.id || "preview"}-${companyTheme.mode}`;
    companyTheme.name = `${company?.name || "Company"} Theme (${companyTheme.mode === "light" ? "Light" : "Dark"})`;
    companyTheme.description = `Custom theme for ${company?.name || "Company"}`;
    companyTheme.isBuiltIn = false;

    return companyTheme;
  }

  // Apply preview theme temporarily
  function previewCompanyTheme() {
    if (!previewTheme) return;
    themeStore.updateEditingTheme(previewTheme.settings);
  }

  // Reset to active theme
  function resetPreview() {
    const activeTheme = $themeStore.themes[$themeStore.activeThemeId];
    if (activeTheme) {
      themeStore.setActiveTheme(activeTheme.id);
    }
  }

  // Save the company theme
  function saveCompanyTheme() {
    if (!previewTheme) {
      error = "Failed to generate theme";
      return;
    }

    try {
      // Create light theme
      const lightTheme = generateCompanyTheme({
        ...brandColors,
        mode: "light",
      });
      lightTheme.id = `company-${company?.id}-light`;

      // Create dark theme
      const darkTheme = generateCompanyTheme({ ...brandColors, mode: "dark" });
      darkTheme.id = `company-${company?.id}-dark`;

      // Save both themes
      themeStore.createTheme(lightTheme);
      themeStore.createTheme(darkTheme);

      // Apply theme if useCompanyTheme is true
      if (useCompanyTheme) {
        const themeId =
          $themeStore.mode === "light" ? lightTheme.id : darkTheme.id;
        themeStore.setActiveTheme(themeId);
      }

      // Show success message
      success = "Company theme saved successfully";
      setTimeout(() => {
        success = "";
      }, 3000);

      // Notify parent component
      dispatch("save", {
        brandColors,
        useCompanyTheme,
        themes: {
          light: lightTheme.id,
          dark: darkTheme.id,
        },
      });
    } catch (err) {
      error = "Failed to save company theme";
      console.error(err);
    }
  }

  // Apply company theme when showPreview changes
  $: {
    if (showPreview) {
      previewCompanyTheme();
    } else {
      resetPreview();
    }
  }

  // Cleanup on component unmount
  function cleanup() {
    resetPreview();
  }
</script>

<svelte:window on:beforeunload={cleanup} />

<Card class="company-theme-customizer">
  <div class="p-6">
    <h3 class="text-lg font-medium mb-2">Brand Colors</h3>
    <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
      Customize your company brand colors to apply them throughout your profile.
    </p>

    {#if error}
      <AlertBox type="error" class="mb-4" dismissible bind:visible={error}>
        {error}
      </AlertBox>
    {/if}

    {#if success}
      <AlertBox type="success" class="mb-4" dismissible bind:visible={success}>
        {success}
      </AlertBox>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <ColorPicker
        label="Primary Brand Color"
        value={brandColors.primary}
        on:change={(e) => {
          brandColors.primary = e.detail;
          previewTheme = generateCompanyTheme(brandColors);
          if (showPreview) previewCompanyTheme();
        }}
      />

      <ColorPicker
        label="Secondary Brand Color"
        value={brandColors.secondary}
        on:change={(e) => {
          brandColors.secondary = e.detail;
          previewTheme = generateCompanyTheme(brandColors);
          if (showPreview) previewCompanyTheme();
        }}
      />

      <ColorPicker
        label="Accent Brand Color"
        value={brandColors.accent}
        on:change={(e) => {
          brandColors.accent = e.detail;
          previewTheme = generateCompanyTheme(brandColors);
          if (showPreview) previewCompanyTheme();
        }}
      />
    </div>

    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <Switch id="preview-switch" bind:checked={showPreview} />
        <label
          for="preview-switch"
          class="ml-2 text-sm text-neutral-700 dark:text-neutral-300"
        >
          Preview theme in real-time
        </label>
      </div>

      <div class="flex items-center">
        <Switch id="use-theme-switch" bind:checked={useCompanyTheme} />
        <label
          for="use-theme-switch"
          class="ml-2 text-sm text-neutral-700 dark:text-neutral-300"
        >
          Apply to company pages
        </label>
      </div>
    </div>

    <div class="flex justify-end">
      <Button variant="primary" on:click={saveCompanyTheme}>
        Save Brand Theme
      </Button>
    </div>
  </div>
</Card>
