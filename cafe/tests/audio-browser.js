// Run in the Playwright page at the local application URL. A click on the
// player first supplies the browser's required user activation.
async (page) => {
  await page.reload();
  await page.getByRole('button', { name: 'Pustit hudbu', exact: true }).click();
  await page.waitForFunction(() => document.body.classList.contains('is-playing'));
  await page.getByRole('button', { name: 'Pozastavit hudbu', exact: true }).first().click();
  return page.evaluate(async () => {
    const { LofiEngine } = await import('./audio.js');
    const engine = new LofiEngine();
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const bounded = async promise => {
      let timeout;
      try {
        return await Promise.race([
          promise,
          new Promise((_, reject) => {
            timeout = setTimeout(() => reject(new Error('Audio operation did not settle')), 3000);
          }),
        ]);
      } finally {
        clearTimeout(timeout);
      }
    };
    try {
      await bounded(engine.play(0));
      const analyser = engine.context.createAnalyser();
      analyser.fftSize = 2048;
      engine.master.connect(analyser);
      const rms = () => {
        const data = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(data);
        return Math.sqrt(data.reduce((sum, value) => sum + value * value, 0) / data.length);
      };
      await wait(1300);
      const playingRms = rms();
      if (!(playingRms > 0.001)) throw new Error('Playback is silent');
      engine.setMuted(true);
      await wait(400);
      const mutedRms = rms();
      if (!(mutedRms < 0.00001)) throw new Error('Mute did not silence the output');
      engine.setMuted(false);
      await bounded(engine.pause());
      const pausedAt = engine.context.currentTime;
      await wait(150);
      if (engine.context.currentTime !== pausedAt) throw new Error('Pause did not stop the audio clock');
      await bounded(engine.play(1));
      if (engine.current.index !== 1 || engine.context.state !== 'running') throw new Error('Track switch failed');
      await bounded(engine.pause());
      // Regression: a resume immediately followed by suspend used to hang.
      const play = engine.play(2);
      const pause = engine.pause();
      const results = await bounded(Promise.all([play, pause]));
      if (results[0] !== false || engine.playing || engine.context.state !== 'suspended') {
        throw new Error('Canceled playback started or did not settle');
      }
      await bounded(engine.play(0));
      if (!engine.playing) throw new Error('Playback could not recover after cancellation');
      return { playingRms, mutedRms, pause: true, switch: true, cancellation: true, recovery: true };
    } finally {
      await engine.context?.close();
    }
  });
}
