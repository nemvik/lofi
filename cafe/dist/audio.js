import { TRACKS } from './catalog.js';
export { TRACKS } from './catalog.js';

const SAMPLE_RATE = 24000;
const BARS = 32;
const TAU = Math.PI * 2;
const frequency = midi => 440 * 2 ** ((midi - 69) / 12);

function randomFrom(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function noiseBuffer(context, seconds, random) {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * seconds), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = random() * 2 - 1;
  return buffer;
}

function piano(context, destination, midi, time, duration, velocity, pan = 0) {
  const f = frequency(midi);
  const carrier = context.createOscillator();
  const modulator = context.createOscillator();
  const modulation = context.createGain();
  const envelope = context.createGain();
  const panner = context.createStereoPanner();
  // A decaying FM tine gives the note a soft electric-piano attack.
  carrier.frequency.value = f;
  modulator.frequency.value = f * 2;
  modulation.gain.setValueAtTime(f * 0.65, time);
  modulation.gain.exponentialRampToValueAtTime(f * 0.025, time + 0.65);
  modulator.connect(modulation).connect(carrier.frequency);
  envelope.gain.setValueAtTime(0, time);
  envelope.gain.linearRampToValueAtTime(velocity, time + 0.008);
  envelope.gain.exponentialRampToValueAtTime(velocity * 0.42, time + 0.38);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  panner.pan.value = pan;
  carrier.connect(envelope).connect(panner).connect(destination);
  carrier.start(time);
  modulator.start(time);
  carrier.stop(time + duration + 0.02);
  modulator.stop(time + duration + 0.02);
}

// Additive voices: nylon-string overtones, soft felt piano, or a vibraphone's
// inharmonic partials. Each partial decays independently instead of using FM.
function softVoice(context, destination, midi, time, duration, velocity, pan, kind) {
  const profiles = {
    guitar: [[1, 1], [2, 0.36], [3, 0.14], [4, 0.055], [6, 0.018]],
    felt: [[1, 1], [2, 0.22], [3, 0.055]],
    vibes: [[1, 1], [4, 0.14], [10, 0.025]],
  };
  const panner = context.createStereoPanner();
  panner.pan.value = pan;
  const voice = context.createGain();
  voice.gain.value = kind === 'vibes' ? 0.85 : 1;
  voice.connect(panner).connect(destination);
  if (kind === 'vibes') {
    const tremolo = context.createOscillator();
    const depth = context.createGain();
    tremolo.frequency.value = 4.8;
    depth.gain.value = 0.13;
    tremolo.connect(depth).connect(voice.gain);
    tremolo.start(time);
    tremolo.stop(time + duration + 0.05);
  }
  profiles[kind].forEach(([multiple, strength], index) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const length = Math.max(0.15, duration / (1 + index * 0.5));
    oscillator.frequency.value = frequency(midi) * multiple;
    oscillator.detune.value = kind === 'felt' ? index * 1.4 : 0;
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(velocity * strength, time + (kind === 'felt' ? 0.015 : 0.004));
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + length);
    oscillator.connect(envelope).connect(voice);
    oscillator.start(time);
    oscillator.stop(time + length + 0.02);
  });
}

function note(context, destination, kind, midi, time, duration, velocity, pan = 0) {
  if (kind === 'piano') piano(context, destination, midi, time, duration, velocity, pan);
  else softVoice(context, destination, midi, time, duration, velocity, pan, kind);
}

function bass(context, destination, midi, time, duration, velocity) {
  const oscillator = context.createOscillator();
  const overtone = context.createOscillator();
  const overtoneGain = context.createGain();
  const envelope = context.createGain();
  const filter = context.createBiquadFilter();
  oscillator.frequency.value = frequency(midi);
  overtone.frequency.value = frequency(midi) * 2;
  overtone.type = 'triangle';
  overtoneGain.gain.value = 0.18;
  filter.type = 'lowpass';
  filter.frequency.value = 650;
  envelope.gain.setValueAtTime(0, time);
  envelope.gain.linearRampToValueAtTime(velocity, time + 0.015);
  envelope.gain.exponentialRampToValueAtTime(velocity * 0.4, time + duration * 0.6);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(envelope);
  overtone.connect(overtoneGain).connect(envelope);
  envelope.connect(filter).connect(destination);
  oscillator.start(time);
  overtone.start(time);
  oscillator.stop(time + duration + 0.02);
  overtone.stop(time + duration + 0.02);
}

