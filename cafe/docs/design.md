# Pokoj

A quiet Czech-language lo-fi player for programming, with the warm jazz
café sound requested by the user.

Implementation choices: buildless HTML, CSS and JavaScript; original
instrumental compositions synthesized with Web Audio. No external stream,
account, API key or music service. The user deploys the main branch on Vercel.

Use extended electric-piano chords, round bass, restrained swung percussion
and sparse melodies. Render music ahead of playback so background-tab timer
throttling cannot break the beat. Ship prepared MP3 assets for fast startup,
with the original in-browser synthesizer as a fallback. Nine compositions, crossfaded changes,
independent rain/café/vinyl ambience, volume and WAV download.

Visual direction: one atmospheric illustrated café, surrounded by quiet
controls. Forest #202720, walnut #382f26, parchment #f1e8d7, amber #d9b77c,
sage #a7b19a and charcoal green #161c18. Georgia for the expressive title
and brand; a system sans-serif for controls. Text left aligned; visual
hierarchy comes from space and type rather than lots of boxes.

Desktop: header; heading; large café scene with a narrow sound/timer sidebar;
nine mood choices; persistent player. Mobile: scene, moods, sounds/timer,
and a compact player with safe bottom spacing.

The 25/50-minute timer uses a wall-clock deadline and offers pause/reset.
Playback starts only after a user gesture. Persist preferences but never
autoplay on reload. Handle rendering errors, rapid track changes, keyboard
controls, reduced motion and unsupported audio gracefully.

Verify music is non-silent, finite and bounded, including its loop seam;
verify actual playback, pause, switching, mute, downloads, timer, preferences,
keyboard and responsive layouts in a browser.

Expansion: six additional arrangements introduce additive nylon-string,
felt-piano and vibraphone voices, bossa, arpeggios, shuffle and slow nocturnes.
Keep the original three IDs and positions stable for saved preferences.
Cache only three recent decoded buffers, plus any currently playing source.

Animate the existing artwork with a transparent canvas: rain clipped to
the window, steam anchored to the cup, warm light and a few dust motes.
Match the image's cover crop on mobile and in focus mode. Cap animation
at 24 fps and device pixel ratio at 1.5; stop when hidden or offscreen.
Honor reduced motion by default and persist the user's explicit choice.
