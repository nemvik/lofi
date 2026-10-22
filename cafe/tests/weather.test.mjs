import test from 'node:test';
import assert from 'node:assert/strict';
import { findBackground, weatherState } from '../dist/backgrounds.js';

test('weather follows the selected place and one bounded intensity', () => {
  assert.deepEqual(weatherState(findBackground('rain-room'), 60), { kind: 'rain', intensity: .6 });
  assert.deepEqual(weatherState(findBackground('night-roof'), 60), { kind: 'wind', intensity: .6 });
  assert.deepEqual(weatherState(findBackground('snow-cabin'), 60), { kind: 'snow', intensity: .6 });
  assert.deepEqual(weatherState(findBackground('cafe'), 0), { kind: 'rain', intensity: 0 });
  assert.equal(weatherState(findBackground('rain-room'), 900).intensity, 1);
  assert.equal(weatherState(findBackground('rain-room'), -2).intensity, 0);
  assert.equal(weatherState(findBackground('rain-room'), NaN).intensity, 0);
});