function kick(context, destination, time, velocity) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.frequency.setValueAtTime(110, time);
  oscillator.frequency.exponentialRampToValueAtTime(45, time + 0.09);
  envelope.gain.setValueAtTime(0, time);
  envelope.gain.linearRampToValueAtTime(velocity, time + 0.005);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);
  oscillator.connect(envelope).connect(destination);
  oscillator.start(time);
  oscillator.stop(time + 0.36);
}

function percussion(context, destination, buffer, time, type, velocity, random) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  const panner = context.createStereoPanner();
  source.buffer = buffer;
  filter.type = type === 'hat' ? 'highpass' : 'bandpass';
  filter.frequency.value = type === 'hat' ? 5200 : type === 'brush' ? 2400 : 1700;
  filter.Q.value = 0.6;
  panner.pan.value = type === 'hat' ? 0.24 : -0.12;
  const duration = type === 'hat' ? 0.065 : type === 'brush' ? 0.28 : 0.16;
  envelope.gain.setValueAtTime(0, time);
  envelope.gain.linearRampToValueAtTime(velocity, time + (type === 'brush' ? 0.04 : 0.004));
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  source.connect(filter).connect(envelope).connect(panner).connect(destination);
  source.start(time, random() * 0.5, duration + 0.01);
  if (type === 'snare') {
    const rim = context.createOscillator();
    const gain = context.createGain();
    rim.frequency.value = 185;
    gain.gain.setValueAtTime(velocity * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
    rim.connect(gain).connect(destination);
    rim.start(time);
    rim.stop(time + 0.05);
  }
}

function arrangeCafeBar(context, music, keys, noise, track, bar, random) {
  const beat = 60 / track.bpm;
  const start = bar * 4 * beat;
  const chordIndex = Math.floor(bar / 2) % track.chords.length;
  const chord = track.chords[chordIndex];
  const root = track.roots[chordIndex];
  const style = track.arrangement;
  const quiet = style === 'half-time' || style === 'nocturne';
  // The middle eight bars leave room for the melody, then the groove returns.
  const bridge = bar >= 16 && bar < 24;
  const dynamics = (bridge ? 0.8 : 1) * (0.94 + 0.06 * Math.sin(bar * Math.PI / 8));
  const play = (kind, pitch, at, length, level, pan) =>
    note(context, keys, kind, pitch, start + at * beat, length * beat, level * dynamics, pan);

  if (style === 'arpeggio') {
    const pattern = bar % 2 ? [0, 3, 1, 2, 0, 2, 3, 1] : [0, 2, 1, 3, 2, 0, 3, 1];
    pattern.forEach((index, eighth) => {
      if (bridge && eighth % 2) return;
      play('guitar', chord[index], eighth * 0.5 + (eighth % 2 ? track.swing : 0),
        1.8, eighth % 2 ? 0.105 : 0.14, (index - 1.5) * 0.18);
    });
  } else {
    const hits = style === 'bossa' ? (bar % 2 ? [0.5, 2, 3.5] : [0, 1.5, 3])
      : style === 'shuffle' ? [0, 1.65, 2.7]
        : style === 'nocturne' ? [0, ...(bar % 4 === 3 ? [2.75] : [])]
          : [0, ...(bridge ? [] : [bar % 2 ? 2.65 : 1.75])];
    hits.forEach((hit, hitIndex) => {
      chord.forEach((pitch, index) => {
        // A higher top voice in the returning section keeps the long loop moving.
        const octave = bar >= 32 && index === 3 && bar % 4 < 2 ? 12 : 0;
        play(track.instrument, pitch + octave, hit + index * 0.015 + random() * 0.008,
          quiet ? 3.5 : style === 'bossa' ? 1.65 : 2.2,
          (hitIndex ? 0.068 : 0.093) * (0.9 + random() * 0.2), (index - 1.5) * 0.17);
      });
    });
  }

  const nextRoot = track.roots[(chordIndex + 1) % track.roots.length];
  const bassLine = style === 'shuffle'
    ? [[0, root], [1, root + (chord[0] - root + 24) % 12], [2, root + 7], [3, nextRoot - 1]]
    : style === 'bossa' ? [[0, root], [1.5, root + 7], [2, root + 12], [3.5, root + 7]]
      : [[0, root], ...(!quiet || bar % 2 ? [[2.5, root + (bar % 2 ? 7 : 12)]] : [])];
  for (const [hit, pitch] of bassLine) {
    bass(context, music, pitch, start + hit * beat + 0.008,
      beat * (quiet ? 2 : style === 'shuffle' ? 0.85 : 1.15), (hit ? 0.15 : 0.23) * dynamics);
  }

  if (!(style === 'nocturne' && bridge)) {
    kick(context, music, start, (quiet ? 0.15 : 0.24) * dynamics);
    if (!quiet) kick(context, music, start + (style === 'bossa' ? 2 : 2.55) * beat, 0.16 * dynamics);
    const backbeats = quiet ? [2] : [1, 3];
    backbeats.forEach(hit => percussion(context, music, noise,
      start + hit * beat + 0.025, style === 'shuffle' ? 'snare' : 'brush',
      (quiet ? 0.065 : 0.11) * dynamics, random));
    for (let eighth = 0; eighth < 8; eighth++) {
      if ((quiet || bridge) && eighth % 2) continue;
      percussion(context, music, noise,
        start + (eighth / 2 + (eighth % 2 ? track.swing : 0)) * beat,
        'hat', (eighth % 2 ? 0.024 : 0.04) * dynamics, random);
    }
  }
  const hasMelody = style === 'vibes' ? bar % 4 >= 2
    : style === 'nocturne' ? bar % 8 === 5 || bar % 8 === 7
      : bar % 8 >= 4 || bridge;
  if (hasMelody) {
    const phrase = track.melody[chordIndex];
    const steps = quiet ? [0.75, 2.5] : bar % 2 ? [0.65, 1.65, 3.25] : [0.25, 2.15];
    steps.forEach((step, index) => play(track.lead,
      phrase[(index + Math.floor(bar / 8)) % phrase.length], step,
      style === 'vibes' ? 2.5 : 1.6, quiet ? 0.05 : 0.07, -0.16));
  }
}

