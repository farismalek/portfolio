<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { themeStore } from "$lib/stores/themeStore";
  import Button from "$lib/components/common/Button.svelte";
  import Card from "$lib/components/common/Card.svelte";
  import Tabs from "$lib/components/common/Tabs.svelte";
  import ColorPicker from "$lib/components/theme/ColorPicker.svelte";
  import FontSelector from "$lib/components/theme/FontSelector.svelte";
  import BorderRadiusSelector from "$lib/components/theme/BorderRadiusSelector.svelte";

  export let portfolio = null;
  export let currentTheme = null;

  const dispatch = createEventDispatcher();

  let activeTab = "colors";
  let themeColors = {
    primary: "#0ea5e9",
    secondary: "#8b5cf6",
    accent: "#f59e0b",
  };
  let fontFamily = "Inter, sans-serif";
  let headingFont = "Plus Jakarta Sans, sans-serif";
  let borderRadius = "0.5rem";

  // Initialize from portfolio if available
  $: {
    if (portfolio?.theme) {
      themeColors = {
        primary: portfolio.theme.colors?.primary || themeColors.primary,
        secondary: portfolio.theme.colors?.secondary || themeColors.secondary,
        accent: portfolio.theme.colors?.accent || themeColors.accent,
      };
      fontFamily = portfolio.theme.typography?.fontFamily || fontFamily;
      headingFont = portfolio.theme.typography?.headingFont || headingFont;
      borderRadius = portfolio.theme.borderRadius || borderRadius;
    }
  }

  // Available preset themes
  const presetThemes = [
    {
      name: "Classic",
      colors: { primary: "#0ea5e9", secondary: "#8b5cf6", accent: "#f59e0b" },
      fontFamily: "Inter, sans-serif",
      headingFont: "Plus Jakarta Sans, sans-serif",
      borderRadius: "0.5rem",
    },
    {
      name: "Minimal",
      colors: { primary: "#111827", secondary: "#374151", accent: "#6B7280" },
      fontFamily: "Inter, sans-serif",
      headingFont: "Inter, sans-serif",
      borderRadius: "0.25rem",
    },
    {
      name: "Creative",
      colors: { primary: "#EC4899", secondary: "#8B5CF6", accent: "#F59E0B" },
      fontFamily: "Poppins, sans-serif",
      headingFont: "Playfair Display, serif",
      borderRadius: "1rem",
    },
    {
      name: "Corporate",
      colors: { primary: "#1E40AF", secondary: "#1E3A8A", accent: "#3B82F6" },
      fontFamily: "Source Sans Pro, sans-serif",
      headingFont: "Montserrat, sans-serif",
      borderRadius: "0.375rem",
    },
  ];

  function applyPreset(preset) {
    themeColors = { ...preset.colors };
    fontFamily = preset.fontFamily;
    headingFont = preset.headingFont;
    borderRadius = preset.borderRadius;
    saveTheme();
  }

  function saveTheme() {
    const portfolioTheme = {
      colors: themeColors,
      typography: {
        fontFamily,
        headingFont,
      },
      borderRadius,
    };

    dispatch("change", portfolioTheme);
  }
</script>

<div class="portfolio-theme-selector">
  <Card>
    <div class="p-4">
      <h3 class="text-lg font-medium mb-2">Portfolio Theme</h3>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
        Customize the appearance of your portfolio
      </p>

      <Tabs
        tabs={[
          { id: "presets", label: "Presets" },
          { id: "colors", label: "Colors" },
          { id: "typography", label: "Typography" },
          { id: "spacing", label: "Spacing & Borders" },
        ]}
        bind:activeTab
      />

      <div class="mt-4">
        {#if activeTab === "presets"}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {#each presetThemes as preset}
              <button
                class="p-4 border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-center"
                on:click={() => applyPreset(preset)}
              >
                <div class="flex justify-center mb-2 space-x-1">
                  <div
                    class="w-4 h-4 rounded-full"
                    style="background-color: {preset.colors.primary}"
                  ></div>
                  <div
                    class="w-4 h-4 rounded-full"
                    style="background-color: {preset.colors.secondary}"
                  ></div>
                  <div
                    class="w-4 h-4 rounded-full"
                    style="background-color: {preset.colors.accent}"
                  ></div>
                </div>
                <div class="text-sm font-medium">{preset.name}</div>
              </button>
            {/each}
          </div>
        {:else if activeTab === "colors"}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ColorPicker
              label="Primary Color"
              value={themeColors.primary}
              on:change={(e) => {
                themeColors.primary = e.detail;
                saveTheme();
              }}
            />

            <ColorPicker
              label="Secondary Color"
              value={themeColors.secondary}
              on:change={(e) => {
                themeColors.secondary = e.detail;
                saveTheme();
              }}
            />

            <ColorPicker
              label="Accent Color"
              value={themeColors.accent}
              on:change={(e) => {
                themeColors.accent = e.detail;
                saveTheme();
              }}
            />
          </div>
        {:else if activeTab === "typography"}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FontSelector
              label="Main Font"
              value={fontFamily}
              on:change={(e) => {
                fontFamily = e.detail;
                saveTheme();
              }}
            />

            <FontSelector
              label="Heading Font"
              value={headingFont}
              on:change={(e) => {
                headingFont = e.detail;
                saveTheme();
              }}
            />
          </div>
        {:else if activeTab === "spacing"}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BorderRadiusSelector
              label="Border Radius"
              value={borderRadius}
              on:change={(e) => {
                borderRadius = e.detail;
                saveTheme();
              }}
            />
          </div>
        {/if}
      </div>
    </div>
  </Card>
</div>
