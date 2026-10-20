// Browser acceptance checks for the expanded collection and animated artwork.
async (page) => {
  const errors = [];
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const pixelsChange = () => page.evaluate(async () => {
    const canvas = document.querySelector('#scene-animation');
    const before = canvas.toDataURL();
    await new Promise(resolve => setTimeout(resolve, 350));
    return before !== canvas.toDataURL();
  });
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => localStorage.removeItem('pokoj.preferences.v1'));
    await page.reload();
    await page.locator('.mood').last().waitFor();
    assert(await page.locator('.mood').count() === 9, 'Missing tracks in the collection');
    assert(await pixelsChange(), 'Enabled background did not animate');
    await page.locator('#motion-toggle').click();
    assert(!await pixelsChange(), 'Paused background kept moving');
    await page.locator('[data-track="8"]').click();
    await page.reload();
    assert(await page.locator('#track-title').textContent() === 'Poslední tramvaj', 'New selection was not restored');
    assert(await page.locator('#motion-toggle').getAttribute('aria-pressed') === 'false', 'Motion preference was not restored');
    assert(!await pixelsChange(), 'Background moved after restoring paused preference');
    assert(!await page.locator('body').evaluate(body => body.classList.contains('is-playing')), 'Reload unexpectedly played audio');
    await page.locator('#next-track').click();
    assert(await page.locator('#track-title').textContent() === 'Café crème', 'Next did not wrap the collection');
    await page.locator('#previous-track').click();
    assert(await page.locator('#track-title').textContent() === 'Poslední tramvaj', 'Previous did not wrap the collection');

    await page.locator('#focus-mode').click();
    assert(await page.locator('#motion-toggle').isVisible(), 'Focus mode hid the motion control');
    await page.locator('#motion-toggle').click();
    assert(await pixelsChange(), 'Focus scene did not animate');
    await page.keyboard.press('Escape');
    assert(await page.locator('#focus-mode').evaluate(button => button === document.activeElement), 'Focus did not return to its trigger');

    await page.evaluate(() => localStorage.removeItem('pokoj.preferences.v1'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    assert(await page.locator('#motion-toggle').getAttribute('aria-pressed') === 'false', 'System reduced motion was ignored');
    assert(!await pixelsChange(), 'Reduced-motion background moved');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => document.querySelector('#motion-toggle').getAttribute('aria-pressed') === 'true');
    assert(await pixelsChange(), 'Live system motion change was ignored');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    assert(await pixelsChange(), 'Mobile background did not animate');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile layout overflows horizontally');
    await page.locator('#timer-start').scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    assert(!await pixelsChange(), 'Offscreen background kept rendering');
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(150);
    assert(await pixelsChange(), 'Background failed to resume on returning to view');
    assert(errors.length === 0, `Browser errors: ${errors.join(', ')}`);
    return { tracks: 9, restoration: true, wrap: true, motionToggle: true, focus: true,
      reducedMotion: true, liveSystemChange: true, offscreenPause: true, mobileOverflow: false, errors };
  } finally {
    page.off('pageerror', onError);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
}