/** Render an original arrangement, then wrap its effect tails into the beginning. */
export async function renderTrack(track) {
  const beat = 60 / track.bpm;
  const bars = track.bars || BARS;
  const frames = Math.round(bars * 4 * beat * SAMPLE_RATE);
  const context = new OfflineAudioContext(2, frames + SAMPLE_RATE * 5, SAMPLE_RATE);
  const random = randomFrom(track.seed);
  const noise = noiseBuffer(context, 1, random);
  const music = context.createGain();
  const keys = context.createGain();
  const tone = context.createBiquadFilter();
  const compressor = context.createDynamicsCompressor();
  keys.gain.value = 0.78;
  tone.type = 'lowpass';
  tone.frequency.value = track.warmth;
  tone.Q.value = 0.3;
  compressor.threshold.value = -17;
  compressor.knee.value = 16;
  compressor.ratio.value = 2.3;
  compressor.attack.value = 0.015;
  compressor.release.value = 0.24;
  music.connect(tone).connect(compressor).connect(context.destination);
  keys.connect(music);

  const reverb = context.createConvolver();
  const impulse = context.createBuffer(2, SAMPLE_RATE * 1.6, SAMPLE_RATE);
  for (let c = 0; c < 2; c++) {
    const channel = impulse.getChannelData(c);
    let smooth = 0;
    for (let i = 0; i < channel.length; i++) {
      smooth = smooth * 0.55 + (random() * 2 - 1) * 0.45;
      channel[i] = smooth * (1 - i / channel.length) ** 3;
    }
  }
  reverb.buffer = impulse;
  const wet = context.createGain();
  wet.gain.value = 0.15;
  keys.connect(reverb).connect(wet).connect(music);
  const delay = context.createDelay(2);
  const feedback = context.createGain();
  const delayFilter = context.createBiquadFilter();
  delay.delayTime.value = beat * 0.75;
  feedback.gain.value = 0.17;
  delayFilter.frequency.value = 1800;
  keys.connect(delay).connect(delayFilter).connect(feedback).connect(music);
  feedback.connect(delay);

  for (let bar = 0; bar < bars; bar++) {
    if (track.arrangement) {
      arrangeCafeBar(context, music, keys, noise, track, bar, random);
      continue;
    }
    const chordIndex = Math.floor(bar / 2) % 4;
    const chord = track.chords[chordIndex];
    const root = track.roots[chordIndex];
    const time = bar * 4 * beat;
    const sparse = track.id === 'po-zaviracce';
    // Alternate voicings, light syncopation, and eight-bar melodic phrases.
    for (const hit of [0, ...(bar % 2 ? [2.65] : [1.75])]) {
      chord.forEach((note, index) => {
        const octave = bar >= 16 && index === 3 ? 12 : 0;
        piano(context, keys, note + octave,
          time + hit * beat + index * 0.011 + random() * 0.008,
          hit === 0 ? beat * 2.5 : beat * 1.5,
          (0.085 + random() * 0.018) * (hit === 0 ? 1 : 0.66),
          (index - 1.5) * 0.16);
      });
    }
    bass(context, music, root, time + 0.006, beat * 1.55, 0.24);
    bass(context, music, root + (bar % 2 ? 7 : 12), time + 2.45 * beat, beat * 1.15, 0.17);
    if (bar % 4 === 3) {
      const nextRoot = track.roots[(chordIndex + 1) % 4];
      bass(context, music, nextRoot - 1, time + 3.55 * beat, beat * 0.37, 0.11);
    }
    kick(context, music, time, sparse ? 0.18 : 0.29);
    kick(context, music, time + (bar % 2 ? 2.55 : 2) * beat, sparse ? 0.12 : 0.21);
    for (const hit of [1, 3]) {
      percussion(context, music, noise, time + hit * beat + 0.023, 'snare', sparse ? 0.09 : 0.16, random);
    }
    for (let eighth = 0; eighth < 8; eighth++) {
      if (sparse && eighth % 2) continue;
      const swung = eighth % 2 ? track.swing : 0;
      percussion(context, music, noise,
        time + (eighth * 0.5 + swung) * beat + random() * 0.008,
        'hat', (eighth % 2 ? 0.035 : 0.055) * (0.8 + random() * 0.3), random);
    }
    if (bar % 8 >= 4 && (!sparse || bar % 2)) {
      const phrase = track.melody[chordIndex];
      const steps = bar % 2 ? [0.6, 2.1, 3.5] : [0.2, 1.6];
      steps.forEach((step, i) => {
        piano(context, keys, phrase[(i + bar) % phrase.length],
          time + step * beat, beat * 1.4, 0.055, -0.12);
      });
    }
  }
  const rendered = await context.startRendering();
  const result = new AudioBuffer({ length: frames, sampleRate: SAMPLE_RATE, numberOfChannels: 2 });
  let peak = 0;
  for (let c = 0; c < 2; c++) {
    const input = rendered.getChannelData(c);
    const output = result.getChannelData(c);
    output.set(input.subarray(0, frames));
    for (let i = frames; i < input.length; i++) output[i - frames] += input[i];
    // Gentle tape-like saturation; normalize both channels with the same factor.
    for (let i = 0; i < frames; i++) {
      output[i] = Math.tanh(output[i] * 1.3);
      peak = Math.max(peak, Math.abs(output[i]));
    }
  }
  const gain = 0.78 / Math.max(peak, 0.001);
  for (let c = 0; c < 2; c++) {
    const data = result.getChannelData(c);
    for (let i = 0; i < data.length; i++) data[i] *= gain;
    // Remove a possible DC seam without introducing a silent gap.
    const difference = data[frames - 1] - data[0];
    const edge = 240;
    for (let i = 0; i < edge; i++) {
      data[i] += difference * 0.5 * (1 - i / edge);
      data[frames - 1 - i] -= difference * 0.5 * (1 - i / edge);
    }
  }
  return result;
}

