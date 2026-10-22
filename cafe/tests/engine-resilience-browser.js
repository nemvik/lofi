// Exercise audio-clock scheduling and fallback with real, short AudioBuffers.
async (page) => {
  await page.locator('#play-button').click();
  await page.waitForFunction(() => document.body.classList.contains('is-playing'));
  await page.locator('#play-button').click();
  return page.evaluate(async () => {
    const { LofiEngine } = await import('./audio.js');
    const assert = (value, message) => { if (!value) throw new Error(message); };
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const makeBuffer = pitch => {
      const buffer = new AudioBuffer({ numberOfChannels: 2, length: 28800, sampleRate: 24000 });
      for (let c = 0; c < 2; c++) {
        const data = buffer.getChannelData(c);
        for (let i = 0; i < data.length; i++) data[i] = .15 * Math.sin(2 * Math.PI * pitch * i / 24000);
      }
      return buffer;
    };
    const watch = engine => {
      const analyser = engine.context.createAnalyser();
      analyser.fftSize = 2048;
      engine.master.connect(analyser);
      return () => {
        const samples = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(samples);
        return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
      };
    };
    const engines = [];
    const create = () => { const engine = new LofiEngine(); engines.push(engine); return engine; };
    try {
      const seamless = create();
      seamless.cache.set(0, Promise.resolve(makeBuffer(220)));
      seamless.cache.set(1, Promise.resolve(makeBuffer(330)));
      seamless.setPlaylist([0, 1]);
      const transitions = [];
      seamless.onTrackChange = index => transitions.push(index);
      await seamless.play(0);
      const rms = watch(seamless);
      await wait(400);
      let minimum = 1;
      for (let i = 0; i < 28; i++) { minimum = Math.min(minimum, rms()); await wait(80); }
      assert(minimum > .01, `Crossfade left a silent gap: RMS ${minimum}`);
      assert(transitions.includes(1) && transitions.includes(0), 'Audio did not advance and wrap');
      await seamless.pause();

      const delayed = create();
      delayed.cache.set(0, Promise.resolve(makeBuffer(220)));
      let resolveNext;
      delayed.cache.set(1, new Promise(resolve => { resolveNext = resolve; }));
      delayed.setPlaylist([0, 1]);
      await delayed.play(0);
      const delayedRms = watch(delayed);
      await wait(1450);
      assert(delayed.current.index === 0 && delayedRms() > .01, 'Slow preload interrupted the current loop');
      resolveNext(makeBuffer(330));
      await wait(40);
      assert(delayed.next.startedAt > delayed.context.currentTime, 'Delayed track was not scheduled in the future');
      await wait(1000);
      delayed.syncPlayback();
      assert(delayed.current.index === 1, 'Delayed preload never advanced');
      await delayed.pause();

      const failed = create();
      failed.cache.set(0, Promise.resolve(makeBuffer(220)));
      let rejectNext;
      failed.cache.set(1, new Promise((_, reject) => { rejectNext = reject; }));
      failed.setPlaylist([0, 1]);
      await failed.play(0);
      const failureRms = watch(failed);
      rejectNext(new Error('Simulated unavailable next track'));
      await wait(1400);
      assert(failed.playing && failed.current.index === 0 && !failed.next && failureRms() > .01,
        'Failed preload stopped or faded the current loop');
      await failed.pause();

      const canceled = create();
      canceled.cache.set(0, Promise.resolve(makeBuffer(220)));
      canceled.cache.set(2, Promise.resolve(makeBuffer(440)));
      let stale;
      canceled.cache.set(1, new Promise(resolve => { stale = resolve; }));
      canceled.setPlaylist([0, 1]);
      await canceled.play(0);
      await canceled.play(2);
      stale(makeBuffer(330));
      await wait(60);
      assert(canceled.current.index === 2 && !canceled.next, 'An old preload overrode manual navigation');
      canceled.setAmbience('rain', 70);
      canceled.setWeather('wind');
      await wait(300);
      assert(canceled.weatherKind === 'wind' && canceled.ambience.rain.gain.value > .8, 'Weather lost its audible level after changing environment');
      canceled.setWeather('snow');
      await wait(300);
      assert(canceled.weatherKind === 'snow' && canceled.ambience.rain.gain.value > .8, 'Snow profile lost the chosen weather level');
      return { crossfadeMinimumRms: minimum, transitions, delayedPreload: true, failedPreloadKeepsMusic: true,
        stalePreloadCanceled: true, weatherProfilesKeepLevel: true };
    } finally {
      for (const engine of engines) { await engine.pause(); await engine.context?.close(); }
    }
  });
}
