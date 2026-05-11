<script>
  import { onMount } from 'svelte';

  // ── Constants ──────────────────────────────────────────
  const COLORS = [
    '#FF5C8D', '#FF8C42', '#FFD500', '#3DD68C',
    '#38B2F5', '#B97FFF', '#FF6B6B', '#A0A0A0',
    '#FFFFFF', '#1A1030',
  ];

  const CONFETTI_COLORS = ['#FF5C8D', '#FFD500', '#38B2F5', '#3DD68C', '#B97FFF', '#FF8C42'];

  const ACHIEVEMENTS = [
    { name: 'First Star!', emoji: '⭐', req: 1,  desc: 'Complete your first performance' },
    { name: 'Triple Act',  emoji: '🎭', req: 3,  desc: 'Perform 3 drama challenges' },
    { name: 'Show Star',   emoji: '🌟', req: 5,  desc: 'Complete 5 performances' },
    { name: 'Drama Pro',   emoji: '🏆', req: 10, desc: 'Reach 10 performances' },
    { name: 'Superstar',   emoji: '💫', req: 15, desc: 'Reach 15 performances' },
    { name: 'Legend',      emoji: '👑', req: 20, desc: 'Reach 20 performances' },
  ];

  const PROMPTS = [
    { emoji: '🦁', text: 'You are a brave lion protecting your pride!',         hint: 'Roar loudly and walk with your chest up!' },
    { emoji: '🌊', text: 'You are an ocean wave crashing on the beach!',        hint: 'Move your arms like flowing water.' },
    { emoji: '🤖', text: 'You are a robot who just learned to dance!',          hint: 'Move stiff and jerky — beep boop!' },
    { emoji: '🦋', text: 'You just hatched from your cocoon as a butterfly!',   hint: 'Slowly spread your wings for the first time.' },
    { emoji: '🌋', text: 'You are a volcano about to erupt!',                   hint: 'Build up slowly… then EXPLODE with energy!' },
    { emoji: '🧙', text: 'You are a wizard casting a powerful spell!',          hint: 'Wave your wand and say the magic words!' },
    { emoji: '🐢', text: 'You are a turtle in a hurry!',                        hint: 'Move as fast as you can… slowly!' },
    { emoji: '🌺', text: 'You are a flower blooming in the morning sun!',       hint: 'Start curled up, then slowly open up tall.' },
    { emoji: '🎪', text: 'You are a circus juggler who keeps dropping things!', hint: 'Mime juggling — and act surprised each drop!' },
    { emoji: '🌩️', text: 'You are a thunderstorm rolling over mountains!',      hint: 'Be the wind, the lightning, and the rain!' },
    { emoji: '🐬', text: 'You are a dolphin leaping through the waves!',        hint: 'Jump, spin, and make happy dolphin sounds!' },
    { emoji: '🍕', text: 'You are a pizza being made from scratch!',            hint: 'Start as dough being tossed, then get toppings!' },
    { emoji: '🦸', text: 'You are a superhero who just discovered their power!',hint: 'React with surprise, then try your power out!' },
    { emoji: '🧸', text: 'You are a teddy bear who comes to life at night!',    hint: 'Slowly wake up and look around in amazement!' },
    { emoji: '🎵', text: 'You are a song that gets faster and faster!',         hint: 'Start slow and quiet, speed up to the end!' },
  ];

  const MILESTONE_MAP = { 1: 'First Star! ⭐', 3: 'Triple Act 🎭', 5: 'Show Star 🌟', 10: 'Drama Pro 🏆', 15: 'Superstar 💫', 20: 'Legend 👑' };

  // ── State ──────────────────────────────────────────────
  let screen = 'home'; // 'home' | 'draw' | 'act' | 'gallery' | 'stars'

  // Drawing
  let canvas;
  let ctx;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let currentColor = '#FF5C8D';
  let brushSize = 6;
  let tool = 'draw'; // 'draw' | 'erase'

  // Gallery / Stars
  let savedDoodles = [];
  let totalStars = 0;

  // Prompts
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

  // ── Lifecycle ──────────────────────────────────────────
  onMount(() => {
    try {
      savedDoodles = JSON.parse(localStorage.getItem('dd_doodles') || '[]');
      totalStars   = parseInt(localStorage.getItem('dd_stars') || '0', 10);
    } catch (_) {
      savedDoodles = [];
      totalStars = 0;
    }
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
    setTimeout(() => {
      if (!canvas) return;
      ctx = canvas.getContext('2d');
    }, 50);
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const p = getPos(e);
    lastX = p.x;
    lastY = p.y;
  }

  function onDraw(e) {
    e.preventDefault();
    if (!isDrawing || !ctx) return;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = tool === 'erase' ? '#F5F0FF' : currentColor;
    ctx.lineWidth   = tool === 'erase' ? brushSize * 3 : brushSize;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
    lastX = p.x;
    lastY = p.y;
  }

  function stopDraw() {
    isDrawing = false;
  }

  function clearCanvas() {
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function saveToGallery() {
    if (!canvas) return;
    const blank = document.createElement('canvas');
    blank.width  = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      showToast('✏️ Draw something first!');
      return;
    }
    const entry = {
      id:   Date.now(),
      url:  canvas.toDataURL(),
      date: new Date().toLocaleDateString(),
    };
    savedDoodles = [entry, ...savedDoodles].slice(0, 20);
    try { localStorage.setItem('dd_doodles', JSON.stringify(savedDoodles)); } catch (_) {}
    showToast('🎉 Saved to Gallery!');
    spawnConfetti();
  }

  function setColor(c) {
    currentColor = c;
    tool = 'draw';
  }

  // ── Prompts ────────────────────────────────────────────
  function randomPrompt() {
    let next;
    do {
      next = Math.floor(Math.random() * PROMPTS.length);
    } while (next === promptIdx && PROMPTS.length > 1);
    promptIdx = next;
    resetTimer();
  }

  // ── Timer ──────────────────────────────────────────────
  function toggleTimer() {
    timerRunning ? stopTimer() : startTimer();
  }

  function startTimer() {
    timerRunning = true;
    timerInterval = setInterval(() => {
      timerSeconds -= 1;
      if (timerSeconds <= 0) {
        stopTimer();
        showToast("⏰ Time's up! Great job!");
      }
    }, 1000);
  }

  function stopTimer() {
    timerRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function resetTimer() {
    stopTimer();
    timerSeconds = 30;
  }

  // ── Stars ──────────────────────────────────────────────
  function earnStar() {
    totalStars += 1;
    try { localStorage.setItem('dd_stars', String(totalStars)); } catch (_) {}
    const label = MILESTONE_MAP[totalStars];
    showToast(label ? `🏆 Achievement: ${label}` : `⭐ Star earned! Total: ${totalStars}`);
    spawnConfetti();
    randomPrompt();
  }

  // ── Toast ──────────────────────────────────────────────
  function showToast(msg) {
    toastMsg = msg;
    toastVisible = true;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toastVisible = false; }, 2500);
  }

  // ── Confetti ───────────────────────────────────────────
  function spawnConfetti() {
    const batch = Array.from({ length: 30 }, (_, i) => ({
      id:       Date.now() + i,
      x:        Math.random() * 100,
      color:    CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size:     8 + Math.random() * 8,
      round:    Math.random() > 0.5,
      delay:    Math.random() * 0.5,
      duration: 1.5 + Math.random(),
    }));
    confettiParticles = [...confettiParticles, ...batch];
    setTimeout(() => {
      const ids = new Set(batch.map(p => p.id));
      confettiParticles = confettiParticles.filter(p => !ids.has(p.id));
    }, 3000);
  }

  // ── View doodle ────────────────────────────────────────
  function viewDoodle(url) {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      `<html><body style="margin:0;background:#1E1433;display:flex;align-items:center;` +
      `justify-content:center;min-height:100vh">` +
      `<img src="${url}" style="max-width:100%;border-radius:12px;"></body></html>`
    );
    w.document.close();
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
      border-radius:{p.round ? '50%' : '3px'};
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
      <button class="menu-btn draw"      on:click={() => goto('draw')}>
        <span class="btn-icon">✏️</span>Let's Draw!
      </button>
      <button class="menu-btn act"       on:click={() => goto('act')}>
        <span class="btn-icon">🎭</span>Time to Act!
      </button>
      <button class="menu-btn gallery"   on:click={() => goto('gallery')}>
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
        {#each COLORS as c (c)}
          <button
            class="color-dot"
            class:active={currentColor === c && tool === 'draw'}
            style="background:{c};{c === '#FFFFFF' ? 'border-color:#666;' : ''}"
            aria-label="Color {c}"
            on:click={() => setColor(c)}
          ></button>
        {/each}
        <input
          type="range"
          min="2"
          max="30"
          class="size-slider"
          aria-label="Brush size"
          bind:value={brushSize}
        />
        <button class="tool-btn" class:active={tool === 'draw'}  on:click={() => (tool = 'draw')}>✏️ Draw</button>
        <button class="tool-btn" class:active={tool === 'erase'} on:click={() => (tool = 'erase')}>🧹 Erase</button>
      </div>

      <div class="action-row">
        <button class="big-btn red-btn"   on:click={clearCanvas}>🗑️ Clear</button>
        <button class="big-btn pink-btn"  on:click={saveToGallery}>💾 Save to Gallery</button>
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
      <button class="big-btn pink-btn timer-btn" on:click={toggleTimer}>
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
            <img src={d.url} alt="Saved doodle from {d.date}" />
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

    {#each ACHIEVEMENTS as a (a.req)}
      <div class="star-card" class:locked={totalStars < a.req}>
        <span class="star-icon">{a.emoji}</span>
        <div class="star-info">
          <div class="star-label">{a.name}</div>
          <div class="star-count">{a.desc} · Need {a.req} ⭐</div>
        </div>
        <span class="star-badge">{totalStars >= a.req ? '✅' : '🔒'}</span>
      </div>
    {/each}
  </main>
{/if}

<style>
  /* ── Google Fonts are loaded via <svelte:head> ──────── */

  /* ── Reset ──────────────────────────────────────────── */
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: 'Nunito', sans-serif;
    background: #1E1433;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Subtle ambient glow on the body */
  :global(body)::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(circle at 10% 20%, rgba(200, 100, 230, .10) 0%, transparent 45%),
      radial-gradient(circle at 90% 10%, rgba(80,  180, 255, .08) 0%, transparent 45%),
      radial-gradient(circle at 50% 90%, rgba(60,  210, 140, .07) 0%, transparent 45%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Layout base ────────────────────────────────────── */
  .home,
  .page {
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
  .logo-area {
    margin-bottom: 2rem;
    animation: bounceIn .8s ease both;
  }

  .logo-emoji {
    font-size: 4.5rem;
    display: block;
    animation: wiggle 3s ease-in-out infinite;
  }

  .logo-title {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(2.2rem, 7vw, 4rem);
    background: linear-gradient(135deg, #FF79B0, #D8A7FF, #5DD9FF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.1;
  }

  .logo-subtitle {
    font-size: 1rem;
    color: #B09FD8;
    font-weight: 700;
    margin-top: .4rem;
  }

  .menu-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    width: 100%;
    max-width: 400px;
  }

  .menu-btn {
    background: #2D1F4A;
    border: 2px solid transparent;
    border-radius: 18px;
    padding: 1.4rem 1rem;
    cursor: pointer;
    transition: transform .2s, box-shadow .2s;
    font-family: 'Fredoka One', cursive;
    font-size: 1rem;
    color: #EDE0FF;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .4rem;
  }
  .menu-btn:hover {
    transform: translateY(-4px) scale(1.03);
    box-shadow: 0 8px 24px rgba(0, 0, 0, .35);
  }
  .menu-btn .btn-icon { font-size: 2.2rem; }

  .menu-btn.draw      { border-color: #D94F8A; }
  .menu-btn.act       { border-color: #E8832A; }
  .menu-btn.gallery   { border-color: #2A9BD4; }
  .menu-btn.stars-btn { border-color: #C9980A; }

  /* ── Screen header ──────────────────────────────────── */
  .screen-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .back-btn {
    background: #2D1F4A;
    border: 2px solid #4D3770;
    border-radius: 50%;
    width: 42px;
    height: 42px;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #D0BFFF;
    transition: background .2s, border-color .2s, color .2s;
    flex-shrink: 0;
  }
  .back-btn:hover {
    background: #7C3ABE;
    border-color: #9D5CE0;
    color: #fff;
  }

  .screen-title {
    font-family: 'Fredoka One', cursive;
    font-size: 1.7rem;
    color: #EDE0FF;
  }

  /* ── Canvas wrap ────────────────────────────────────── */
  .canvas-wrap {
    background: #251840;
    border-radius: 18px;
    border: 2px solid #3D2860;
    padding: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: .85rem;
  }

  canvas {
    width: 100%;
    border-radius: 10px;
    cursor: crosshair;
    background: #F5F0FF;
    border: 2px dashed #5E3D90;
    touch-action: none;
    display: block;
  }

  /* ── Tool row ───────────────────────────────────────── */
  .tool-row {
    display: flex;
    gap: .4rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .color-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    border: 3px solid transparent;
    transition: transform .15s;
    flex-shrink: 0;
  }
  .color-dot.active {
    border-color: #fff;
    transform: scale(1.25);
  }
  .color-dot:hover { transform: scale(1.15); }

  .size-slider {
    -webkit-appearance: none;
    width: 70px;
    height: 5px;
    border-radius: 3px;
    background: #4D3770;
    cursor: pointer;
  }
  .size-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #A855F7;
    cursor: pointer;
  }
  .size-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #A855F7;
    cursor: pointer;
    border: none;
  }

  .tool-btn {
    background: #2D1F4A;
    border: 2px solid #4D3770;
    border-radius: 8px;
    padding: .35rem .8rem;
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: .8rem;
    cursor: pointer;
    color: #C4ADFF;
    transition: background .2s, color .2s, border-color .2s;
  }
  .tool-btn.active,
  .tool-btn:hover {
    background: #6B30B8;
    color: #fff;
    border-color: #9D5CE0;
  }

  /* ── Action row ─────────────────────────────────────── */
  .action-row {
    display: flex;
    gap: .7rem;
    flex-wrap: wrap;
  }

  .big-btn {
    flex: 1;
    min-width: 110px;
    border: none;
    border-radius: 12px;
    padding: .75rem 1rem;
    font-family: 'Fredoka One', cursive;
    font-size: 1rem;
    cursor: pointer;
    color: #fff;
    transition: transform .2s, box-shadow .2s;
  }
  .big-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, .4);
  }

  .red-btn    { background: #C0364A; flex: 0 0 auto; min-width: 80px; }
  .pink-btn   { background: #C0366B; }
  .green-btn  { background: #1E8F5A; }
  .purple-btn { background: #6B30B8; }

  .timer-btn  { flex: 0 0 auto; min-width: 130px; }

  /* ── Act / Prompt card ──────────────────────────────── */
  .prompt-card {
    background: #251840;
    border: 2px solid #E8832A;
    border-radius: 22px;
    padding: 1.75rem;
    text-align: center;
    margin: .75rem 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .9rem;
    animation: fadeSlide .4s ease both;
  }

  .prompt-emoji {
    font-size: 4.5rem;
    animation: bounce 1s ease infinite alternate;
    line-height: 1;
  }

  .prompt-label {
    background: #7C3D0A;
    color: #FFB347;
    font-family: 'Fredoka One', cursive;
    padding: .25rem .9rem;
    border-radius: 20px;
    font-size: .85rem;
    border: 1px solid #E8832A;
  }

  .prompt-text {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(1.2rem, 4vw, 1.7rem);
    color: #EDE0FF;
    line-height: 1.3;
  }

  .prompt-hint {
    font-size: .9rem;
    color: #B09FD8;
    font-weight: 600;
    padding: .65rem 1rem;
    background: #1E1433;
    border-radius: 10px;
    border: 1px solid #3D2860;
    width: 100%;
  }

  /* ── Timer ──────────────────────────────────────────── */
  .timer-area {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin: .4rem 0;
  }

  .timer-display {
    font-family: 'Fredoka One', cursive;
    font-size: 2.8rem;
    color: #EDE0FF;
    background: #251840;
    border: 2px solid #C9980A;
    border-radius: 14px;
    padding: .25rem 1.3rem;
    min-width: 120px;
    text-align: center;
  }
  .timer-display.warning {
    border-color: #C0364A;
    color: #FF7A8A;
    animation: pulse .5s ease infinite alternate;
  }

  /* ── Gallery ────────────────────────────────────────── */
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: .85rem;
    margin-top: .85rem;
  }

  .gallery-item {
    background: #251840;
    border: 2px solid #3D2860;
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: transform .2s, border-color .2s;
    padding: 0;
    text-align: left;
  }
  .gallery-item:hover {
    transform: translateY(-4px);
    border-color: #9D5CE0;
  }
  .gallery-item img {
    width: 100%;
    display: block;
  }
  .item-label {
    padding: .4rem;
    font-weight: 700;
    font-size: .75rem;
    color: #B09FD8;
    text-align: center;
  }

  .empty-gallery {
    text-align: center;
    padding: 3rem 1rem;
    color: #6B5690;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.8;
  }
  .empty-gallery span {
    font-size: 3.5rem;
    display: block;
    margin-bottom: 1rem;
  }

  /* ── Stars ──────────────────────────────────────────── */
  .total-stars-card {
    text-align: center;
    font-family: 'Fredoka One', cursive;
    font-size: 1.8rem;
    color: #EDE0FF;
    background: #2A1D00;
    border: 2px solid #C9980A;
    border-radius: 18px;
    padding: 1.3rem;
    margin-bottom: 1.2rem;
  }

  .big-num {
    font-size: 3.5rem;
    display: block;
    line-height: 1;
    color: #FFBF00;
  }

  .star-card {
    background: #251840;
    border-radius: 16px;
    padding: 1rem 1.25rem;
    margin-bottom: .75rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    border-left: 4px solid #C9980A;
    transition: opacity .3s, filter .3s;
  }
  .star-card.locked {
    opacity: .35;
    filter: grayscale(1);
  }

  .star-icon { font-size: 2.2rem; flex-shrink: 0; }

  .star-info { flex: 1; min-width: 0; }

  .star-label {
    font-family: 'Fredoka One', cursive;
    font-size: 1rem;
    color: #EDE0FF;
  }
  .star-count {
    font-size: .8rem;
    color: #8070AA;
    font-weight: 600;
  }

  .star-badge {
    margin-left: auto;
    background: #2A1D00;
    color: #FFBF00;
    font-family: 'Fredoka One', cursive;
    font-size: 1.1rem;
    padding: .25rem .7rem;
    border-radius: 10px;
    border: 1px solid #C9980A;
    flex-shrink: 0;
  }

  /* ── Toast ──────────────────────────────────────────── */
  .toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(120px);
    background: #3D1166;
    color: #EDE0FF;
    font-family: 'Fredoka One', cursive;
    font-size: 1rem;
    padding: .65rem 1.5rem;
    border-radius: 50px;
    z-index: 999;
    transition: transform .3s ease;
    white-space: nowrap;
    pointer-events: none;
    border: 1px solid #7C3ABE;
  }
  .toast.show { transform: translateX(-50%) translateY(0); }

  /* ── Confetti ────────────────────────────────────────── */
  :global(.confetti) {
    position: fixed;
    top: -20px;
    pointer-events: none;
    z-index: 9999;
    animation: fall linear forwards;
  }

  /* ── Keyframes ──────────────────────────────────────── */
  @keyframes wiggle {
    0%, 100% { transform: rotate(-5deg); }
    50%       { transform: rotate(5deg); }
  }

  @keyframes bounceIn {
    0%   { transform: scale(.7); opacity: 0; }
    70%  { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1); }
  }

  @keyframes bounce {
    from { transform: translateY(0); }
    to   { transform: translateY(-10px); }
  }

  @keyframes fadeSlide {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse {
    from { opacity: 1; }
    to   { opacity: .45; }
  }

  @keyframes fall {
    0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
</style>