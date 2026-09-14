# UIL CS League

A Duolingo-style study app built from 20 real UIL Computer Science Written Test
practice exams (District / Invitational / Region / State — 2018 through 2026),
800 questions total. Single-user, no login.

## How it works

- **Units** = the 20 practice tests, ordered easiest → hardest (Invitational →
  District → Region → State). Finish a unit (see all 40 of its questions once)
  to unlock the next one, same as a Duolingo skill path.
- **Today's lesson** mixes new questions from your current unit with questions
  you've gotten wrong before, due for review.
- **Spaced repetition**: every question you answer moves through a 6-box
  Leitner system (1 → 2 → 4 → 7 → 14 → 30 day intervals). Get it right and it
  comes back later and later; get it wrong and it resets to the front of the
  line for tomorrow.
- **XP, gems, streak, hearts** work like Duolingo: +10 XP per correct answer,
  +2 for a wrong one, a perfect-lesson bonus, gems per lesson, a day streak
  with one free "streak freeze" that regenerates every 10 lessons.
- Each question is shown as an **image crop** taken directly from the original
  PDF, so code snippets, math notation, and formatting all render exactly as
  printed — nothing was retyped by hand.
- A couple of questions per test are free-response (fill-in-the-blank)
  instead of multiple choice, exactly like the real contest. There's an
  "I was actually right" override for the rare case where the official key
  lists an alternate acceptable answer your typed answer doesn't string-match.

## Running it locally

```bash
npm install
npm run dev
```

Open the printed localhost URL. Progress saves to your browser automatically
(no setup required) — see "Cloud sync" below if you want it to follow you
across devices.

## Deploying (GitHub Pages)

This repo includes a ready-made GitHub Actions workflow
(`.github/workflows/deploy.yml`) that builds and publishes the site on every
push to `main` — you never need to run `npm run build` yourself.

1. Push/upload this project to a GitHub repo.
2. In the repo, go to **Settings → Pages**, and under "Build and deployment"
   set **Source** to **GitHub Actions**.
3. Push to `main` (or go to the **Actions** tab and run the workflow
   manually). Once the run finishes (green check, ~1–2 minutes), your site is
   live at the URL shown on the Pages settings screen.

The app uses relative asset paths (`base: './'` in `vite.config.ts`), so it
works from any GitHub Pages sub-path with no extra configuration.

## Cloud sync (optional)

By default all progress lives in `localStorage` in your browser — it works
immediately, but won't follow you to a different browser or device.

To sync across devices, connect a free Firestore database:

1. Go to https://console.firebase.google.com — you can reuse an **existing**
   Firebase project (e.g. the same one behind Bridgeland CS Club) or create a
   new one. Reusing one just adds a `progress` collection to it; it won't
   touch anything else in that project.
2. In the project, add a Web App (if you haven't already) and copy its config
   object.
3. Paste that config into `src/lib/firebase.ts`, replacing the empty
   `firebaseConfig = {}` object.
4. In Firestore, make sure a database exists, then set its rules to
   (single-user app, so this just keeps the data away from random crawlers —
   there's no login, so don't reuse this project for anything that needs real
   auth-based security):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /progress/{doc} {
         allow read, write: if true;
       }
     }
   }
   ```

5. Rebuild (`npm run build`) and redeploy. The Settings screen shows a
   "Cloud sync: connected" indicator once it's wired up correctly.

## Regenerating the question bank

`src/manifest.json` plus `public/questions/*.png` are the entire question
bank — question metadata/answers/explanations in the JSON, the visual content
as page-accurate PNG crops. If you get an updated practice-test PDF later and
want to add more tests, the extraction approach was: find each "Question N."
label's bounding box with PyMuPDF, crop from that label to the next one, and
parse the answer-key/explanation pages by clustering text into rows by y
position. Ask for that tooling again if you need it regenerated for a new PDF.

## Tech

React + TypeScript + Vite, no backend required. Optional Firebase/Firestore
for cross-device sync. Icons via `lucide-react`.
