/** Tiny, quiet vignettes drawn in the environment's existing 480 × 270 grid. */
export function drawSceneStory(ctx, story, time) {
  const t = Math.floor(time * 8) / 8;
  const rect = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };

  if (story === 'cat') {
    // Curled up on the desk chair: breathing, a sleepy blink and a tail twitch.
    const x = 300;
    const y = 217;
    const breath = Math.sin(t * 1.5) > .6 ? -1 : 0;
    const twitch = t % 27 > 22 ? Math.round(Math.sin(t * 4)) : 0;
    rect(x - 12, y + 3, 29, 3, '#201d25');
    rect(x - 10, y - 3 + breath, 18, 8, '#ad7950');
    rect(x - 7, y - 5 + breath, 11, 3, '#c59361');
    rect(x + 4, y - 5, 9, 8, '#c59361');
    rect(x + 4, y - 8, 3, 4, '#c59361');
    rect(x + 10, y - 8, 3, 4, '#b27c54');
    rect(x + 5, y - 7, 1, 2, '#80574c');
    rect(x + 11, y - 7, 1, 2, '#80574c');
    rect(x + 5, y - 1, 2, 1, '#3b3030');
    rect(x + 10, y - 1, 2, 1, '#3b3030');
    if (t % 39 > 33 && t % 39 < 35) rect(x + 10, y - 2, 1, 1, '#d6bd81');
    rect(x + 8, y + 1, 1, 1, '#72493e');
    rect(x - 12, y + twitch, 5, 4, '#bf8d5c');
    rect(x - 10, y + 3 + twitch, 10, 2, '#d3a371');
    rect(x - 5, y - 4 + breath, 2, 3, '#895e46');
  }

  if (story === 'train') {
    // The far-away bridge gets a little train, then returns to silence.
    const phase = t % 42;
    if (phase >= 4 && phase <= 18) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(204, 133, 128, 6);
      ctx.clip();
      const x = 191 + (phase - 4) * 11;
      for (let car = 0; car < 3; car++) {
        rect(x - car * 9, 134, 8, 3, '#a89993');
        rect(x + 1 - car * 9, 135, 2, 1, '#f3c78a');
        rect(x + 4 - car * 9, 135, 2, 1, '#f3c78a');
        rect(x + 1 - car * 9, 137, 6, 1, '#463947');
      }
      ctx.restore();
    }
    // A moth traces slow, small loops around the terrace lantern.
    const x = 447 + Math.cos(t * .55) * 9;
    const y = 195 + Math.sin(t * .8) * 7;
    rect(x, y, 1, 2, '#f0cba1');
    if (Math.floor(t * 6) % 2) rect(x - 1, y, 3, 1, '#c3ab9d');
  }

  if (story === 'fox') {
    // A visitor follows the snowy path, pauses, and slips back into the trees.
    const phase = t % 54;
    if (phase >= 6 && phase <= 27) {
      const progress = Math.min(1, (phase - 6) / 9);
      const departing = phase > 21;
      const x = departing ? 339 - (phase - 21) * 8 : 268 + progress * 71;
      const y = 201 - Math.min(1, (x - 268) / 71) * 12;
      const step = phase < 15 || departing ? Math.floor(t * 5) % 2 : 0;
      ctx.save();
      if (departing) { ctx.translate(Math.round(x) * 2, 0); ctx.scale(-1, 1); }
      rect(x - 11, y + 3, 24, 2, '#535470');
      rect(x - 8, y - 3, 14, 6, '#bd794d');
      rect(x - 12, y - 1, 8, 4, '#c88959');
      rect(x - 14, y, 4, 3, '#ded3c7');
      rect(x + 4, y - 7, 6, 7, '#c88c5d');
      rect(x + 4, y - 9, 2, 3, '#aa694a');
      rect(x + 8, y - 9, 2, 3, '#aa694a');
      rect(x + 8, y - 3, 5, 2, '#e3d2be');
      rect(x + 12, y - 3, 1, 1, '#323044');
      rect(x + 8, y - 5, 1, 1, '#302b37');
      rect(x - 5, y + 2, 2, 3 + step, '#4e3d43');
      rect(x + 3, y + 2, 2, 4 - step, '#4e3d43');
      ctx.restore();
    }
  }

  if (story === 'tram') {
    const phase = t % 46;
    if (phase >= 7 && phase <= 23) {
      const x = 208 + (phase - 7) * 16;
      rect(x, 133, 24, 7, '#a86a42');
      rect(x + 1, 132, 22, 2, '#dbc098');
      for (let i = 0; i < 5; i++) rect(x + 2 + i * 4, 135, 3, 2, '#e0b875');
      rect(x + 2, 140, 4, 1, '#302f31');
      rect(x + 18, 140, 4, 1, '#302f31');
    }
  }
}
