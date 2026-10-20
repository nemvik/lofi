import { LofiEngine, TRACKS } from './audio.js';
import { FocusTimer, encodeWav, readPreferences } from './model.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const storageKey = 'pokoj.preferences.v1';
let saved = null;
try { saved = localStorage.getItem(storageKey); } catch { /* Private mode can block storage. */ }
const preferences = readPreferences(saved);
const engine = new LofiEngine();
const timer = new FocusTimer();
let wantsPlayback = false;
let operation = 0;
let toastTimeout;
let timerDone = false;
let isFocused = false;
const rememberedSounds = { rain: 35, cafe: 25, vinyl: 25 };
const soundNames = { rain: 'déšť', cafe: 'zvuky kavárny', vinyl: 'praskání vinylu' };

function savePreferences() {
  try { localStorage.setItem(storageKey, JSON.stringify(preferences)); } catch { /* The player works without storage. */ }
}

function icon(button, name) {
  button.querySelector('use').setAttribute('href', `#i-${name}`);
}

function toast(message, duration = 5000) {
  clearTimeout(toastTimeout);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimeout = setTimeout(() => { $('#toast').hidden = true; }, duration);
}

function formatTime(seconds) {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}

function updateSlider(input, value) {
  input.value = value;
  input.style.setProperty('--fill', `${value}%`);
}

function updateSound(kind) {
  const value = preferences[kind];
  updateSlider($(`#${kind}-volume`), value);
  $(`#${kind}-value`).textContent = `${value} %`;
  const button = $(`[data-sound="${kind}"]`);
  button.setAttribute('aria-pressed', String(value > 0));
  button.setAttribute('aria-label', `${value > 0 ? 'Vypnout' : 'Zapnout'} ${soundNames[kind]}`);
  engine.setAmbience(kind, value);
}

function updateTrack() {
  const track = TRACKS[preferences.track];
  $('#track-title').textContent = track.title;
  $('#track-description').textContent = track.subtitle;
  $('#scene-title').textContent = track.scene;
  document.documentElement.style.setProperty('--amber', track.color);
  $$('.mood').forEach(button => {
    const active = Number(button.dataset.track) === preferences.track;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if ('mediaSession' in navigator && 'MediaMetadata' in window) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title, artist: 'Pokoj', album: 'Malá lo-fi kavárna',
      artwork: [{ src: new URL('./assets/cafe.png', location.href).href, type: 'image/png' }],
    });
  }
}

function updatePlayback(loading = false) {
  const playing = wantsPlayback && engine.playing;
  document.body.classList.toggle('is-playing', playing);
  document.body.classList.toggle('is-loading', loading);
  $('#play-button').setAttribute('aria-pressed', String(playing));
  $('#play-button').setAttribute('aria-label', wantsPlayback ? 'Pozastavit hudbu' : 'Přehrát hudbu');
  $('#play-button').setAttribute('aria-busy', String(loading));
  $('#scene-play').setAttribute('aria-label', wantsPlayback ? 'Pozastavit hudbu' : 'Pustit hudbu');
  $('#scene-play-label').textContent = loading ? 'Chystám tóny…' : playing ? 'Chvíli ticha' : 'Pustit hudbu';
  $('#scene-status-text').textContent = loading ? 'Rozehříváme piano…' : playing ? 'Teď hraje tvůj klid' : 'Tvoje chvíle klidu';
  icon($('#play-button'), wantsPlayback ? 'pause' : 'play');
  icon($('#scene-play'), wantsPlayback ? 'pause' : 'play');
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  document.title = playing ? `${TRACKS[preferences.track].title} — Pokoj` : 'Pokoj — tvoje lo-fi kavárna';
}

