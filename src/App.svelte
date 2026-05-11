<script>
  import Home from './lib/Home.svelte';
  import TeacherView from './lib/TeacherView.svelte';
  import StudentView from './lib/StudentView.svelte';

  let view = 'home'; // 'home' | 'teacher' | 'student'
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet"/>
</svelte:head>

<style>
  :global(*) { box-sizing: border-box; font-family: 'Nunito', sans-serif; }
  :global(body) { background: #FFF9F0; margin: 0; }

  @keyframes dd-wiggle { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
  @keyframes dd-fall { 0%{transform:translateY(-20px) rotate(0);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
  @keyframes dd-bounceIn { 0%{transform:scale(.7);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
  @keyframes dd-fadeSlide { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
</style>

{#if view === 'home'}
  <Home onTeacher={() => (view = 'teacher')} onStudent={() => (view = 'student')} />
{:else if view === 'teacher'}
  <TeacherView onBack={() => (view = 'home')} />
{:else if view === 'student'}
  <StudentView onBack={() => (view = 'home')} />
{/if}
