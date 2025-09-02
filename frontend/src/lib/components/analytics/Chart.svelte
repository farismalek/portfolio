<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Chart from "chart.js/auto";
  import type {
    ChartData,
    ChartOptions,
    ChartType,
  } from "$lib/types/analytics";

  export let type: ChartType = "bar";
  export let data: ChartData;
  export let options: ChartOptions = {};
  export let height: number | string = 300;
  export let width: number | string = "100%";

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  onMount(() => {
    // Create chart when component mounts
    createChart();
  });

  onDestroy(() => {
    // Destroy chart when component unmounts
    if (chart) {
      chart.destroy();
    }
  });

  // Create the chart instance
  function createChart() {
    if (!canvas) return;

    chart = new Chart(canvas, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...options,
      },
    });
  }

  // Update chart when data or options change
  $: if (chart && data) {
    chart.data = data;
    chart.update();
  }

  $: if (chart && options) {
    chart.options = {
      ...chart.options,
      ...options,
    };
    chart.update();
  }
</script>

<div
  style="position: relative; height: {typeof height === 'number'
    ? `${height}px`
    : height}; width: {typeof width === 'number' ? `${width}px` : width};"
>
  <canvas bind:this={canvas}></canvas>
</div>
