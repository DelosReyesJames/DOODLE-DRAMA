<script>
  import { onMount } from 'svelte';

  // ── State ──────────────────────────────────────────────
  let screen = 'home'; // 'home' | 'draw' | 'act' | 'gallery' | 'stars'

  // Drawing
  let canvas;
  let ctx;
  let isDrawing = false;
  let lastX = 0, lastY = 0;
  let currentColor = '#FF6B6B';
  let brushSize = 6;
  let tool = 'draw'; // 'draw' | 'erase'

  const COLORS = [
    '#FF6B6B','#FF6B9D','#FFD93D','#69F0AE',
    '#4FC3F7','#CE93D8','#FFB347','#3D2C8D',
    '#FFFFFF','#333333',
  ];

  // Gallery / Stars
  let savedDoodles = [];
  let totalStars = 0;

  const ACHIEVEMENTS = [
    { name: 'First Star!',  emoji: '⭐', req: 1,  desc: 'Complete your first performance' },
    { name: 'Triple Act',   emoji: '🎭', req: 3,  desc: 'Perform 3 drama challenges' },
    { name: 'Show Star',    emoji: '🌟', req: 5,  desc: 'Complete 5 performances' },
    { name: 'Drama Pro',    emoji: '🏆', req: 10, desc: 'Reach 10 performances' },
    { name: 'Superstar',    emoji: '💫', req: 15, desc: 'Reach 15 performances' },
    { name: 'Legend',       emoji: '👑', req: 20, desc: 'Reach 20 performances' },
  ];

  // Prompts
  const PROMPTS = [
    { emoji:'🦁', text:'You are a brave lion protecting your pride!',          hint:'Roar loudly and walk with your chest up!' },
    { emoji:'🌊', text:'You are an ocean wave crashing on the beach!',         hint:'Move your arms like flowing water.' },
    { emoji:'🤖', text:'You are a robot who just learned to dance!',           hint:'Move stiff and jerky — beep boop!' },
    { emoji:'🦋', text:'You just hatched from your cocoon as a butterfly!',    hint:'Slowly spread your wings for the first time.' },
    { emoji:'🌋', text:'You are a volcano about to erupt!',                    hint:'Build up slowly… then EXPLODE with energy!' },
    { emoji:'🧙', text:'You are a wizard casting a powerful spell!',           hint:'Wave your wand and say the magic words!' },
    { emoji:'🐢', text:'You are a turtle in a hurry!',                         hint:'Move as fast as you can… slowly!' },
    { emoji:'🌺', text:'You are a flower blooming in the morning sun!',        hint:'Start curled up, then slowly open up tall.' },
    { emoji:'🎪', text:'You are a circus juggler who keeps dropping things!',  hint:'Mime juggling — and act surprised each drop!' },
    { emoji:'🌩️', text:'You are a thunderstorm rolling over mountains!',       hint:'Be the wind, the lightning, and the rain!' },
    { emoji:'🐬', text:'You are a dolphin leaping through the waves!',         hint:'Jump, spin, and make happy dolphin sounds!' },
    { emoji:'🍕', text:'You are a pizza being made from scratch!',             hint:'Start as dough being tossed, then get toppings!' },
    { emoji:'🦸', text:'You are a superhero who just discovered their power!', hint:'React with surprise, then try your power out!' },
    { emoji:'🧸', text:'You are a teddy bear who comes to life at night!',     hint:'Slowly wake up and look around in amazement!' },
    { emoji:'🎵', text:'You are a song that gets faster and faster!',          hint:'Start slow and quiet, speed up to the end!' },
  ];

  let promptIdx = 0;
  $: prompt = PROMPTS[promptIdx];

  // Timer
  let timerSeconds = 30;
  let timerRunning = false;
  let timerInterval = null;
  $: timerWarning = timerSeconds <= 5 && timerSeconds > 0;
  $: timerLabel = `${Math.floor(timerSeconds / 60)}:${String(timerSeconds % 60).padStart(2, '0')}`;

  // Toast
  let toastMsg = '';
  let toastVisible = false;
  let toastTimeout;

  // Confetti
  let confettiParticles = [];
  const CONFETTI_COLORS = ['#FF6B9D','#FFD93D','#4FC3F7','#69F0AE','#CE93D8','#FFB347'];

  // ── Lifecycle ──────────────────────────────────────────
  onMount(() => {
    savedDoodles = JSON.parse(localStorage.getItem('dd_doodles') || '[]');
    totalStars   = parseInt(localStorage.getItem('dd_stars')   || '0');
    randomPrompt();
  });

  // ── Navigation ─────────────────────────────────────────
  function goto(s) {
    stopTimer();
    screen = s;
    if (s === 'act') randomPrompt();
    if (s === 'draw') initCanvas();
  }

  // ── Canvas ─────────────────────────────────────────────
  function initCanvas() {
    // wait a tick for the canvas element to mount
    setTimeout(() => {
      if (!canvas) return;
      ctx = canvas.getContext('2d');
    }, 50);
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width  / rect.width;
    const sy = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const p = getPos(e);
    lastX = p.x; lastY = p.y;
  }

  function onDraw(e) {
    e.preventDefault();
    if (!isDrawing || !ctx) return;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = tool === 'erase' ? '#FFFFFF' : currentColor;
    ctx.lineWidth   = tool === 'erase' ? brushSize * 3 : brushSize;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.stroke();
    lastX = p.x; lastY = p.y;
  }

  function stopDraw() { isDrawing = false; }

  function clearCanvas() {
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function saveToGallery() {
    const blank = document.createElement('canvas');
    blank.width = canvas.width; blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      showToast('✏️ Draw something first!');
      return;
    }
    const entry = { id: Date.now(), url: canvas.toDataURL(), date: new Date().toLocaleDateString() };
    savedDoodles = [entry, ...savedDoodles].slice(0, 20);
    localStorage.setItem('dd_doodles', JSON.stringify(savedDoodles));
    showToast('🎉 Saved to Gallery!');
    spawnConfetti();
  }

  function setColor(c) { currentColor = c; tool = 'draw'; }

  // ── Prompts ────────────────────────────────────────────
  function randomPrompt() {
    let next;
    do { next = Math.floor(Math.random() * PROMPTS.length); } while (next === promptIdx && PROMPTS.length > 1);
    promptIdx = next;
    resetTimer();
  }

  // ── Timer ──────────────────────────────────────────────
  function toggleTimer() { timerRunning ? stopTimer() : startTimer(); }

  function startTimer() {
    timerRunning = true;
    timerInterval = setInterval(() => {
      timerSeconds--;
      if (timerSeconds <= 0) { stopTimer(); showToast("⏰ Time's up! Great job!"); }
    }, 1000);
  }

  function stopTimer() {
    timerRunning = false;
    clearInterval(timerInterval);
  }

  function resetTimer() { stopTimer(); timerSeconds = 30; }

  // ── Stars ──────────────────────────────────────────────
  function earnStar() {
    totalStars++;
    localStorage.setItem('dd_stars', totalStars);
    const milestones = [1,3,5,10,15,20];
    const labels = ['First Star! ⭐','Triple Act 🎭','Show Star 🌟','Drama Pro 🏆','Superstar 💫','Legend 👑'];
    const idx = milestones.indexOf(totalStars);
    showToast(idx >= 0 ? '🏆 Achievement: ' + labels[idx] : `⭐ Star earned! Total: ${totalStars}`);
    spawnConfetti();
    randomPrompt();
  }

  // ── Toast ──────────────────────────────────────────────
  function showToast(msg) {
    toastMsg = msg;
    toastVisible = true;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toastVisible = false, 2500);
  }

  // ── Confetti ───────────────────────────────────────────
  function spawnConfetti() {
    const particles = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 8 + Math.random() * 8,
      round: Math.random() > 0.5,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random(),
    }));
    confettiParticles = [...confettiParticles, ...particles];
    setTimeout(() => {
      const ids = new Set(particles.map(p => p.id));
      confettiParticles = confettiParticles.filter(p => !ids.has(p.id));
    }, 3000);
  }

  // ── View doodle ────────────────────────────────────────
  function viewDoodle(url) {
    const w = window.open('', '_blank');
    w.document.write(`<html><body style="margin:0;background:#FFF9F0;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${url}" style="max-width:100%;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.15)"></body></html>`);
  }
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
</svelte:head>

