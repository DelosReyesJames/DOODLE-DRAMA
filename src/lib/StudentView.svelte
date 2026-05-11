<script>
  import { onDestroy } from 'svelte';
  import { PROMPTS, sget, sset, fmtTimer } from './constants.js';
  import Toast from './Toast.svelte';
  import Confetti from './Confetti.svelte';
  import DrawCanvas from './DrawCanvas.svelte';

  export let onBack;

  // ── Phase ────────────────────────────────────────────────
  let phase = 'join'; // 'join' | 'classroom'
  let roomCode = '';
  let studentName = '';
  let room = null;

  // ── Classroom state ──────────────────────────────────────
  let submitted = false;
  let myRating = null;
  let timerSec = 30;
  let timerRunning = false;
  let currentScreen = 'draw'; // 'draw' | 'act'

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

  // ── Polling / timer refs ─────────────────────────────────
  let pollInterval;
  let timerInterval;
  let timerWasRunning = false;

  // ── Join room ────────────────────────────────────────────
  async function joinRoom() {
    if (!studentName.trim() || !roomCode.trim()) {
      showToast('Enter your name and room code!');
      return;
    }
    const code = roomCode.toUpperCase().trim();
    const r = await sget(`room:${code}`);
    if (!r) { showToast('Room not found! Check the code.'); return; }
    room = r;

    const studs = await sget(`students:${code}`) || [];
    if (!studs.includes(studentName)) {
      await sset(`students:${code}`, [...studs, studentName]);
    }

    phase = 'classroom';
    startPolling(code);
    showToast(`Joined ${r.teacher}'s classroom!`);
  }

  function startPolling(code) {
    pollInterval = setInterval(async () => {
      const r = await sget(`room:${code}`);
      if (!r) return;
      room = r;

      // Sync timer state from teacher
      if (r.timerRunning && !timerWasRunning) {
        timerSec = r.timerSec;
        timerRunning = true;
        timerWasRunning = true;
        startLocalTimer();
      } else if (!r.timerRunning && timerWasRunning) {
        timerRunning = false;
        timerWasRunning = false;
        clearInterval(timerInterval);
      }

      // Check for rating
      const subs = await sget(`subs:${code}`) || [];
      const mine = subs.find(s => s.student === studentName && s.stars);
      if (mine && !myRating) {
        myRating = mine.stars;
        fireConfetti();
        showToast(`Teacher rated you ★${mine.stars}! 🎉`);
      }
    }, 2000);
  }

  function startLocalTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timerSec -= 1;
      if (timerSec <= 0) {
        timerSec = 0;
        clearInterval(timerInterval);
        timerRunning = false;
        timerWasRunning = false;
        showToast("⏰ Time's up!");
      }
    }, 1000);
  }

  // ── Submit doodle ─────────────────────────────────────────
  async function submitDoodle(url) {
    const code = roomCode.toUpperCase().trim();
    const subs = await sget(`subs:${code}`) || [];
    const entry = {
      id: Date.now(),
      student: studentName,
      url,
      stars: 0,
      prompt: room?.prompt?.text || '',
    };
    await sset(`subs:${code}`, [entry, ...subs]);
    submitted = true;
    fireConfetti();
    showToast('🎉 Doodle submitted to teacher!');
    currentScreen = 'act';
  }

  // ── Derived ──────────────────────────────────────────────
  $: timerLabel = fmtTimer(timerSec);
  $: timerUrgent = timerSec <= 5 && timerSec > 0;
  $: prompt = room?.prompt || PROMPTS[0];
  $: codeDisplay = roomCode.toUpperCase();

  onDestroy(() => {
    clearInterval(pollInterval);
    clearInterval(timerInterval);
    clearTimeout(toastTimer);
  });
</script>

<Toast msg={toastMsg} show={toastShow} />
<Confetti active={confettiActive} />

