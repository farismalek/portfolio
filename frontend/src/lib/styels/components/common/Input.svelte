<script lang="ts">
  export let id: string;
  export let label: string = "";
  export let type: string = "text";
  export let value: string = "";
  export let placeholder: string = "";
  export let error: string | undefined = undefined;
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let helperText: string | undefined = undefined;
  export let icon: string | undefined = undefined;

  let focused = false;
  const handleFocus = () => (focused = true);
  const handleBlur = () => (focused = false);
</script>

<div class="w-full">
  {#if label}
    <label for={id} class="block text-sm font-medium text-neutral-700 mb-1">
      {label}{required ? " *" : ""}
    </label>
  {/if}

  <div class="relative">
    {#if icon}
      <div
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <span class="text-neutral-500 sm:text-sm">{icon}</span>
      </div>
    {/if}

    <input
      {id}
      {type}
      bind:value
      {placeholder}
      {disabled}
      {required}
      on:focus={handleFocus}
      on:blur={handleBlur}
      class="
        w-full rounded-md border
        {error
        ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
        : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'}
        {icon ? 'pl-10' : 'pl-4'}
        py-2 pr-4 shadow-sm
        placeholder-neutral-400
        focus:outline-none focus:ring-2 sm:text-sm
        transition-all duration-200
        {disabled
        ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed'
        : 'bg-white'}"
      on:input
      aria-invalid={error ? "true" : "false"}
      aria-describedby={error
        ? `${id}-error`
        : helperText
          ? `${id}-description`
          : undefined}
      {...$$restProps}
    />

    {#if error}
      <div
        class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
      >
        <svg
          class="h-5 w-5 text-red-500"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    {/if}
  </div>

  {#if error}
    <p class="mt-2 text-sm text-red-600" id={`${id}-error`}>{error}</p>
  {:else if helperText}
    <p class="mt-1.5 text-sm text-neutral-500" id={`${id}-description`}>
      {helperText}
    </p>
  {/if}
</div>