<!-- ═══════════════ CONFETTI ═══════════════ -->
{#each confettiParticles as p (p.id)}
  <div
    class="confetti"
    style="
      left:{p.x}vw;
      background:{p.color};
      width:{p.size}px;
      height:{p.size}px;
      border-radius:{p.round?'50%':'3px'};
      animation-delay:{p.delay}s;
      animation-duration:{p.duration}s;
    "
  ></div>
{/each}

<!-- ═══════════════ TOAST ═══════════════ -->
<div class="toast" class:show={toastVisible}>{toastMsg}</div>

<!-- ═══════════════ HOME ═══════════════ -->
{#if screen === 'home'}
  <main class="home">
    <div class="logo-area">
      <span class="logo-emoji">🎨</span>
      <h1 class="logo-title">Drama Doodles</h1>
      <p class="logo-subtitle">Draw it · Act it · Be it!</p>
    </div>
    <div class="menu-grid">
      <button class="menu-btn draw" on:click={() => goto('draw')}>
        <span class="btn-icon">✏️</span>Let's Draw!
      </button>
      <button class="menu-btn act" on:click={() => goto('act')}>
        <span class="btn-icon">🎭</span>Time to Act!
      </button>
      <button class="menu-btn gallery" on:click={() => goto('gallery')}>
        <span class="btn-icon">🖼️</span>My Gallery
      </button>
      <button class="menu-btn stars-btn" on:click={() => goto('stars')}>
        <span class="btn-icon">⭐</span>My Stars
      </button>
    </div>
  </main>

<!-- ═══════════════ DRAW ═══════════════ -->
{:else if screen === 'draw'}
  <main class="page">
    <header class="screen-header">
      <button class="back-btn" on:click={() => goto('home')}>←</button>
      <h2 class="screen-title">✏️ Let's Draw!</h2>
    </header>
    <div class="canvas-wrap">
      <canvas
        bind:this={canvas}
        id="doodle-canvas"
        width="700"
        height="400"
        on:mousedown={startDraw}
        on:mousemove={onDraw}
        on:mouseup={stopDraw}
        on:mouseleave={stopDraw}
        on:touchstart={startDraw}
        on:touchmove={onDraw}
        on:touchend={stopDraw}
      ></canvas>

      <div class="tool-row">
        {#each COLORS as c}
          <button
            class="color-dot"
            class:active={currentColor === c && tool === 'draw'}
            style="background:{c};{c==='#FFFFFF'?'border:2px solid #ccc;':''}"
            on:click={() => setColor(c)}
            aria-label={c}
          ></button>
        {/each}
        <input
          type="range" min="2" max="30" bind:value={brushSize}
          class="size-slider" aria-label="Brush size"
        />
        <button class="tool-btn" class:active={tool==='draw'}  on:click={() => tool='draw'}>✏️ Draw</button>
        <button class="tool-btn" class:active={tool==='erase'} on:click={() => tool='erase'}>🧹 Erase</button>
      </div>

      <div class="action-row">
        <button class="big-btn red-btn"  on:click={clearCanvas}>🗑️ Clear</button>
        <button class="big-btn pink-btn" on:click={saveToGallery}>💾 Save to Gallery</button>
        <button class="big-btn green-btn" on:click={() => goto('act')}>🎭 Act It Out!</button>
      </div>
    </div>
  </main>

<!-- ═══════════════ ACT ═══════════════ -->
{:else if screen === 'act'}
  <main class="page act-page">
    <header class="screen-header">
      <button class="back-btn" on:click={() => goto('home')}>←</button>
      <h2 class="screen-title">🎭 Time to Act!</h2>
    </header>

    {#key promptIdx}
      <div class="prompt-card">
        <span class="prompt-emoji">{prompt.emoji}</span>
        <span class="prompt-label">YOUR DRAMA PROMPT</span>
        <p class="prompt-text">{prompt.text}</p>
        <p class="prompt-hint">💡 {prompt.hint}</p>
      </div>
    {/key}

    <div class="timer-area">
      <div class="timer-display" class:warning={timerWarning}>{timerLabel}</div>
      <button class="big-btn pink-btn" style="flex:0 0 auto;min-width:130px" on:click={toggleTimer}>
        {timerRunning ? '⏸️ Pause' : '▶️ Start'}
      </button>
    </div>

    <div class="action-row">
      <button class="big-btn purple-btn" on:click={randomPrompt}>🎲 New Prompt</button>
      <button class="big-btn green-btn"  on:click={earnStar}>⭐ I Did It!</button>
    </div>
  </main>

<!-- ═══════════════ GALLERY ═══════════════ -->
{:else if screen === 'gallery'}
  <main class="page">
    <header class="screen-header">
      <button class="back-btn" on:click={() => goto('home')}>←</button>
      <h2 class="screen-title">🖼️ My Gallery</h2>
    </header>
    {#if savedDoodles.length === 0}
      <div class="empty-gallery">
        <span>🖼️</span>
        No doodles yet!<br>Draw something and save it!
      </div>
    {:else}
      <div class="gallery-grid">
        {#each savedDoodles as d (d.id)}
          <button class="gallery-item" on:click={() => viewDoodle(d.url)}>
            <img src={d.url} alt="Doodle" />
            <div class="item-label">📅 {d.date}</div>
          </button>
        {/each}
      </div>
    {/if}
  </main>

<!-- ═══════════════ STARS ═══════════════ -->
{:else if screen === 'stars'}
  <main class="page">
    <header class="screen-header">
      <button class="back-btn" on:click={() => goto('home')}>←</button>
      <h2 class="screen-title">⭐ My Stars</h2>
    </header>

    <div class="total-stars-card">
      <span class="big-num">{totalStars}</span>
      ⭐ Total Stars Earned
    </div>

    {#each ACHIEVEMENTS as a}
      <div class="star-card" class:locked={totalStars < a.req}>
        <span class="star-icon">{a.emoji}</span>
        <div>
          <div class="star-label">{a.name}</div>
          <div class="star-count">{a.desc} · Need {a.req} ⭐</div>
        </div>
        <span class="star-badge">{totalStars >= a.req ? '✅' : '🔒'}</span>
      </div>
    {/each}
  </main>
{/if}

<style>
  /* ── Reset & Base ───────────────────────────────────── */
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) {
    font-family: 'Nunito', sans-serif;
    background: #FFF9F0;
    min-height: 100vh;
    overflow-x: hidden;
  }
  :global(body)::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(circle at 10% 20%, rgba(255,107,157,.08) 0%, transparent 40%),
      radial-gradient(circle at 90% 10%, rgba(79,195,247,.08)  0%, transparent 40%),
      radial-gradient(circle at 50% 90%, rgba(105,240,174,.08) 0%, transparent 40%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Shared layouts ─────────────────────────────────── */
  .home, .page {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    padding: 1rem;
  }

  .home {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .page {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
  }

  .act-page { max-width: 600px; }

  /* ── Home ───────────────────────────────────────────── */
  .logo-area { margin-bottom: 2rem; animation: bounceIn .8s ease; }

  .logo-emoji {
    font-size: 5rem;
    display: block;
    animation: wiggle 3s ease-in-out infinite;
  }

  .logo-title {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(2.5rem, 8vw, 4.5rem);
    background: linear-gradient(135deg, #FF6B9D, #CE93D8, #4FC3F7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.1;
  }

  .logo-subtitle {
    font-size: 1.1rem;
    color: #8B7BC8;
    font-weight: 700;
    margin-top: .5rem;
  }

  .menu-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    width: 100%;
    max-width: 420px;
  }

  .menu-btn {
    background: #fff;
    border: 3px solid transparent;
    border-radius: 20px;
    padding: 1.5rem 1rem;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(61,44,141,.12);
    transition: transform .2s;
    font-family: 'Fredoka One', cursive;
    font-size: 1.1rem;
    color: #3D2C8D;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .4rem;
  }
  .menu-btn:hover { transform: translateY(-4px) scale(1.03); }
  .menu-btn .btn-icon { font-size: 2.5rem; }

  .menu-btn.draw     { border-color: #FF6B9D; background: linear-gradient(135deg,#fff,#FFF0F5); }
  .menu-btn.act      { border-color: #FFB347; background: linear-gradient(135deg,#fff,#FFF8F0); }
  .menu-btn.gallery  { border-color: #4FC3F7; background: linear-gradient(135deg,#fff,#F0F9FF); }
  .menu-btn.stars-btn{ border-color: #FFD93D; background: linear-gradient(135deg,#fff,#FFFBF0); }

  /* ── Screen header ──────────────────────────────────── */
  .screen-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .back-btn {
    background: #fff;
    border: 2px solid #E0D7FF;
    border-radius: 50%;
    width: 44px; height: 44px;
    font-size: 1.3rem;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .2s;
    flex-shrink: 0;
  }
  .back-btn:hover { background: #CE93D8; color: #fff; border-color: #CE93D8; }

  .screen-title {
    font-family: 'Fredoka One', cursive;
    font-size: 1.8rem;
    color: #3D2C8D;
  }

  /* ── Canvas ─────────────────────────────────────────── */
  .canvas-wrap {
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(61,44,141,.12);
    padding: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  #doodle-canvas {
    width: 100%;
    border-radius: 12px;
    cursor: crosshair;
    background: #fff;
    border: 3px dashed #E0D7FF;
    touch-action: none;
    display: block;
  }

  .tool-row {
    display: flex;
    gap: .5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .color-dot {
    width: 36px; height: 36px;
    border-radius: 50%;
    cursor: pointer;
    border: 3px solid transparent;
    transition: transform .15s;
    flex-shrink: 0;
  }
  .color-dot.active { border-color: #3D2C8D; transform: scale(1.2); }
  .color-dot:hover  { transform: scale(1.15); }

  .tool-btn {
    background: #F0EDFF;
    border: 2px solid #D8D0FF;
    border-radius: 10px;
    padding: .4rem .9rem;
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: .85rem;
    cursor: pointer;
    color: #3D2C8D;
    transition: all .2s;
  }
  .tool-btn.active,
  .tool-btn:hover { background: #3D2C8D; color: #fff; border-color: #3D2C8D; }

  .size-slider {
    -webkit-appearance: none;
    width: 80px; height: 6px;
    border-radius: 3px;
    background: #D8D0FF;
    cursor: pointer;
  }
  .size-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #CE93D8;
    cursor: pointer;
  }

  /* ── Buttons ────────────────────────────────────────── */
  .action-row {
    display: flex;
    gap: .75rem;
    flex-wrap: wrap;
  }

  .big-btn {
    flex: 1;
    min-width: 120px;
    border: none;
    border-radius: 14px;
    padding: .85rem 1rem;
    font-family: 'Fredoka One', cursive;
    font-size: 1.1rem;
    cursor: pointer;
    color: #fff;
    transition: transform .2s, box-shadow .2s;
  }
  .big-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(61,44,141,.3); }

  .red-btn    { background: #FF6B6B; flex: 0 0 auto; min-width: 80px; }
  .pink-btn   { background: #FF6B9D; }
  .green-btn  { background: #2ECC71; }
  .purple-btn { background: #9C59D1; }

  /* ── Act screen ─────────────────────────────────────── */
  .prompt-card {
    background: #fff;
    border: 3px solid #FFB347;
    border-radius: 24px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(61,44,141,.12);
    text-align: center;
    margin: 1rem 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    animation: fadeSlide .4s ease;
  }

  .prompt-emoji {
    font-size: 5rem;
    animation: bounce 1s ease infinite alternate;
  }

  .prompt-label {
    background: #FFB347;
    color: #fff;
    font-family: 'Fredoka One', cursive;
    padding: .3rem 1rem;
    border-radius: 20px;
    font-size: .9rem;
  }

  .prompt-text {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(1.4rem, 5vw, 2rem);
    color: #3D2C8D;
    line-height: 1.3;
  }

  .prompt-hint {
    font-size: 1rem;
    color: #8B7BC8;
    font-weight: 600;
    padding: .75rem 1.25rem;
    background: #F5F0FF;
    border-radius: 12px;
    width: 100%;
  }

  .timer-area {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin: .5rem 0;
  }

  .timer-display {
    font-family: 'Fredoka One', cursive;
    font-size: 3rem;
    color: #3D2C8D;
    background: #fff;
    border: 3px solid #FFD93D;
    border-radius: 16px;
    padding: .3rem 1.5rem;
    min-width: 130px;
    text-align: center;
  }
  .timer-display.warning {
    border-color: #FF6B6B;
    color: #FF6B6B;
    animation: pulse .5s ease infinite alternate;
  }

  /* ── Gallery ────────────────────────────────────────── */
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .gallery-item {
    background: #fff;
    border: 3px solid transparent;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(61,44,141,.12);
    cursor: pointer;
    transition: transform .2s, border-color .2s;
    padding: 0;
  }
  .gallery-item:hover { transform: translateY(-4px); border-color: #CE93D8; }
  .gallery-item img { width: 100%; display: block; }
  .item-label {
    padding: .5rem;
    font-weight: 700;
    font-size: .8rem;
    color: #3D2C8D;
    text-align: center;
  }

  .empty-gallery {
    text-align: center;
    padding: 3rem 1rem;
    color: #A09BC8;
    font-size: 1.1rem;
    font-weight: 600;
  }
  .empty-gallery span { font-size: 4rem; display: block; margin-bottom: 1rem; }

  /* ── Stars ──────────────────────────────────────────── */
  .total-stars-card {
    text-align: center;
    font-family: 'Fredoka One', cursive;
    font-size: 2rem;
    color: #3D2C8D;
    background: linear-gradient(135deg, #FFF9D0, #FFFDE8);
    border: 3px solid #FFD93D;
    border-radius: 20px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .big-num { font-size: 4rem; display: block; line-height: 1; color: #F0A500; }

  .star-card {
    background: #fff;
    border-radius: 20px;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 4px 20px rgba(61,44,141,.12);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    border-left: 5px solid #FFD93D;
    transition: opacity .3s, filter .3s;
  }
  .star-card.locked { opacity: .4; filter: grayscale(1); }
  .star-icon  { font-size: 2.5rem; flex-shrink: 0; }
  .star-label { font-family: 'Fredoka One', cursive; font-size: 1.1rem; color: #3D2C8D; }
  .star-count { font-size: .9rem; color: #8B7BC8; font-weight: 600; }
  .star-badge {
    margin-left: auto;
    background: #FFD93D;
    color: #5A4000;
    font-family: 'Fredoka One', cursive;
    font-size: 1.3rem;
    padding: .3rem .8rem;
    border-radius: 12px;
  }

  /* ── Toast ──────────────────────────────────────────── */
  .toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: #3D2C8D;
    color: #fff;
    font-family: 'Fredoka One', cursive;
    font-size: 1.1rem;
    padding: .8rem 1.8rem;
    border-radius: 50px;
    z-index: 999;
    transition: transform .3s ease;
    white-space: nowrap;
    pointer-events: none;
  }
  .toast.show { transform: translateX(-50%) translateY(0); }

  /* ── Confetti ────────────────────────────────────────── */
  :global(.confetti) {
    position: fixed;
    top: -20px;
    pointer-events: none;
    z-index: 9999;
    animation: fall 2s ease forwards;
  }

  /* ── Animations ─────────────────────────────────────── */
  @keyframes wiggle {
    0%,100% { transform: rotate(-5deg); }
    50%      { transform: rotate(5deg); }
  }
  @keyframes bounceIn {
    0%   { transform: scale(.7); opacity: 0; }
    70%  { transform: scale(1.05); }
    100% { transform: scale(1);   opacity: 1; }
  }
  @keyframes bounce {
    from { transform: translateY(0); }
    to   { transform: translateY(-12px); }
  }
  @keyframes fadeSlide {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    from { opacity: 1; }
    to   { opacity: .5; }
  }
  @keyframes fall {
    0%   { transform: translateY(-20px) rotate(0);     opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
</style>