# Living scenes and continuous music implementation plan

Goal: add quiet scene stories, weather linked to the ambience mixer, and continuous playback within the selected style.
Architecture: keep the static, dependency-free application. Draw stories on the existing pixel stage. Use one shared weather intensity and scene-specific audio profiles. Preload and schedule the next Web Audio source against the audio clock, with a short crossfade and the current loop as fallback.

Constraints: preserve motion controls, reduced motion, offscreen suspension, no autoplay, keyboard controls, original artwork and independent background/music choices. Work in the existing checkout. No deployment is requested.

## 1. Weather and scene stories
- [x] Test weather profile selection and clamped intensity, plus saved playback mode.
- [x] Add scene weather metadata and stories in `dist/backgrounds.js` and `dist/scene-stories.js`.
- [x] Pass weather into both renderers; redraw the frozen frame when a slider changes.
- [x] Let the existing rain mixer control rain, snow/wind or rooftop wind, with accurate Czech labels.
- [x] Fade weather audio profiles when environments change; retain the user's chosen level.

## 2. Continuous playback
- [x] Test next/previous wrapping and future transition timing in `tests/playlist.test.mjs`.
- [x] Add `dist/playlist.js` helpers and queue scheduling in `dist/audio.js`.
- [x] Preload and schedule one track ahead; cancel stale sources on manual navigation and style changes.
- [x] Preserve scheduled audio across pause/resume; keep old loop audible on preload failure.
- [x] Add a persisted automatic-next toggle and next-track hint; update metadata on automatic transitions.

## 3. Verification
- [x] Run the full Node suite and syntax checks.
- [x] Exercise short real Web Audio tracks: scheduled transitions, style wrapping, pause/resume, cancellation, delayed preload and failure fallback.
- [x] Check weather visual response at zero and high values, scene story frames, frozen motion, reduced motion, mobile layout and existing background/style flows in Chromium.
- [x] Review the diff and update the application README.

## Verification notes

- Node suite: 13 tests passing; JavaScript syntax checks passing.
- Real short WAVs: automatic next, wrapping, single-track mode, pause/resume and style changes pass in Chromium.
- Real AudioBuffers: continuous non-silent output through crossfades, delayed/failed next preload fallback, stale request cancellation and weather audio profile levels pass.
- Weather slider changes the frozen frame in all four environments without restarting motion; intensity and playback mode survive reload.
- Existing collection/background checks pass, including reduced motion, focus mode and offscreen rendering suspension.
- A fresh reviewer found one boundary notification race also reproduced by the author. Regression test failed before fixing; explicit manual intent now wins and the test passes. No other Important/Critical findings.
- Desktop and mobile screenshots and story frame previews retained in ignored `artifacts/`.
