export function nextTrackIndex(indices, current, direction = 1) {
  if (!indices.length) return null;
  const position = indices.indexOf(current);
  if (position < 0) return direction < 0 ? indices.at(-1) : indices[0];
  return indices[(position + direction + indices.length) % indices.length];
}

// Stay on a musical loop boundary even when decoding the next track is slow.
export function transitionTiming(duration, startedAt, now) {
  const fade = Math.min(1.1, duration / 4);
  const first = startedAt + duration - fade;
  const skipped = Math.max(0, Math.ceil((now + .05 - first) / duration));
  return { start: first + skipped * duration, fade };
}
