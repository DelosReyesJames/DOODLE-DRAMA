<!-- Toast.svelte -->
<script>
  export let msg = '';
  export let show = false;
</script>

<div class="toast" class:show>{msg}</div>

<style>
  .toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: #3D2C8D;
    color: #fff;
    font-family: 'Fredoka One', cursive;
    font-size: 1.1rem;
    padding: .7rem 1.6rem;
    border-radius: 50px;
    z-index: 999;
    transition: transform .3s ease;
    pointer-events: none;
    white-space: nowrap;
  }
  .toast.show { transform: translateX(-50%) translateY(0); }
</style>
