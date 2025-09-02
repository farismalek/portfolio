<script lang="ts">
  export let src: string | null = null;
  export let name: string;
  export let size: "xs" | "sm" | "md" | "lg" | "xl" = "md";
  export let status: "online" | "offline" | "busy" | "away" | null = null;
  export let square = false;

  // Generate initials from name
  $: initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Determine size classes
  const sizes = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
    xl: "h-16 w-16 text-xl",
  };

  // Determine status indicator classes
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-neutral-300",
    busy: "bg-red-500",
    away: "bg-amber-500",
  };

  // Determine status indicator positions based on size
  const statusSizes = {
    xs: "h-1.5 w-1.5",
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
    xl: "h-4 w-4",
  };

  $: statusClass = status ? statusColors[status] : "";
  $: sizeClass = sizes[size];
  $: statusSizeClass = statusSizes[size];
  $: shapeClass = square ? "rounded-md" : "rounded-full";
</script>

<div class="relative inline-block">
  {#if src}
    <img {src} alt={name} class="{sizeClass} {shapeClass} object-cover" />
  {:else}
    <div
      class="{sizeClass} {shapeClass} bg-primary-100 text-primary-800 font-medium flex items-center justify-center"
    >
      {initials}
    </div>
  {/if}

  {#if status}
    <span
      class="{statusClass} {statusSizeClass} absolute bottom-0 right-0 rounded-full ring-2 ring-white"
    />
  {/if}
</div>
