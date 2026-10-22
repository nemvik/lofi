// Run on the local player with Playwright's page fixture.
async (page) => {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const errors = [];
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  const pixelsChange = () => page.evaluate(async () => {
    const canvas = document.querySelector('#scene-animation');
    const before = canvas.toDataURL();
    await new Promise(resolve => setTimeout(resolve, 400));
    return before !== canvas.toDataURL();
  });
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => localStorage.removeItem('pokoj.preferences.v1'));
    await page.reload();
    assert(await page.locator('button[data-background]').count() === 4, 'Missing background choices');
    for (const id of ['rain-room', 'night-roof', 'snow-cabin', 'cafe']) {
      await page.locator(`button[data-background="${id}"]`).click();
      await page.waitForFunction(id => document.querySelector('.cafe-scene').dataset.background === id, id);
      assert(await page.locator('.scene-art').evaluate(img => img.complete && img.naturalWidth > 0), `${id}: image did not load`);
      assert(await pixelsChange(), `${id}: background is static`);
      await page.locator('#motion-toggle').click();
      assert(!await pixelsChange(), `${id}: motion did not pause`);
      await page.locator('#motion-toggle').click();
    }
    await page.locator('button[data-background="snow-cabin"]').click();
    await page.waitForFunction(() => document.querySelector('.cafe-scene').dataset.background === 'snow-cabin');
    await page.reload();
    await page.waitForFunction(() => document.querySelector('.cafe-scene').dataset.background === 'snow-cabin');
    assert(await page.locator('button[data-background="snow-cabin"]').getAttribute('aria-pressed') === 'true', 'Background selection did not survive reload');
    await page.locator('[data-style="house"]').click();
    assert(await page.locator('.cafe-scene').getAttribute('data-background') === 'snow-cabin', 'Music style changed the background');
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('#focus-mode').click();
    assert(await page.locator('#motion-toggle').isVisible(), 'Focus mode lost motion control');
    assert(await pixelsChange(), 'Pixel art stopped animating in focus mode');
    await page.keyboard.press('Escape');
    await page.evaluate(() => localStorage.removeItem('pokoj.preferences.v1'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    assert(!await pixelsChange(), 'Pixel scene ignored reduced motion');
    assert(errors.length === 0, errors.join(', '));
    return { backgrounds: 4, animated: true, pause: true, persistence: true, independentOfMusic: true, focus: true, reducedMotion: true, mobileOverflow: false, errors };
  } finally {
    page.off('pageerror', onError);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
}
