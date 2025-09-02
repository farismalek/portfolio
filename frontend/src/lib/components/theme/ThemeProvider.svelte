<script lang="ts">
  import { onMount } from "svelte";
  import { themeStore, activeTheme } from "$lib/stores/themeStore";
  import { applyThemeToDOM } from "$lib/utils/themeUtils";

  // Apply theme when component mounts
  onMount(() => {
    // Apply the active theme
    if ($activeTheme) {
      applyThemeToDOM($activeTheme);
    }

    // Setup system theme preference detection
    if (typeof window !== "undefined" && window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)",
      );

      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        themeStore.updateSystemPreference(e.matches ? "dark" : "light");
      };

      // Set initial value
      handleChange(darkModeMediaQuery);

      // Listen for changes
      if (darkModeMediaQuery.addEventListener) {
        darkModeMediaQuery.addEventListener("change", handleChange);
        return () =>
          darkModeMediaQuery.removeEventListener("change", handleChange);
      }
    }
  });
</script>

<slot />
