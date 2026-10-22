// Acceptance checks: filtering, navigation within a style, and saved selection.
async (page) => {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  await page.evaluate(() => localStorage.removeItem('pokoj.preferences.v1'));
  await page.reload();
  const styles = page.locator('#music-styles button');
  assert(await styles.count() >= 4, 'Missing music style choices');
  await page.getByRole('button', { name: 'Všechny styly', exact: true }).click();
  assert(await page.locator('.mood:visible').count() >= 15, 'Missing expanded collection');
  for (const name of ['Lo-fi hip-hop', 'Chill house']) {
    await page.getByRole('button', { name, exact: true }).click();
    const tracks = page.locator('.mood:visible');
    assert(await tracks.count() >= 3, `${name}: fewer than three tracks`);
    const titles = await tracks.locator('strong').allTextContents();
    assert(titles.includes(await page.locator('#track-title').textContent()), 'Style switch left a hidden track selected');
    await tracks.last().click();
    await page.locator('#next-track').click();
    assert(await page.locator('#track-title').textContent() === titles[0], 'Next escaped the selected style');
    await page.locator('#previous-track').click();
    assert(await page.locator('#track-title').textContent() === titles.at(-1), 'Previous escaped the selected style');
    await page.reload();
    assert(await page.getByRole('button', { name, exact: true }).getAttribute('aria-pressed') === 'true', 'Saved track did not restore its style');
    assert(await page.locator('#track-title').textContent() === titles.at(-1), 'Saved selection was lost');
    assert(!await page.locator('body').evaluate(body => body.classList.contains('is-playing')), 'Reload started playback');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Style controls overflow on mobile');
  await page.getByRole('button', { name: 'Lo-fi hip-hop', exact: true }).click();
  await page.locator('#play-button').click();
  await page.waitForFunction(() => document.body.classList.contains('is-playing') && !document.body.classList.contains('is-loading'));
  await page.getByRole('button', { name: 'Chill house', exact: true }).click();
  await page.waitForFunction(() => document.body.classList.contains('is-playing') && !document.body.classList.contains('is-loading'));
  assert(await page.locator('#track-title').textContent() === 'Sluneční terasa', 'Playing style switch selected the wrong song');
  assert(await page.title() === 'Sluneční terasa — Pokoj', 'Playing metadata was not updated');
  const downloaded = page.waitForEvent('download');
  await page.locator('#download-track').click();
  const download = await downloaded;
  assert(download.suggestedFilename() === 'pokoj-slunecni-terasa.wav', 'Export used the previous style');
  await page.locator('#play-button').click();
  await page.waitForFunction(() => !document.body.classList.contains('is-playing'));
  return { styles: 3, newTracks: 6, filtering: true, navigation: true, restoration: true, playingStyleSwitch: true, wavExport: true, mobileOverflow: false };
}
