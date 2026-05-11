<script>
  export let value = 0;
  export let onChange = () => {};
</script>

<div class="stars">
  {#each [1, 2, 3] as s}
    <button class="star" class:active={s <= value} on:click={() => onChange(s)}>★</button>
  {/each}
</div>

<style>
  .stars { display: flex; gap: 4px; }
  .star {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.4rem;
    color: #ddd;
    padding: 0;
    line-height: 1;
  }
  .star.active { color: #FFD93D; }
</style>
