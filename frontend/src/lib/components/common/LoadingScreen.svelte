<script lang="ts">
  export let message: string = "Loading...";
  export let fullScreen: boolean = true;
</script>

<div
  class="{fullScreen
    ? 'fixed inset-0 z-50 bg-white bg-opacity-90'
    : 'relative'} flex items-center justify-center p-4"
>
  <div class="text-center">
    <div
      class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-primary-600"
    ></div>
    <p class="mt-4 text-neutral-700 font-medium">
      {message}
    </p>
  </div>
</div>
