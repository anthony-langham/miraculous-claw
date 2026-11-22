# CLAUDE.md

Guidance for Claude Code (and the automated PR reviewer) working in this repo.

## What this is

**Miraculous Claw** is a 2D side-scrolling beat-em-up for kids (Ladybug & Cat Noir vs Akumas),
for 1 or 2 players. It is plain JavaScript ES modules drawing to one `<canvas>`. **No build step,
no dependencies, no tests.** **Vercel** serves it as static files at **marnie.io** (`vercel.json`
just points the output at the repo root).

## Run it

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

ES modules have to be served over HTTP. Opening `index.html` from disk won't work.

## Deploy

- Every push to a branch gets a Vercel **preview** deployment (the link is in the PR checks).
- Merging to `main` deploys **production** to marnie.io automatically.

## Architecture

- `js/game.js`: the entry point. Holds the state machine (`STATE.TITLE → LEVEL_INTRO →
  PLAYING → LEVEL_COMPLETE → … → VICTORY / GAME_OVER`), collisions, scoring, drawing, and the
  **fixed 60 Hz timestep** loop. All game logic is frame-counted, so never tie logic to
  render frames or wall-clock time (it would run at double speed on 120 Hz screens).
- Drawing happens in a logical **1280×720** space. The canvas backing store is scaled
  (`renderScale`) to stay sharp on high-DPI screens. Use `W`/`H`, not `canvas.width`.
- `js/input.js`: keyboard + virtual keys. The touch controls hold the *same* key codes, so
  `player.js` can't tell the difference. `pulse()` records presses shorter than one tick.
- `js/touch.js`: the DOM overlay. It holds the 1P/2P start menu (all devices), the
  Bloom-style joysticks and attack buttons (touch only), the pause button, and the
  rotate-your-phone prompt. Phones (short side < 600px) only offer 1 player.
- `js/player.js`, `js/enemy.js`: the entities. P1 Ladybug = Arrows + Right Shift, P2 Cat Noir =
  WASD + F. In 1-player mode `players` has length 1, so guard any `players[1]` access.
- `js/level.js` (level data + backgrounds), `js/hud.js` (HUD and full-screen overlays),
  `js/particles.js`, `js/audio.js` (all music and SFX are synthesised with Web Audio; on iOS,
  audio must be unlocked inside a real user gesture).
- `sw.js`: a network-first service worker for offline play. **Add new files to its `CORE`
  list.** `manifest.webmanifest` + `icons/` make the game installable to the home screen.

## Pull requests

`.github/workflows/claude.yml` reviews each PR **once** (on open / ready for review) against
`.github/prompts/review-prompt.md`. To re-review, add the `needs-review` label or comment
`@claude re-review`. Drafts and docs-only PRs are skipped.

⚠️ Editing `claude.yml` on a branch disables review for that PR: `claude-code-action` refuses
to run when the workflow differs from `main`, and it exits green. Workflow changes need their own PR.

The workflow needs the `CLAUDE_CODE_OAUTH_TOKEN` repo secret (Settings → Secrets → Actions).