async function loadTrack(index) {
  try {
    const url = new URL(`./assets/audio/${TRACKS[index].id}.mp3`, import.meta.url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Audio: HTTP ${response.status}`);
    const context = new OfflineAudioContext(2, 1, SAMPLE_RATE);
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    // MP3 decoding can slightly change the endpoints of a gapless master.
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const samples = buffer.getChannelData(channel);
      const difference = samples[samples.length - 1] - samples[0];
      for (let i = 0; i < 240; i++) {
        samples[i] += difference * 0.5 * (1 - i / 240);
        samples[samples.length - 1 - i] -= difference * 0.5 * (1 - i / 240);
      }
    }
    return buffer;
  } catch {
    // The original score remains playable even if the prepared asset fails.
    return renderTrack(TRACKS[index]);
  }
}

function ambienceBuffer(context, kind) {
  const seconds = kind === 'cafe' ? 24 : 12;
  const buffer = context.createBuffer(2, context.sampleRate * seconds, context.sampleRate);
  const random = randomFrom(kind === 'rain' ? 723 : kind === 'cafe' ? 114 : 804);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    let brown = 0;
    let soft = 0;
    for (let i = 0; i < data.length; i++) {
      const white = random() * 2 - 1;
      brown = (brown + 0.02 * white) / 1.02;
      soft = 0.96 * soft + white * 0.04;
      const t = i / context.sampleRate;
      if (kind === 'rain') {
        data[i] = (soft * 0.65 + white * 0.12) * (0.8 + 0.15 * Math.sin(TAU * t / seconds));
      } else if (kind === 'vinyl') {
        data[i] = brown * 0.085 + white * 0.003;
        if (random() < 0.00013) data[i] += (random() - 0.5) * 0.15;
      } else {
        // Abstract room rustle, no recorded voices or intelligible speech.
        data[i] = brown * 0.25 * (0.6 + 0.3 * Math.sin(TAU * t / seconds * 3));
      }
    }
    if (kind === 'cafe') {
      for (const at of [2.6, 9.5, 17.4, 22.1]) {
        const start = Math.floor((at + c * 0.025) * context.sampleRate);
        for (let i = 0; i < context.sampleRate * 0.35 && start + i < data.length; i++) {
          const t = i / context.sampleRate;
          data[start + i] += (Math.sin(TAU * 1480 * t) + 0.3 * Math.sin(TAU * 2370 * t))
            * Math.exp(-t * 26) * Math.min(1, t * 1000) * 0.018;
        }
      }
    }
    const fade = Math.floor(context.sampleRate * 0.06);
    for (let i = 0; i < fade; i++) {
      data[i] *= i / fade;
      data[data.length - 1 - i] *= i / fade;
    }
  }
  return buffer;
}

export class LofiEngine {
  constructor() {
    this.context = null;
    this.cache = new Map();
    this.ambience = {};
    this.current = null;
    this.request = 0;
    this.cancelPendingPlay = null;
    this.playing = false;
    this.volume = 0.65;
    this.muted = false;
  }

  initialize() {
    if (this.context) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass || !window.OfflineAudioContext) {
      throw new Error('Tento prohlížeč nepodporuje zvuk. Zkus aktuální Chrome, Firefox nebo Safari.');
    }
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    const limiter = this.context.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.15;
    this.master.connect(limiter).connect(this.context.destination);
    for (const kind of ['rain', 'cafe', 'vinyl']) {
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      gain.gain.value = 0;
      source.buffer = ambienceBuffer(this.context, kind);
      source.loop = true;
      source.connect(gain).connect(this.master);
      source.start();
      this.ambience[kind] = gain;
    }
  }

  getBuffer(index) {
    if (this.current?.index === index) return Promise.resolve(this.current.source.buffer);
    if (this.cache.has(index)) {
      const cached = this.cache.get(index);
      this.cache.delete(index);
      this.cache.set(index, cached);
      return cached;
    }
    if (!this.cache.has(index)) {
      const pending = loadTrack(index).catch(error => {
        if (this.cache.get(index) === pending) this.cache.delete(index);
        throw error;
      });
      this.cache.set(index, pending);
      // Decoded stereo is much larger than MP3: retain only recent selections.
      while (this.cache.size > 3) this.cache.delete(this.cache.keys().next().value);
    }
    return this.cache.get(index);
  }

  async play(index) {
    this.cancelPendingPlay?.();
    const request = ++this.request;
    const canceled = new Promise(resolve => {
      this.cancelPendingPlay = () => resolve(null);
    });
    this.initialize();
    // Resume synchronously from the click handler before awaiting synthesis.
    // Chromium may leave resume() pending when suspend() immediately follows.
    // Cancellation settles the superseded operation without waiting for it.
    const resumed = await Promise.race([this.context.resume().then(() => true), canceled]);
    if (!resumed || request !== this.request) return false;
    const buffer = await Promise.race([this.getBuffer(index), canceled]);
    if (!buffer || request !== this.request) return false;
    if (this.current?.index !== index) {
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain).connect(this.master);
      const now = this.context.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.85, now + 1.1);
      source.start(now);
      if (this.current) {
        const previous = this.current;
        previous.gain.gain.cancelAndHoldAtTime(now);
        previous.gain.gain.linearRampToValueAtTime(0, now + 1.1);
        previous.source.stop(now + 1.2);
        previous.source.onended = () => {
          previous.source.disconnect();
          previous.gain.disconnect();
        };
      }
      this.current = { source, gain, index, startedAt: now };
    }
    this.playing = true;
    this.cancelPendingPlay = null;
    return true;
  }

  async pause() {
    this.request++;
    this.cancelPendingPlay?.();
    this.cancelPendingPlay = null;
    this.playing = false;
    if (this.context) await this.context.suspend();
  }

  setVolume(percent) {
    this.volume = Math.min(1, Math.max(0, percent / 100));
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.context.currentTime, 0.03);
  }

  setMuted(muted) {
    this.muted = muted;
    this.setVolume(this.volume * 100);
  }

  setAmbience(kind, percent) {
    const gain = this.ambience[kind];
    if (!gain) return;
    const scale = { rain: 1.8, cafe: 3, vinyl: 3 };
    gain.gain.setTargetAtTime(percent / 100 * scale[kind], this.context.currentTime, 0.08);
  }

  get elapsed() {
    return this.current ? this.context.currentTime - this.current.startedAt : 0;
  }
}
