<script>
  export let onTeacher;
  export let onStudent;
</script>

<div class="home">
  <div class="bounce-in">
    <span class="wiggle">🎨</span>
    <h1 class="title">Drama Doodles</h1>
    <p class="subtitle">Draw it · Act it · Be it!</p>
  </div>

  <div class="buttons">
    <button class="role-btn teacher" on:click={onTeacher}>
      <span class="role-icon">🎓</span> I'm a Teacher
    </button>
    <button class="role-btn student" on:click={onStudent}>
      <span class="role-icon">🎨</span> I'm a Student
    </button>
  </div>

  <p class="hint">
    Teacher creates a room → Students join with the code → Draw &amp; perform!
  </p>
</div>

<style>
  .home {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    background: #FFF9F0;
  }

  .bounce-in { animation: dd-bounceIn .8s ease; }

  .wiggle {
    font-size: 5rem;
    display: block;
    animation: dd-wiggle 3s ease-in-out infinite;
  }

  .title {
    font-family: 'Fredoka One', cursive;
    font-size: clamp(2.5rem, 8vw, 4rem);
    background: linear-gradient(135deg, #FF6B9D, #CE93D8, #4FC3F7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.1;
    margin: 0;
  }

  .subtitle {
    color: #8B7BC8;
    font-weight: 700;
    font-size: 1.1rem;
    margin-top: .5rem;
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 360px;
    margin-top: 2rem;
  }

  .role-btn {
    background: #fff;
    border-radius: 20px;
    padding: 1.5rem;
    cursor: pointer;
    font-family: 'Fredoka One', cursive;
    font-size: 1.3rem;
    box-shadow: 0 4px 20px rgba(61,44,141,.15);
    transition: transform .2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  .role-btn:hover { transform: translateY(-3px); }

  .teacher { border: 3px solid #3D2C8D; color: #3D2C8D; }
  .student  { border: 3px solid #FF6B9D; color: #FF6B9D; }

  .role-icon { font-size: 2rem; }

  .hint {
    color: #B0A8D8;
    font-size: .85rem;
    margin-top: 1.5rem;
    font-weight: 600;
  }
</style>
