// Real Web Audio sources, with short WAV responses to exercise complete songs quickly.
async (page) => {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const errors = [];
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  const audioRoute = '**/assets/audio/*.mp3';
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const wav = await page.evaluate(async () => {
      const { encodeWav } = await import('./model.js');
      const buffer = new AudioBuffer({ numberOfChannels: 2, length: 24000 * 2, sampleRate: 24000 });
      for (let c = 0; c < 2; c++) {
        const data = buffer.getChannelData(c);
        for (let i = 0; i < data.length; i++) data[i] = Math.sin(i / 24000 * Math.PI * 2 * 220) * .1;
      }
      return Array.from(new Uint8Array(encodeWav(buffer)));
    });
    await page.route(audioRoute, route => route.fulfill({ contentType: 'audio/wav', body: Buffer.from(wav) }));
    await page.evaluate(() => localStorage.removeItem('pokoj.preferences.v1'));
    await page.reload();
    assert(await page.locator('#auto-next').count() === 1, 'Missing automatic continuation control');
    await page.locator('[data-style="house"]').click();
    const titles = await page.locator('.mood strong').allTextContents();
    await page.locator('#play-button').click();
    await page.waitForFunction(() => document.body.classList.contains('is-playing'));
    const transitions = [];
    for (const title of [...titles.slice(1), titles[0]]) {
      await page.waitForFunction(title => document.querySelector('#track-title').textContent === title, title, { timeout: 7000 });
      transitions.push(title);
    }
    // The audio clock continues during a busy main thread. A click at this
    // boundary must keep the user's explicit choice and its visible title.
    await page.evaluate(() => {
      const until = performance.now() + 1750;
      while (performance.now() < until) { /* Simulate a busy background tab. */ }
      document.querySelector('.mood:last-child').click();
    });
    await page.waitForFunction(() => !document.body.classList.contains('is-loading'));
    assert(await page.locator('#track-title').textContent() === titles.at(-1), 'Automatic transition overwrote a manual boundary selection');
    await page.locator('#auto-next').click();
    const stoppedTitle = await page.locator('#track-title').textContent();
    await page.waitForTimeout(2500);
    assert(await page.locator('#track-title').textContent() === stoppedTitle, 'Single-track mode advanced');
    await page.locator('#auto-next').click();
    await page.locator('#play-button').click();
    const pausedTitle = await page.locator('#track-title').textContent();
    await page.waitForTimeout(2200);
    assert(await page.locator('#track-title').textContent() === pausedTitle, 'Paused playback advanced');
    await page.locator('#play-button').click();
    await page.waitForFunction(title => document.querySelector('#track-title').textContent !== title, pausedTitle, { timeout: 7000 });
    await page.locator('[data-style="hiphop"]').click();
    const hiphop = await page.locator('.mood strong').allTextContents();
    await page.waitForTimeout(2200);
    assert(hiphop.includes(await page.locator('#track-title').textContent()), 'Queued track escaped the new style');
    await page.locator('#play-button').click();
    await page.reload();
    assert(!await page.locator('body').evaluate(body => body.classList.contains('is-playing')), 'Reload autoplayed');
    assert(errors.length === 0, errors.join(', '));
    return { automaticTransitions: transitions, wrap: true, singleTrack: true, pauseResume: true, styleSwitch: true, noAutoplay: true, errors };
  } finally {
    await page.unroute(audioRoute);
    page.off('pageerror', onError);
  }
}
