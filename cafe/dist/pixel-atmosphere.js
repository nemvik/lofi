/** Pixel-aligned particles on the same 480 × 270 stage as the background art. */
import { drawSceneStory } from './scene-stories.js';

export function drawPixelAtmosphere(ctx, background, time, weather = { intensity: 0 }) {
  const t = Math.floor(time * 12) / 12;
  const pixel = (x, y, width, height, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), width, height);
  };

  // Stepped bands of light keep the glow on the pixel grid.
  for (const [x, y, radius] of background.lights || []) {
    const flicker = .8 + Math.sin(t * 1.3) * .12 + Math.sin(t * 3.1) * .06;
    for (let band = 4; band > 0; band--) {
      const size = Math.round(radius * band / 4);
      pixel(x - size, y - size, size * 2, size * 2, `rgba(255, 188, 95, ${.014 * flicker})`);
    }
  }

  drawSceneStory(ctx, background.story, t);

  if (background.effect === 'rain' && weather.intensity > 0) {
    ctx.save();
    ctx.beginPath();
    for (const [x, y, width, height] of background.windows) ctx.rect(x, y, width, height);
    ctx.clip();
    for (let i = 0; i < Math.round(140 * weather.intensity); i++) {
      const y = (i * 31 + t * (18 + weather.intensity * 30 + i % 7 * 4)) % 180;
      const x = 120 + (i * 29) % 275 - y * .035;
      pixel(x, y, 1, 3 + i % 4, `rgba(164, 198, 230, ${.17 + i % 4 * .07})`);
    }
    for (let i = 0; i < Math.round(18 * weather.intensity); i++) {
      const y = (i * 19 + t * (3 + i % 3)) % 160;
      pixel(131 + i * 23, y, 1, 2, 'rgba(207, 221, 238, .45)');
    }
    ctx.restore();
  }

  if (background.effect === 'stars') {
    for (let i = 0; i < 35; i++) {
      const x = 15 + (i * 61) % 400;
      const y = 6 + (i * 31) % background.sky;
      const opacity = .18 + (Math.sin(t * (.65 + i % 4 * .14) + i * 2) + 1) * .3;
      pixel(x, y, 1, 1, `rgba(246, 226, 201, ${opacity})`);
      if (i % 9 === 0) {
        pixel(x - 1, y, 3, 1, `rgba(246, 226, 201, ${opacity * .6})`);
        pixel(x, y - 1, 1, 3, `rgba(246, 226, 201, ${opacity * .6})`);
      }
    }
    // One quiet shooting star, once every half minute.
    const meteor = t % 32;
    if (meteor > 20 && meteor < 21.4) {
      const phase = (meteor - 20) / 1.4;
      for (let i = 0; i < 9; i++) {
        pixel(155 + phase * 85 - i * 2, 18 + phase * 29 - i, 2, 1,
          `rgba(242, 221, 203, ${(1 - i / 9) * Math.sin(phase * Math.PI) * .65})`);
      }
    }
  }

  if (background.effect === 'snow' && weather.intensity > 0) {
    // Two speeds create depth without moving the scene itself.
    for (let i = 0; i < Math.round(125 * weather.intensity); i++) {
      const depth = i % 3;
      const y = (i * 43 + t * (4 + weather.intensity * 6 + depth * 5)) % 278 - 4;
      const x = ((i * 67 + t * (2 + depth) + Math.sin(t * .5 + i) * 5) % 488) - 4;
      pixel(x, y, depth === 2 ? 2 : 1, depth === 2 ? 2 : 1,
        `rgba(224, 233, 249, ${.28 + depth * .2})`);
    }
  }

  if (background.effect === 'stars' && weather.intensity > 0) {
    // Rooftop wind carries a few leaves from the plants across the terrace.
    for (let i = 0; i < Math.round(12 * weather.intensity); i++) {
      const phase = (t / (14 - weather.intensity * 7) + i / 12) % 1;
      const x = 465 - phase * 400;
      const y = 190 + Math.sin(phase * 12 + i) * 12 + phase * 30;
      pixel(x, y, 2, 1, 'rgba(174, 154, 110, .65)');
      pixel(x + 1, y - 1, 1, 1, 'rgba(174, 154, 110, .45)');
    }
  }

  const plume = (origin, smoke) => {
    for (let i = 0; i < 9; i++) {
      const phase = (t / (smoke ? 9 : 5) + i / 9) % 1;
      const opacity = Math.sin(phase * Math.PI) * (smoke ? .18 : .32);
      const x = origin[0] + Math.sin(phase * 5 + t * .4) * (smoke ? 5 : 2);
      const y = origin[1] - phase * (smoke ? 28 : 17);
      const size = smoke ? 3 + Math.floor(phase * 4) : 2;
      pixel(x, y, size, 2, `rgba(213, 217, 229, ${opacity})`);
    }
  };
  if (background.cup) plume(background.cup, false);
  if (background.chimney) plume(background.chimney, true);
}
