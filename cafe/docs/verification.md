# Verification

Validated locally on 20 October 2026 in Chromium.

- Six model tests: wall-clock timer, pause/resume/reset, WAV header and stereo
  encoding, corrupt/out-of-range preferences, new-track restoration and
  validated motion preferences.
- Six new source arrangements render finite, non-silent samples.
  Peak amplitude: 0.78. RMS: approximately 0.124–0.147. Source loop endpoints
  match. Original three masters remain unchanged.
- All nine prepared MP3 files exist and decode to the exact musical loop
  length at 24 kHz. Peaks stay below 0.743; RMS is 0.118–0.141.
  Loop endpoints match after decoding. Total collection: 20 minutes 12 seconds.
- New track durations: Ranní filtr 147.6923 s, Medové světlo 106.6667 s,
  Papírové stránky 164.5714 s, Sametový večer 120 s, Druhý šálek 140.4878 s,
  Poslední tramvaj 192 s.
- Real audio graph: non-silent playback, mute to zero, suspended clock
  on pause, switching, cancellation and recovery.
- Regression fixed: an immediately canceled AudioContext resume can remain
  pending in Chromium. Superseded play operations now settle independently.
  The repeatable check is `tests/audio-browser.js` (a Playwright function).
- UI: play/pause, next/rapid switches, ambient toggles, saved preferences,
  no autoplay after reload, 25/50-minute presets, timer pause/reset, focus
  mode, modal, space/M/F/Escape shortcuts.
- All six new source WAV exports downloaded successfully. The player's
  download button also exported the decoded Poslední tramvaj track.
- Browser regression checks verify nine visible tracks, next/previous wrap,
  restoration of the ninth track, and no autoplay on reload.
- Canvas pixels change while enabled and remain identical when paused.
  Pausing survives reload. The control remains available in focus mode;
  Escape returns keyboard focus to the focus-mode button.
- Reduced motion disables animation by default; live system setting changes
  take effect. Animation stops when scrolled out of view and resumes on return.
- After browsing all nine tracks, the decoded-buffer cache contains three
  entries. The newest track plays successfully; a playing source can retain
  its own buffer independently.
- Desktop inspected at 1440×1000; mobile inspected at 390×844 with no
  horizontal overflow. Screenshots retained locally in `artifacts/`.
- Prepared music startup measured at 452 ms on the local test server.
  This is a local measurement, not a guarantee over a network.

Not verified on physical mobile devices or Safari/Firefox. Signal checks
verify technical audio behavior, not subjective musical taste. Device sleep
can interrupt audio regardless of browser-tab scheduling.
