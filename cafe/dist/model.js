import { TRACKS } from './catalog.js';
import { findBackground } from './backgrounds.js';

export class FocusTimer {
  constructor(minutes = 25) {
    this.reset(minutes);
  }

  reset(minutes = this.minutes) {
    this.minutes = minutes;
    this.seconds = minutes * 60;
    this.deadline = null;
    this.running = false;
  }

  start(now = Date.now()) {
    if (this.running) return;
    if (this.seconds <= 0) this.seconds = this.minutes * 60;
    this.deadline = now + this.seconds * 1000;
    this.running = true;
  }

  remaining(now = Date.now()) {
    return this.running ? Math.max(0, (this.deadline - now) / 1000) : this.seconds;
  }

  pause(now = Date.now()) {
    this.seconds = this.remaining(now);
    this.running = false;
    this.deadline = null;
  }

  isComplete(now = Date.now()) {
    return this.running && this.remaining(now) === 0;
  }
}

export function readPreferences(raw) {
  const defaults = { track: 0, volume: 65, rain: 0, cafe: 12, vinyl: 16, motion: null, background: 'rain-room' };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaults;
  }
  if (!parsed || typeof parsed !== 'object') return defaults;
  for (const key of ['volume', 'rain', 'cafe', 'vinyl']) {
    if (typeof parsed[key] === 'number' && Number.isFinite(parsed[key])) {
      defaults[key] = Math.max(0, Math.min(100, parsed[key]));
    }
  }
  if (Number.isInteger(parsed.track) && parsed.track >= 0 && parsed.track < TRACKS.length) {
    defaults.track = parsed.track;
  }
  if (typeof parsed.motion === 'boolean') defaults.motion = parsed.motion;
  defaults.background = findBackground(parsed.background).id;
  return defaults;
}

export function encodeWav(buffer) {
  const channels = buffer.numberOfChannels;
  const dataLength = buffer.length * channels * 2;
  const bytes = new ArrayBuffer(44 + dataLength);
  const view = new DataView(bytes);
  const writeText = (offset, text) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, dataLength, true);
  const samples = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < channels; c++) {
      const value = Math.max(-1, Math.min(1, samples[c][i]));
      view.setInt16(offset, Math.round(value * (value < 0 ? 32768 : 32767)), true);
      offset += 2;
    }
  }
  return bytes;
}
