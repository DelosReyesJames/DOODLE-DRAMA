# 🎨 Drama Doodles — Svelte

A classroom drawing + drama activity app. Teachers create rooms, students join, draw, and act out prompts.

## Project Structure

```
src/
├── App.svelte              ← Root router (home / teacher / student)
├── main.js                 ← Entry point
└── lib/
    ├── constants.js        ← COLORS, PROMPTS, storage helpers, utils
    ├── Home.svelte         ← Landing screen
    ├── TeacherView.svelte  ← Teacher dashboard (room, prompts, timer, submissions)
    ├── StudentView.svelte  ← Student classroom (join, draw, act)
    ├── DrawCanvas.svelte   ← Drawing canvas with toolbar
    ├── Confetti.svelte     ← Confetti burst animation
    ├── StarRating.svelte   ← ★★★ rating widget
    └── Toast.svelte        ← Slide-up toast notification
```

## Getting Started

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Build for production

```bash
npm run build
npm run preview
```

## How it works

- **Teacher** creates a room → gets a 4-letter code
- **Students** join using the code → see the teacher's current prompt
- Teacher pushes prompts, runs a countdown timer, views submissions, and rates drawings with ★★★
- Students draw on a canvas, submit to teacher, and switch to the "Act It Out" tab to perform

## Notes

- Uses `window.storage` (Claude artifact storage API) for shared room state between teacher and students
- All real-time sync is via polling every 2 seconds
- No backend required — fully client-side
