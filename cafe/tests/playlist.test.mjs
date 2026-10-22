import test from 'node:test';
import assert from 'node:assert/strict';
import { nextTrackIndex, transitionTiming } from '../dist/playlist.js';

test('automatic next stays in the chosen collection and wraps in either direction', () => {
  assert.equal(nextTrackIndex([9, 10, 11], 9), 10);
  assert.equal(nextTrackIndex([9, 10, 11], 11), 9);
  assert.equal(nextTrackIndex([9, 10, 11], 9, -1), 11);
  assert.equal(nextTrackIndex([9, 10, 11], 4), 9);
  assert.equal(nextTrackIndex([], 0), null);
  assert.equal(nextTrackIndex([3], 3), 3);
});

test('a transition overlaps the end of the current loop on the audio clock', () => {
  const result = transitionTiming(120, 10, 30);
  assert.equal(result.start, 128.9);
  assert.equal(result.fade, 1.1);
  assert.equal(result.start + result.fade, 130);
});

test('a late preload waits for a future loop boundary instead of leaving a gap', () => {
  const result = transitionTiming(120, 10, 129.5);
  assert.equal(result.start, 248.9);
  assert.ok(result.start > 129.5);
});

test('short tracks retain a usable playing section between transitions', () => {
  const result = transitionTiming(.8, 0, 0);
  assert.ok(Math.abs(result.start - .6) < 1e-9);
  assert.equal(result.fade, .2);
});
