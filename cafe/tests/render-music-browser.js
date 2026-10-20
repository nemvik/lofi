// Run with Playwright at the local app URL. Exports reproducible, original
// masters to ignored artifacts/; ffmpeg encodes these into the shipped MP3s.
async (page) => {
  await page.reload();
  const tracks = await page.evaluate(async () => {
    const { TRACKS } = await import('./catalog.js');
    return TRACKS.map((track, index) => ({ ...track, index })).filter(track => track.arrangement);
  });
  const results = [];
  for (const track of tracks) {
    const signal = await page.evaluate(async index => {
      const { TRACKS, renderTrack } = await import('./audio.js');
      const { encodeWav } = await import('./model.js');
      const track = TRACKS[index];
      const buffer = await renderTrack(track);
      const expectedFrames = Math.round((track.bars || 32) * 4 * 60 / track.bpm * buffer.sampleRate);
      if (buffer.length !== expectedFrames) throw new Error(`${track.id}: wrong arrangement length`);
      let peak = 0;
      let squareSum = 0;
      let seam = 0;
      for (let c = 0; c < buffer.numberOfChannels; c++) {
        const samples = buffer.getChannelData(c);
        seam = Math.max(seam, Math.abs(samples[0] - samples[samples.length - 1]));
        for (const sample of samples) {
          if (!Number.isFinite(sample)) throw new Error(`${track.id}: non-finite audio`);
          peak = Math.max(peak, Math.abs(sample));
          squareSum += sample * sample;
        }
      }
      const rms = Math.sqrt(squareSum / (buffer.length * buffer.numberOfChannels));
      if (peak > 0.9 || rms < 0.01 || seam > 0.00001) throw new Error(`${track.id}: invalid signal`);
      window.masterDownload = URL.createObjectURL(new Blob([encodeWav(buffer)], { type: 'audio/wav' }));
      return { id: track.id, duration: buffer.duration, peak, rms, seam };
    }, track.index);
    const downloadEvent = page.waitForEvent('download', { timeout: 15000 });
    await page.evaluate(id => {
      const link = document.createElement('a');
      link.href = window.masterDownload;
      link.download = `pokoj-${id}.wav`;
      document.body.append(link);
      link.click();
      link.remove();
    }, track.id);
    const download = await downloadEvent;
    await download.saveAs(`/home/viktornemcok/Personal/lofi/cafe/artifacts/${download.suggestedFilename()}`);
    await page.evaluate(() => { URL.revokeObjectURL(window.masterDownload); delete window.masterDownload; });
    results.push(signal);
  }
  return results;
}
