# Ascent TOEIC

A TOEIC learning platform for beginners aiming for a 600+ score in 30 days —
grammar lessons, vocabulary flashcards, listening (via browser text-to-speech),
reading drills, Part 5 practice, mock tests, analytics, and a full 30-day plan.

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
npm run preview   # preview the production build locally
```

## Deploy

### Option A — GitHub Pages
1. Push this repo to GitHub.
2. In `vite.config.js`, set `base: "/YOUR_REPO_NAME/"`.
3. Push to `main` — the included GitHub Actions workflow
   (`.github/workflows/deploy.yml`) builds and deploys automatically.
4. In your repo settings → Pages, set the source to "GitHub Actions".
5. Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`.

### Option B — Vercel / Netlify
Import the GitHub repo directly in either dashboard.
Build command: `npm run build`. Output directory: `dist`.
No extra config needed (`base: "./"` works for both).

## Notes
- Progress (streak, scores, favorites) is stored in memory only and resets on
  page reload. Wiring up `localStorage` or a small backend is a natural next step.
- Listening audio uses the browser's built-in text-to-speech (Web Speech API),
  not recorded audio files.
