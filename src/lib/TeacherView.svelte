<script>
  import { onDestroy } from 'svelte';
  import { PROMPTS, sget, sset, makeCode, fmtTimer } from './constants.js';
  import Toast from './Toast.svelte';
  import Confetti from './Confetti.svelte';
  import StarRating from './StarRating.svelte';

  export let onBack;

  // ── Phase ────────────────────────────────────────────────
  let phase = 'setup'; // 'setup' | 'dashboard'
  let roomCode = '';
  let teacherName = '';

  // ── Dashboard state ──────────────────────────────────────
  let activePromptIdx = 0;
  let submissions = [];
  let students = [];
  let timerSec = 30;
  let timerRunning = false;
  let selected = null;

  // ── Toast / Confetti ─────────────────────────────────────
  let toastMsg = '';
  let toastShow = false;
  let confettiActive = false;
  let toastTimer;

  function showToast(msg) {
    toastMsg = msg;
    toastShow = true;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastShow = false), 2500);
  }

  function fireConfetti() {
    confettiActive = true;
    setTimeout(() => (confettiActive = false), 100);
  }

  // ── Polling / Timer refs ─────────────────────────────────
  let pollInterval;
  let timerInterval;

  // ── Create room ──────────────────────────────────────────
  async function createRoom() {
    if (!teacherName.trim()) { showToast('Enter your name first!'); return; }
    const code = makeCode();
    roomCode = code;
    const room = {
      code, teacher: teacherName,
      prompt: PROMPTS[0], promptIdx: 0,
      timerSec: 30, timerRunning: false,
      createdAt: Date.now(),
    };
    await sset(`room:${code}`, room);
    await sset(`subs:${code}`, []);
    await sset(`students:${code}`, []);
    phase = 'dashboard';
    startPolling(code);
    showToast(`Room ${code} created!`);
  }

  function startPolling(code) {
    pollInterval = setInterval(async () => {
      const subs = await sget(`subs:${code}`) || [];
      const studs = await sget(`students:${code}`) || [];
      submissions = subs;
      students = studs;
    }, 2000);
  }

  // ── Prompt control ───────────────────────────────────────
  async function pushPrompt(idx) {
    activePromptIdx = idx;
    const room = await sget(`room:${roomCode}`);
    if (room) {
      room.prompt = PROMPTS[idx];
      room.promptIdx = idx;
      room.timerSec = 30;
      room.timerRunning = false;
      await sset(`room:${roomCode}`, room);
    }
    resetTimer();
    showToast('Prompt pushed to all students!');
  }

  function randomPrompt() {
    pushPrompt(Math.floor(Math.random() * PROMPTS.length));
  }

  // ── Timer ────────────────────────────────────────────────
  async function startTimer() {
    timerRunning = true;
    const room = await sget(`room:${roomCode}`);
    if (room) { room.timerRunning = true; room.timerSec = timerSec; await sset(`room:${roomCode}`, room); }

    timerInterval = setInterval(async () => {
      timerSec -= 1;
      if (timerSec <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        timerSec = 0;
        showToast("⏰ Time's up!");
        const r = await sget(`room:${roomCode}`);
        if (r) { r.timerRunning = false; r.timerSec = 0; await sset(`room:${roomCode}`, r); }
        return;
      }
      if (timerSec % 5 === 0) {
        const r = await sget(`room:${roomCode}`);
        if (r) { r.timerSec = timerSec; await sset(`room:${roomCode}`, r); }
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
  }

  function resetTimer() {
    stopTimer();
    timerSec = 30;
  }

  // ── Rate submission ──────────────────────────────────────
  async function rateSubmission(subId, stars) {
    const subs = await sget(`subs:${roomCode}`) || [];
    const updated = subs.map(s => s.id === subId ? { ...s, stars } : s);
    await sset(`subs:${roomCode}`, updated);
    submissions = updated;
    fireConfetti();
    showToast(`Rated ★ ${stars}! Student notified.`);
    if (selected?.id === subId) selected = { ...selected, stars };
  }

  async function clearRoom() {
    if (!confirm('Clear all submissions?')) return;
    await sset(`subs:${roomCode}`, []);
    submissions = [];
    showToast('Submissions cleared.');
  }

  // ── Derived ──────────────────────────────────────────────
  $: timerLabel = fmtTimer(timerSec);
  $: timerUrgent = timerSec <= 5 && timerSec > 0;
  $: rated = submissions.filter(s => s.stars);
  $: avgRating = rated.length
    ? (rated.reduce((a, b) => a + b.stars, 0) / rated.length).toFixed(1)
    : '—';

  onDestroy(() => {
    clearInterval(pollInterval);
    clearInterval(timerInterval);
    clearTimeout(toastTimer);
  });
</script>

<Toast msg={toastMsg} show={toastShow} />
<Confetti active={confettiActive} />

<!-- ── Setup ── -->
{#if phase === 'setup'}
  <div class="page">
    <div class="row gap mb">
      <button class="back-btn" on:click={onBack}>←</button>
      <h2 class="page-title">🎓 Teacher Setup</h2>
    </div>
    <div class="card">
      <p class="label">Your name</p>
      <input bind:value={teacherName} placeholder="e.g. Ms. Santos" class="input" />
      <button class="big-btn purple" on:click={createRoom} style="margin-top:1rem;width:100%">
        🏫 Create Classroom Room
      </button>
    </div>
  </div>

<!-- ── Dashboard ── -->
{:else}
  <div class="page">
    <!-- Header -->
    <div class="row gap mb wrap">
      <button class="back-btn" on:click={onBack}>←</button>
      <h2 class="page-title">🎓 Teacher Dashboard</h2>
      <div class="room-badge" style="margin-left:auto">Room: {roomCode}</div>
    </div>

    <!-- Stats grid -->
    <div class="grid-2 mb">
      {#each [
        { label:'Students joined', val:students.length, icon:'👥' },
        { label:'Submissions', val:submissions.length, icon:'🎨' },
        { label:'Rated', val:rated.length, icon:'⭐' },
        { label:'Avg rating', val:avgRating, icon:'📊' },
      ] as s}
        <div class="card stat-card">
          <div class="stat-icon">{s.icon}</div>
          <div class="stat-val">{s.val}</div>
          <div class="stat-label">{s.label}</div>
        </div>
      {/each}
    </div>

    <div class="grid-2">
      <!-- Left column -->
      <div class="col-stack">
        <!-- Active prompt -->
        <div class="card">
          <p class="label">Active prompt</p>
          <div class="prompt-emoji">{PROMPTS[activePromptIdx].emoji}</div>
          <p class="prompt-text">{PROMPTS[activePromptIdx].text}</p>
          <button class="big-btn purple" on:click={randomPrompt}>🎲 Random Prompt</button>

          <p class="label2">Pick a prompt:</p>
          <div class="prompt-pills">
            {#each PROMPTS as p, i}
              <button
                class="pill"
                class:active={activePromptIdx === i}
                on:click={() => pushPrompt(i)}
              >{p.emoji}</button>
            {/each}
          </div>
        </div>

        <!-- Timer -->
        <div class="card">
          <p class="label">Class timer</p>
          <div class="timer-display" class:urgent={timerUrgent}>{timerLabel}</div>
          <div class="row gap">
            <button class="big-btn" style="background:{timerRunning?'#FF6B6B':'#FF6B9D'}"
              on:click={timerRunning ? stopTimer : startTimer}>
              {timerRunning ? '⏸️ Pause' : '▶️ Start'}
            </button>
            <button class="big-btn gray" style="flex:0 0 auto;min-width:80px" on:click={resetTimer}>↺ Reset</button>
          </div>
        </div>

        <!-- Students -->
        <div class="card">
          <p class="label">Students ({students.length})</p>
          {#if students.length === 0}
            <p class="muted">Waiting for students to join… Share room code <strong>{roomCode}</strong></p>
          {:else}
            <div class="student-chips">
              {#each students as s}
                <span class="chip">🧒 {s}</span>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Right: submissions -->
      <div class="card">
        <div class="row" style="margin-bottom:.75rem">
          <p class="label" style="margin:0">Submissions ({submissions.length})</p>
          <button class="clear-btn" on:click={clearRoom}>Clear all</button>
        </div>

        {#if submissions.length === 0}
          <div class="empty">
            <div style="font-size:3rem">🖼️</div>
            No submissions yet
          </div>
        {:else}
          <div class="sub-list">
            {#each submissions as sub (sub.id)}
              <div class="sub-card">
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                <img src={sub.url} alt="doodle" class="sub-img" on:click={() => (selected = sub)} />
                <div class="sub-footer">
                  <span class="sub-name">🧒 {sub.student}</span>
                  <StarRating value={sub.stars || 0} onChange={(s) => rateSubmission(sub.id, s)} />
                  {#if sub.stars}<span class="sub-stars">★{sub.stars}</span>{/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Lightbox -->
    {#if selected}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="lightbox-overlay" on:click={() => (selected = null)}>
        <div class="lightbox-inner" on:click|stopPropagation>
          <img src={selected.url} alt="doodle" style="width:100%;display:block" />
          <div class="lightbox-footer">
            <span class="sub-name" style="flex:1">🧒 {selected.student}</span>
            <StarRating value={selected.stars || 0} onChange={(s) => rateSubmission(selected.id, s)} />
            <button class="close-btn" on:click={() => (selected = null)}>✕ Close</button>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .page { min-height:100vh; padding:1rem; max-width:900px; margin:0 auto; background:#FFF9F0; }
  .row { display:flex; align-items:center; }
  .row.gap { gap:1rem; }
  .row.wrap { flex-wrap:wrap; }
  .mb { margin-bottom:1rem; }
  .col-stack { display:flex; flex-direction:column; gap:1rem; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem; }
  .card { background:#fff; border-radius:20px; padding:1.25rem; box-shadow:0 4px 20px rgba(61,44,141,.1); }

  .back-btn {
    background:#fff; border:2px solid #E0D7FF; border-radius:50%;
    width:44px; height:44px; font-size:1.2rem; cursor:pointer;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }

  .page-title { font-family:'Fredoka One',cursive; font-size:1.6rem; color:#3D2C8D; margin:0; }

  .room-badge {
    background:#3D2C8D; color:#fff; font-family:'Fredoka One',cursive;
    font-size:1.4rem; padding:.3rem 1.2rem; border-radius:12px;
  }

  .label {
    font-weight:700; color:#8B7BC8; font-size:.85rem;
    margin-bottom:.4rem; text-transform:uppercase; letter-spacing:.5px;
  }
  .label2 {
    font-weight:700; color:#8B7BC8; font-size:.8rem;
    margin:.75rem 0 .4rem; text-transform:uppercase; letter-spacing:.5px;
  }

  .input {
    width:100%; border:2px solid #E0D7FF; border-radius:12px;
    padding:.7rem 1rem; font-size:1rem; color:#3D2C8D; outline:none;
  }

  .big-btn {
    border:none; border-radius:14px; padding:.8rem 1.2rem;
    font-family:'Fredoka One',cursive; font-size:1rem;
    cursor:pointer; color:#fff; width:100%;
  }
  .purple { background:#3D2C8D; }
  .gray   { background:#888; }

  /* Stats */
  .stat-card { text-align:center; padding:1rem; }
  .stat-icon { font-size:1.8rem; }
  .stat-val  { font-family:'Fredoka One',cursive; font-size:1.8rem; color:#3D2C8D; }
  .stat-label{ font-size:.8rem; color:#8B7BC8; font-weight:600; }

  /* Prompt */
  .prompt-emoji { font-size:2.5rem; text-align:center; }
  .prompt-text  { font-family:'Fredoka One',cursive; font-size:1rem; color:#3D2C8D; text-align:center; margin:.5rem 0; }

  .prompt-pills { display:flex; flex-wrap:wrap; gap:6px; max-height:120px; overflow-y:auto; }
  .pill {
    background:#F0EDFF; color:#3D2C8D; border:none; border-radius:8px;
    padding:4px 10px; font-size:.8rem; cursor:pointer; font-weight:600;
  }
  .pill.active { background:#3D2C8D; color:#fff; }

  /* Timer */
  .timer-display {
    font-family:'Fredoka One',cursive; font-size:3rem; text-align:center;
    color:#3D2C8D; border:3px solid #FFD93D; border-radius:16px;
    padding:.2rem 1rem; margin:.5rem 0;
  }
  .timer-display.urgent { color:#FF6B6B; border-color:#FF6B6B; }

  /* Students */
  .muted  { color:#8B7BC8; font-size:.9rem; font-weight:600; }
  .student-chips { display:flex; flex-wrap:wrap; gap:6px; }
  .chip { background:#F0EDFF; color:#3D2C8D; padding:4px 10px; border-radius:20px; font-size:.85rem; font-weight:700; }

  /* Submissions */
  .clear-btn { margin-left:auto; background:none; border:none; cursor:pointer; color:#FF6B6B; font-weight:700; font-size:.8rem; }
  .empty { text-align:center; padding:2rem; color:#A09BC8; font-weight:600; }
  .sub-list { display:flex; flex-direction:column; gap:1rem; max-height:420px; overflow-y:auto; }
  .sub-card { border:2px solid #E0D7FF; border-radius:12px; overflow:hidden; }
  .sub-img  { width:100%; display:block; cursor:pointer; }
  .sub-footer { padding:8px 10px; display:flex; align-items:center; gap:8px; }
  .sub-name  { font-weight:700; font-size:.9rem; color:#3D2C8D; flex:1; }
  .sub-stars { font-size:.8rem; color:#8B7BC8; }

  /* Lightbox */
  .lightbox-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,.7); z-index:100;
    display:flex; align-items:center; justify-content:center; padding:1rem;
  }
  .lightbox-inner { background:#fff; border-radius:20px; overflow:hidden; max-width:600px; width:100%; }
  .lightbox-footer { padding:1rem; display:flex; align-items:center; gap:12px; }
  .close-btn { background:#FF6B6B; color:#fff; border:none; border-radius:10px; padding:6px 14px; cursor:pointer; font-weight:700; }
</style>
