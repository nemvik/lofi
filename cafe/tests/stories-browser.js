async (page) => {
  return page.evaluate(async () => {
    const { drawSceneStory } = await import('./scene-stories.js');
    const result = [];
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 270;
    const ctx = canvas.getContext('2d');
    for (const story of ['cat', 'train', 'fox', 'tram']) {
      ctx.clearRect(0, 0, 480, 270);
      drawSceneStory(ctx, story, 10);
      const first = canvas.toDataURL();
      if (!ctx.getImageData(0, 0, 480, 270).data.some((value, i) => i % 4 === 3 && value > 0)) {
        throw new Error(`${story}: no visible story`);
      }
      ctx.clearRect(0, 0, 480, 270);
      drawSceneStory(ctx, story, 11);
      if (canvas.toDataURL() === first) throw new Error(`${story}: story did not advance`);
      result.push(story);
    }
    return { stories: result, visible: true, moving: true };
  });
}
