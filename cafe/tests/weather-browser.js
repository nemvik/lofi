async (page) => {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => localStorage.removeItem('pokoj.preferences.v1'));
  await page.reload();
  await page.locator('#motion-toggle').click();
  const labels = { 'rain-room': 'Déšť', 'night-roof': 'Vítr', 'snow-cabin': 'Sníh a vítr', cafe: 'Déšť' };
  for (const [id, label] of Object.entries(labels)) {
    await page.locator(`button[data-background="${id}"]`).click();
    await page.waitForFunction(id => document.querySelector('.cafe-scene').dataset.background === id, id);
    assert(await page.locator('#weather-label').textContent() === label, `${id}: wrong weather label`);
    const setLevel = value => page.locator('#rain-volume').evaluate((input, value) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
    await setLevel(0);
    const dry = await page.locator('#scene-animation').evaluate(canvas => canvas.toDataURL());
    await setLevel(100);
    const wet = await page.locator('#scene-animation').evaluate(canvas => canvas.toDataURL());
    assert(dry !== wet, `${id}: slider did not change the weather in the frozen scene`);
    await page.waitForTimeout(200);
    assert(await page.locator('#scene-animation').evaluate(canvas => canvas.toDataURL()) === wet,
      `${id}: slider restarted paused animation`);
  }
  await page.reload();
  assert(await page.locator('#rain-volume').inputValue() === '100', 'Weather intensity was not restored');
  assert(await page.locator('#motion-toggle').getAttribute('aria-pressed') === 'false', 'Motion choice was not restored');
  await page.locator('#auto-next').click();
  await page.reload();
  assert(await page.locator('#auto-next').getAttribute('aria-pressed') === 'false', 'Single-track choice was not restored');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Layout overflow at ${width}px`);
  }
  return { weatherLinkedInAllScenes: true, pausedSliderRedraw: true, weatherPersistence: true, singleTrackPersistence: true, mobileOverflow: false };
}
