<script lang="ts">
  export let variant: "default" | "interactive" | "elevated" = "default";
  export let padding: "none" | "sm" | "md" | "lg" = "md";

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-8",
  };

  const variants = {
    default: "bg-white border border-neutral-200 rounded-xl shadow-sm",
    interactive:
      "bg-white border border-neutral-200 rounded-xl shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200 cursor-pointer",
    elevated: "bg-white border border-neutral-100 rounded-xl shadow-md",
  };

  $: classes = [variants[variant], paddings[padding]].join(" ");
</script>

<div class={classes} on:click {...$$restProps}>
  <slot />
</div>
