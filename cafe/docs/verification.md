# Verification

Validated locally on 20 October 2026 in Chromium.

- Model tests: wall-clock timer, pause/resume/reset, WAV header and stereo
  encoding, corrupt/out-of-range stored preferences.
- All three source arrangements render finite, non-silent samples.
  Peak amplitude: 0.78. RMS: approximately 0.144–0.145.
- Prepared MP3 files decode to the exact musical loop length at 24 kHz:
  103.7838, 112.9412 and 123.8710 seconds. Peaks stay below 0.75.
  Loop endpoints match after decoding.
- Real audio graph: non-silent playback, mute to zero, suspended clock
  on pause, switching, cancellation and recovery.
- Regression fixed: an immediately canceled AudioContext resume can remain
  pending in Chromium. Superseded play operations now settle independently.
  The repeatable check is `tests/audio-browser.js` (a Playwright function).
- UI: play/pause, next/rapid switches, ambient toggles, saved preferences,
  no autoplay after reload, 25/50-minute presets, timer pause/reset, focus
  mode, modal, space/M/F/Escape shortcuts.
- All three WAV exports downloaded successfully.
- Desktop inspected at 1440×1000; mobile inspected at 390×844 with no
  horizontal overflow. Screenshots retained locally in `artifacts/`.
- Prepared music startup measured at 414 ms on the local test server.
  This is a local measurement, not a guarantee over a network.

Not verified on physical mobile devices or Safari/Firefox. Signal checks
verify technical audio behavior, not subjective musical taste. Device sleep
can interrupt audio regardless of browser-tab scheduling.
