// Run in the Playwright page at the local application URL. A click on the
// player first supplies the browser's required user activation.
async (page) => {
  await page.reload();
  await page.getByRole('button', { name: 'Pustit hudbu', exact: true }).click();
  await page.waitForFunction(() => document.body.classList.contains('is-playing'));
  await page.getByRole('button', { name: 'Pozastavit hudbu', exact: true }).first().click();
  return page.evaluate(async () => {
    const { LofiEngine, TRACKS } = await import('./audio.js');
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
      await bounded(engine.pause());
      const tracks = [];
      for (let index = 0; index < TRACKS.length; index++) {
        const track = TRACKS[index];
        const response = await fetch(`./assets/audio/${track.id}.mp3`, { method: 'HEAD' });
        if (!response.ok) throw new Error(`${track.id}: missing prepared audio`);
        const buffer = await bounded(engine.getBuffer(index));
        const expectedFrames = Math.round((track.bars || 32) * 4 * 60 / track.bpm * buffer.sampleRate);
        if (buffer.length !== expectedFrames) throw new Error(`${track.id}: decoded loop has the wrong length`);
        let peak = 0;
        let energy = 0;
        for (let c = 0; c < buffer.numberOfChannels; c++) {
          const samples = buffer.getChannelData(c);
          if (Math.abs(samples[0] - samples.at(-1)) > 0.00001) throw new Error(`${track.id}: broken loop seam`);
          for (const sample of samples) {
            if (!Number.isFinite(sample)) throw new Error(`${track.id}: non-finite sample`);
            peak = Math.max(peak, Math.abs(sample));
            energy += sample * sample;
          }
        }
        const signalRms = Math.sqrt(energy / buffer.length / buffer.numberOfChannels);
        if (peak > 1 || signalRms < 0.01) throw new Error(`${track.id}: clipped or silent audio`);
        tracks.push({ id: track.id, duration: buffer.duration, peak, rms: signalRms });
      }
      if (engine.cache.size > 3) throw new Error('Browsing the collection retained more than three decoded tracks');
      await bounded(engine.play(TRACKS.length - 1));
      if (engine.current.index !== TRACKS.length - 1) throw new Error('New track did not play');
      return { playingRms, mutedRms, pause: true, switch: true, cancellation: true, recovery: true, tracks, cachedTracks: engine.cache.size };
    } finally {
      await engine.context?.close();
    }
  });
}