async function startPlayback() {
  const token = ++operation;
  wantsPlayback = true;
  updatePlayback(true);
  try {
    const started = await engine.play(preferences.track);
    if (token !== operation || !started) return;
    for (const kind of ['rain', 'cafe', 'vinyl']) updateSound(kind);
    updatePlayback();
  } catch (error) {
    if (token !== operation) return;
    wantsPlayback = false;
    await engine.pause().catch(() => {});
    updatePlayback();
    console.error('Playback failed:', error);
    toast(error.message?.startsWith('Tento prohlížeč') ? error.message : 'Hudbu se nepodařilo spustit. Zkus znovu stisknout přehrávání.', 8000);
  }
}

async function pausePlayback() {
  operation++;
  wantsPlayback = false;
  await engine.pause();
  updatePlayback();
}

function togglePlayback() {
  if (wantsPlayback) {
    pausePlayback().catch(() => toast('Zvuk nejde pozastavit. Zkus obnovit stránku.'));
  } else {
    startPlayback();
  }
}

function selectTrack(index) {
  index = (index + TRACKS.length) % TRACKS.length;
  if (preferences.track === index) return;
  preferences.track = index;
  updateTrack();
  savePreferences();
  if (wantsPlayback) startPlayback();
  else $('#playback-time').textContent = '00:00';
}

function toggleMute() {
  engine.setMuted(!engine.muted);
  $('#mute-button').setAttribute('aria-pressed', String(engine.muted));
  $('#mute-button').setAttribute('aria-label', engine.muted ? 'Zapnout zvuk' : 'Ztlumit zvuk');
  icon($('#mute-button'), engine.muted ? 'muted' : 'volume');
}

function setFocus(enabled) {
  isFocused = enabled;
  document.body.classList.toggle('focus-mode', enabled);
  $('#exit-focus').hidden = !enabled;
  $('#focus-mode').setAttribute('aria-pressed', String(enabled));
  // Keep keyboard navigation inside the visible scene and player.
  for (const element of [$('.site-header'), $('.welcome'), $('.mood-section'), $('.sidebar'), $('.page-footer')]) {
    element.inert = enabled;
  }
  if (enabled) $('#exit-focus').focus();
  else $('#focus-mode').focus();
}

function updateTimer() {
  const remaining = timer.remaining();
  $('#timer-display').textContent = formatTime(remaining);
  $('#timer-progress').style.width = `${(1 - remaining / (timer.minutes * 60)) * 100}%`;
  if (timer.isComplete()) {
    timer.pause();
    timerDone = true;
    toast('Hotovo. Protáhni se a dopřej si chvíli pauzu.', 12000);
  }
  $('#timer-start span').textContent = timer.running ? 'Pozastavit čas' : timerDone ? 'Další soustředění' : remaining < timer.minutes * 60 ? 'Pokračovat' : 'Začít soustředění';
  icon($('#timer-start'), timer.running ? 'pause' : 'play');
  $('#timer-caption').textContent = timerDone ? 'Dobrá práce. Je čas na pauzu.' : timer.running ? 'Teď je čas na tvoje myšlenky.' : 'Jeden úkol. Žádný spěch.';
}

$('#play-button').addEventListener('click', togglePlayback);
$('#scene-play').addEventListener('click', togglePlayback);
$('#next-track').addEventListener('click', () => selectTrack(preferences.track + 1));
$('#previous-track').addEventListener('click', () => selectTrack(preferences.track - 1));
$$('.mood').forEach(button => button.addEventListener('click', () => selectTrack(Number(button.dataset.track))));

for (const kind of ['rain', 'cafe', 'vinyl']) {
  $(`#${kind}-volume`).addEventListener('input', event => {
    preferences[kind] = Number(event.target.value);
    if (preferences[kind] > 0) rememberedSounds[kind] = preferences[kind];
    updateSound(kind);
    savePreferences();
  });
  $(`[data-sound="${kind}"]`).addEventListener('click', () => {
    preferences[kind] = preferences[kind] > 0 ? 0 : rememberedSounds[kind];
    updateSound(kind);
    savePreferences();
  });
  if (preferences[kind] > 0) rememberedSounds[kind] = preferences[kind];
  updateSound(kind);
}

