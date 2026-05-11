<script>
  import { COLORS } from './constants.js';

  export let onSave;
  export let onCancel = null;
  export let saveLabel = '💾 Save';

  let canvas;
  let color = '#FF6B6B';
  let size = 6;
  let tool = 'draw'; // 'draw' | 'erase'
  let drawing = false;
  let last = { x: 0, y: 0 };

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * sx, y: (src.clientY - r.top) * sy };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    last = getPos(e);
  }

  function onDraw(e) {
    e.preventDefault();
    if (!drawing) return;
    const ctx = canvas.getContext('2d');
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = tool === 'erase' ? '#FFFFFF' : color;
    ctx.lineWidth = tool === 'erase' ? size * 3 : size;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.stroke();
    last = p;
  }

  function stopDraw() { drawing = false; }

  function clear() {
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }

  function handleSave() {
    const blank = document.createElement('canvas');
    blank.width = 700; blank.height = 400;
    if (canvas.toDataURL() === blank.toDataURL()) {
      alert('Draw something first!');
      return;
    }
    onSave(canvas.toDataURL());
  }
</script>

<div class="wrap">
  <canvas
    bind:this={canvas}
    width={700}
    height={400}
    on:mousedown={startDraw}
    on:mousemove={onDraw}
    on:mouseup={stopDraw}
    on:mouseleave={stopDraw}
    on:touchstart|passive={startDraw}
    on:touchmove|passive={onDraw}
    on:touchend={stopDraw}
  />

  <div class="toolbar">
    {#each COLORS as c}
      <button
        class="swatch"
        class:active={color === c && tool === 'draw'}
        style="background:{c}"
        on:click={() => { color = c; tool = 'draw'; }}
      />
    {/each}

    <input type="range" min={2} max={30} bind:value={size} />

    {#each ['draw', 'erase'] as t}
      <button
        class="tool-btn"
        class:active={tool === t}
        on:click={() => (tool = t)}
      >
        {t === 'draw' ? '✏️ Draw' : '🧹 Erase'}
      </button>
    {/each}
  </div>

  <div class="actions">
    <button class="action-btn red" on:click={clear}>🗑️ Clear</button>
    {#if onCancel}
      <button class="action-btn gray" on:click={onCancel}>Cancel</button>
    {/if}
    <button class="action-btn pink" on:click={handleSave}>{saveLabel}</button>
  </div>
</div>

<style>
  .wrap {
    background: #fff;
    border-radius: 20px;
    padding: 1rem;
    box-shadow: 0 4px 20px rgba(61,44,141,.12);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  canvas {
    width: 100%;
    border-radius: 12px;
    cursor: crosshair;
    background: #fff;
    border: 3px dashed #E0D7FF;
    display: block;
    touch-action: none;
  }

  .toolbar {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }

  .swatch {
    width: 34px; height: 34px;
    border-radius: 50%;
    cursor: pointer;
    flex-shrink: 0;
    border: 2px solid #ccc;
    transition: all .15s;
  }
  .swatch.active {
    border: 3px solid #3D2C8D;
    transform: scale(1.2);
  }

  input[type=range] { width: 80px; cursor: pointer; }

  .tool-btn {
    background: #F0EDFF;
    color: #3D2C8D;
    border: 2px solid #D8D0FF;
    border-radius: 10px;
    padding: .35rem .8rem;
    font-weight: 700;
    font-size: .85rem;
    cursor: pointer;
  }
  .tool-btn.active {
    background: #3D2C8D;
    color: #fff;
    border-color: #3D2C8D;
  }

  .actions { display: flex; gap: .75rem; flex-wrap: wrap; }

  .action-btn {
    flex: 1;
    min-width: 80px;
    border: none;
    border-radius: 14px;
    padding: .8rem 1.2rem;
    font-family: 'Fredoka One', cursive;
    font-size: 1rem;
    cursor: pointer;
    color: #fff;
  }
  .red  { background: #FF6B6B; flex: 0 0 auto; min-width: 80px; }
  .gray { background: #888; flex: 0 0 auto; }
  .pink { background: #FF6B9D; }
</style>
