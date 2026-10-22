import test from 'node:test';
import assert from 'node:assert/strict';
import { FocusTimer, encodeWav, readPreferences } from '../dist/model.js';

test('timer uses elapsed wall time after the tab was inactive', () => {
  const timer = new FocusTimer(25);
  timer.start(1000);
  assert.equal(timer.remaining(61000), 1440);
  assert.equal(timer.remaining(1501001), 0);
  assert.equal(timer.isComplete(1501001), true);
});

test('pausing keeps remaining time and resuming preserves it', () => {
  const timer = new FocusTimer(25);
  timer.start(1000);
  timer.pause(61000);
  assert.equal(timer.remaining(900000), 1440);
  timer.start(900000);
  assert.equal(timer.remaining(960000), 1380);
  timer.reset(50);
  assert.equal(timer.remaining(960000), 3000);
  assert.equal(timer.running, false);
});

test('WAV export interleaves stereo, clamps samples and writes valid lengths', () => {
  const buffer = {
    sampleRate: 24000, length: 3, numberOfChannels: 2,
    getChannelData: c => c ? new Float32Array([0.5, -0.5, 0]) : new Float32Array([2, -2, 0]),
  };
  const wav = encodeWav(buffer);
  const view = new DataView(wav);
  assert.equal(new TextDecoder().decode(new Uint8Array(wav, 0, 4)), 'RIFF');
  assert.equal(view.getUint32(4, true), 48);
  assert.equal(view.getUint16(22, true), 2);
  assert.equal(view.getUint32(24, true), 24000);
  assert.equal(view.getUint32(40, true), 12);
  assert.deepEqual(
    Array.from({ length: 6 }, (_, i) => view.getInt16(44 + i * 2, true)),
    [32767, 16384, -32768, -16384, 0, 0],
  );
});

test('invalid or outdated persisted preferences cannot break player startup', () => {
  const defaults = readPreferences(null);
  assert.deepEqual(readPreferences('{oops'), defaults);
  assert.deepEqual(readPreferences('null'), defaults);
  const value = readPreferences('{"track":99,"volume":900,"rain":-2,"cafe":"bad","vinyl":null}');
  assert.equal(value.track, 0);
  assert.equal(value.volume, 100);
  assert.equal(value.rain, 0);
  assert.equal(value.cafe, defaults.cafe);
  assert.equal(value.vinyl, defaults.vinyl);
});

test('a newly added track and an explicit motion choice survive reload', () => {
  const value = readPreferences('{"track":8,"motion":false}');
  assert.equal(value.track, 8);
  assert.equal(value.motion, false);
});

test('motion follows the system by default and rejects malformed saved choices', () => {
  assert.equal(readPreferences(null).motion, null);
  assert.equal(readPreferences('{"motion":"false"}').motion, null);
  assert.equal(readPreferences('{"motion":true}').motion, true);
});


test('background selection survives reload and invalid saved backgrounds use the default', () => {
  assert.equal(readPreferences('{"background":"snow-cabin"}').background, 'snow-cabin');
  assert.equal(readPreferences('{"background":"night-roof","motion":false}').motion, false);
  assert.equal(readPreferences('{"background":"missing"}').background, 'rain-room');
  assert.equal(readPreferences('{"background":null}').background, 'rain-room');
  assert.equal(readPreferences(null).background, 'rain-room');
});

test('automatic continuation defaults on and preserves an explicit single-track choice', () => {
  assert.equal(readPreferences(null).autoNext, true);
  assert.equal(readPreferences('{"autoNext":false}').autoNext, false);
  assert.equal(readPreferences('{"autoNext":"false"}').autoNext, true);
});
