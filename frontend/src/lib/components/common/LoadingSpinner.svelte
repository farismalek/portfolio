<script lang="ts">
  export let size: "sm" | "md" | "lg" | "xl" = "md";
  export let color: string = "primary";

  // Map size to dimensions
  const sizeMap = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
    xl: "w-16 h-16 border-4",
  };

  // Map color to Tailwind classes
  const colorMap = {
    primary: "border-t-primary-500",
    neutral: "border-t-neutral-500",
    white: "border-t-white",
  };

  $: sizeClass = sizeMap[size];
  $: colorClass = colorMap[color];
</script>

<div
  class="{sizeClass} {colorClass} rounded-full border-neutral-200 animate-spin"
></div>