<!-- ── Join ── -->
{#if phase === 'join'}
  <div class="page">
    <div class="row gap mb">
      <button class="back-btn" on:click={onBack}>←</button>
      <h2 class="page-title">🎨 Join Classroom</h2>
    </div>
    <div class="card">
      <p class="label">Your name</p>
      <input bind:value={studentName} placeholder="e.g. Maria" class="input" />

      <p class="label" style="margin-top:1rem">Room code (from your teacher)</p>
      <input
        bind:value={roomCode}
        on:input={() => (roomCode = roomCode.toUpperCase())}
        placeholder="e.g. AB3X"
        maxlength={4}
        class="input code-input"
      />

      <button class="big-btn pink" on:click={joinRoom} style="margin-top:1rem;width:100%">
        🚀 Join Room!
      </button>
    </div>
  </div>

<!-- ── Classroom ── -->
{:else}
  <div class="page">
    <!-- Header -->
    <div class="row gap mb wrap">
      <button class="back-btn" on:click={onBack}>←</button>
      <h2 class="page-title">Hi, {studentName}! 👋</h2>
      <div class="room-badge" style="margin-left:auto">Room {codeDisplay}</div>
    </div>

    <!-- Prompt card -->
    <div class="card prompt-card mb">
      <div class="prompt-tag">TEACHER'S PROMPT</div>
      <div class="prompt-emoji">{prompt.emoji}</div>
      <p class="prompt-text">{prompt.text}</p>
      <p class="prompt-hint">💡 {prompt.hint}</p>
    </div>

    <!-- Timer -->
    <div class="timer-row mb">
      <div class="timer-display" class:urgent={timerUrgent}>{timerLabel}</div>
      <span class="timer-status">
        {timerRunning ? '⏱️ Timer running!' : 'Waiting for teacher to start…'}
      </span>
    </div>

    <!-- Rating received -->
    {#if myRating}
      <div class="card rating-card mb">
        <div style="font-size:2rem">🎉</div>
        <div class="rating-text">
          Teacher rated you {'★'.repeat(myRating)}{'☆'.repeat(3 - myRating)}
        </div>
      </div>
    {/if}

    <!-- Tabs -->
    <div class="tabs mb">
      {#each ['draw', 'act'] as tab}
        <button
          class="tab"
          class:active={currentScreen === tab}
          on:click={() => (currentScreen = tab)}
        >
          {tab === 'draw' ? '✏️ Draw & Submit' : '🎭 Act It Out!'}
        </button>
      {/each}
    </div>

    <!-- Draw tab -->
    {#if currentScreen === 'draw'}
      <DrawCanvas
        onSave={submitDoodle}
        saveLabel={submitted ? '📤 Resubmit Doodle' : '📤 Submit to Teacher!'}
      />
    {/if}

    <!-- Act tab -->
    {#if currentScreen === 'act'}
      <div class="card">
        {#if submitted}
          <div class="act-submitted">
            <div style="font-size:3rem;margin-bottom:.5rem">✅</div>
            <div class="act-title">Doodle submitted! Now act it out!</div>
          </div>
        {:else}
          <div class="act-pending">
            Draw and submit your doodle first, then come here to perform!
          </div>
        {/if}
        <div class="act-prompt">
          <div style="font-size:2rem;margin-bottom:.5rem">{prompt.emoji}</div>
          <p class="act-prompt-text">{prompt.text}</p>
          <p class="act-hint">💡 {prompt.hint}</p>
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
  .card { background:#fff; border-radius:20px; padding:1.25rem; box-shadow:0 4px 20px rgba(61,44,141,.1); }

  .back-btn {
    background:#fff; border:2px solid #E0D7FF; border-radius:50%;
    width:44px; height:44px; font-size:1.2rem; cursor:pointer;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }

  .page-title { font-family:'Fredoka One',cursive; font-size:1.6rem; color:#3D2C8D; margin:0; }

  .room-badge {
    background:#CE93D8; color:#fff; font-family:'Fredoka One',cursive;
    padding:.3rem 1rem; border-radius:12px;
  }

  .label {
    font-weight:700; color:#8B7BC8; font-size:.85rem;
    margin-bottom:.4rem; text-transform:uppercase; letter-spacing:.5px;
  }

  .input {
    width:100%; border:2px solid #E0D7FF; border-radius:12px;
    padding:.7rem 1rem; font-size:1rem; color:#3D2C8D; outline:none;
  }

  .code-input {
    font-size:1.8rem; text-align:center;
    font-family:'Fredoka One',cursive; letter-spacing:8px;
  }

  .big-btn {
    border:none; border-radius:14px; padding:.8rem 1.2rem;
    font-family:'Fredoka One',cursive; font-size:1rem; cursor:pointer; color:#fff;
  }
  .pink  { background:#FF6B9D; }

  /* Prompt */
  .prompt-card { border:3px solid #FFB347; text-align:center; padding:1.5rem; }
  .prompt-tag {
    font-size:.85rem; background:#FFB347; color:#fff;
    font-family:'Fredoka One',cursive; display:inline-block;
    padding:2px 12px; border-radius:20px; margin-bottom:.5rem;
  }
  .prompt-emoji { font-size:3.5rem; }
  .prompt-text  { font-family:'Fredoka One',cursive; font-size:1.3rem; color:#3D2C8D; margin:.5rem 0; }
  .prompt-hint  {
    font-size:.95rem; color:#8B7BC8; font-weight:600;
    background:#F5F0FF; padding:.6rem 1rem; border-radius:10px; margin:0;
  }

  /* Timer */
  .timer-row {
    display:flex; align-items:center; justify-content:center;
    gap:1rem; flex-wrap:wrap;
  }
  .timer-display {
    font-family:'Fredoka One',cursive; font-size:2.5rem;
    color:#3D2C8D; border:3px solid #FFD93D; border-radius:14px; padding:.2rem 1.2rem;
  }
  .timer-display.urgent { color:#FF6B6B; border-color:#FF6B6B; }
  .timer-status { font-size:.9rem; color:#8B7BC8; font-weight:600; }

  /* Rating */
  .rating-card {
    text-align:center;
    background:linear-gradient(135deg,#FFF9D0,#FFFDE8);
    border:3px solid #FFD93D;
  }
  .rating-text { font-family:'Fredoka One',cursive; font-size:1.3rem; color:#3D2C8D; }

  /* Tabs */
  .tabs { display:flex; gap:.5rem; }
  .tab {
    flex:1; background:#F0EDFF; color:#3D2C8D; border:none; border-radius:12px;
    padding:.7rem; font-family:'Fredoka One',cursive; font-size:1rem; cursor:pointer;
  }
  .tab.active { background:#3D2C8D; color:#fff; }

  /* Act screen */
  .act-submitted, .act-pending {
    text-align:center; padding:1rem;
  }
  .act-pending { color:#8B7BC8; font-weight:600; }
  .act-title { font-family:'Fredoka One',cursive; font-size:1.2rem; color:#3D2C8D; }
  .act-prompt {
    text-align:center; padding:1rem; background:#F5F0FF; border-radius:12px; margin-top:1rem;
  }
  .act-prompt-text { font-family:'Fredoka One',cursive; color:#3D2C8D; font-size:1.1rem; margin:.5rem 0 0; }
  .act-hint { color:#8B7BC8; font-weight:600; font-size:.9rem; margin-top:.5rem; }
</style>
