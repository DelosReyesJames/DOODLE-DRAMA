<script>
  import { onDestroy } from 'svelte';

  export let active = false;

  const CC = ['#FF6B9D','#FFD93D','#4FC3F7','#69F0AE','#CE93D8','#FFB347'];

  let pieces = [];
  let clearTimer;

  $: if (active) {
    pieces = Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CC[i % CC.length],
      size: 8 + Math.random() * 8,
      round: Math.random() > .5,
      delay: Math.random() * .5,
      dur: 1.5 + Math.random(),
    }));
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => (pieces = []), 3000);
  }

  onDestroy(() => clearTimeout(clearTimer));
</script>

{#each pieces as p (p.id)}
  <div
    class="piece"
    style="
      left: {p.x}vw;
      width: {p.size}px;
      height: {p.size}px;
      background: {p.color};
      border-radius: {p.round ? '50%' : '3px'};
      animation: dd-fall {p.dur}s {p.delay}s ease forwards;
    "
  />
{/each}

<style>
  .piece {
    position: fixed;
    top: -20px;
    pointer-events: none;
    z-index: 9999;
  }
</style>