$('#master-volume').addEventListener('input', event => {
  preferences.volume = Number(event.target.value);
  if (engine.muted && preferences.volume > 0) toggleMute();
  engine.setVolume(preferences.volume);
  updateSlider(event.target, preferences.volume);
  $('#master-value').textContent = `${preferences.volume} %`;
  savePreferences();
});
$('#mute-button').addEventListener('click', toggleMute);
$('#focus-mode').addEventListener('click', () => setFocus(!isFocused));
$('#exit-focus').addEventListener('click', () => setFocus(false));

$$('[data-minutes]').forEach(button => button.addEventListener('click', () => {
  timer.reset(Number(button.dataset.minutes));
  timerDone = false;
  $$('[data-minutes]').forEach(preset => preset.setAttribute('aria-pressed', String(preset === button)));
  updateTimer();
}));
$('#timer-start').addEventListener('click', () => {
  if (timer.running) timer.pause();
  else { timer.start(); timerDone = false; }
  updateTimer();
});
$('#timer-reset').addEventListener('click', () => {
  timer.reset();
  timerDone = false;
  updateTimer();
});

$('#about-open').addEventListener('click', () => $('#about-dialog').showModal());
$('#about-close').addEventListener('click', () => $('#about-dialog').close());
$('#about-dialog').addEventListener('click', event => {
  if (event.target !== $('#about-dialog')) return;
  const bounds = event.target.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close();
});

async function downloadTrack() {
  const buttons = [$('#download-track'), $('#dialog-download')];
  buttons.forEach(button => { button.disabled = true; });
  const index = preferences.track;
  toast('Připravuji tvoji skladbu do WAV…', 20000);
  try {
    const buffer = await engine.getBuffer(index);
    const blob = new Blob([encodeWav(buffer)], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pokoj-${TRACKS[index].id}.wav`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    toast('Skladba je připravená. Stažení najdeš v prohlížeči.');
  } catch (error) {
    console.error('WAV export failed:', error);
    toast('Skladbu se nepodařilo připravit. Zkus stažení znovu.');
  } finally {
    buttons.forEach(button => { button.disabled = false; });
  }
}
$('#download-track').addEventListener('click', downloadTrack);
$('#dialog-download').addEventListener('click', downloadTrack);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && isFocused) {
    setFocus(false);
    return;
  }
  if ($('#about-dialog').open || event.repeat || event.altKey || event.metaKey || event.ctrlKey) return;
  if (event.target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
  if (event.code === 'Space') {
    event.preventDefault();
    togglePlayback();
  } else if (event.key.toLowerCase() === 'm') toggleMute();
  else if (event.key.toLowerCase() === 'f') setFocus(!isFocused);
});

if ('mediaSession' in navigator) {
  for (const [action, handler] of Object.entries({
    play: startPlayback, pause: pausePlayback,
    nexttrack: () => selectTrack(preferences.track + 1),
    previoustrack: () => selectTrack(preferences.track - 1),
  })) {
    try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* Not every platform has every media key. */ }
  }
}

setInterval(() => {
  updateTimer();
  if (engine.current?.index === preferences.track) {
    const elapsed = engine.elapsed;
    const duration = engine.current.source.buffer.duration;
    $('#playback-time').textContent = formatTime(Math.floor(elapsed));
    $('#playback-progress').style.width = `${elapsed % duration / duration * 100}%`;
  } else {
    $('#playback-progress').style.width = '0%';
  }
}, 250);
document.addEventListener('visibilitychange', updateTimer);
window.addEventListener('pagehide', () => { engine.pause().catch(() => {}); });
window.addEventListener('pageshow', event => {
  if (event.persisted) { wantsPlayback = false; updatePlayback(); }
});

engine.setVolume(preferences.volume);
updateSlider($('#master-volume'), preferences.volume);
$('#master-value').textContent = `${preferences.volume} %`;
updateTrack();
updatePlayback();
updateTimer();
