/** Small, transparent animation aligned to the original 1672 × 941 artwork. */
export class CafeScene {
  constructor(canvas, preference, onChange) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.preference = preference;
    this.onChange = onChange;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.inView = true;
    this.frame = null;
    this.time = 0;
    this.lastFrame = 0;
    this.tick = this.tick.bind(this);
    // Keep rain on the glass, clear of the window frame and pendant.
    this.window = new Path2D('M720 12H813V537H750V430H720Z M848 0H1447V80L1384 172V198L1564 206V538H848Z');
    this.drops = Array.from({ length: 62 }, (_, i) => ({
      x: 719 + ((i * 137.5) % 850), y: (i * 83.3) % 620,
      speed: 22 + (i % 7) * 5, length: 9 + (i % 5) * 3,
      alpha: 0.13 + (i % 4) * 0.04,
    }));
    if (!this.context) {
      this.onChange(false, false);
      return;
    }
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.inView = entry.isIntersecting;
      this.sync();
    });
    this.intersectionObserver.observe(canvas);
    this.reducedMotion.addEventListener('change', () => this.sync());
    document.addEventListener('visibilitychange', () => this.sync());
    window.addEventListener('pagehide', () => this.stop());
    window.addEventListener('pageshow', () => this.sync());
    this.resize();
    this.sync();
  }

  get enabled() {
    return Boolean(this.context) && (this.preference ?? !this.reducedMotion.matches);
  }

  setMotion(enabled) {
    this.preference = enabled;
    this.sync();
  }

  resize() {
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(this.width * this.ratio);
    this.canvas.height = Math.round(this.height * this.ratio);
    // Match the cover crop and horizontal position of the underlying image.
    this.position = Number(getComputedStyle(this.canvas).getPropertyValue('--scene-position')) || 0.5;
    this.draw();
  }

  sync() {
    this.onChange(this.enabled, this.reducedMotion.matches && this.preference === null);
    if (this.enabled && this.inView && !document.hidden) {
      if (this.frame === null) this.frame = requestAnimationFrame(this.tick);
    } else this.stop();
  }

  stop() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.lastFrame = 0;
  }

  tick(now) {
    this.frame = requestAnimationFrame(this.tick);
    if (this.lastFrame && now - this.lastFrame < 1000 / 24) return;
    this.time += this.lastFrame ? Math.min((now - this.lastFrame) / 1000, 0.1) : 0;
    this.lastFrame = now;
    this.draw();
  }

  glow(x, y, radius, alpha) {
    const ctx = this.context;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, `rgba(255, 194, 111, ${alpha})`);
    glow.addColorStop(0.45, `rgba(255, 175, 75, ${alpha * 0.35})`);
    glow.addColorStop(1, 'rgba(255, 175, 75, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  draw() {
    if (!this.context || !this.width || !this.height) return;
    const ctx = this.context;
    const t = this.time;
    const scale = Math.max(this.width / 1672, this.height / 941);
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.translate((this.width - 1672 * scale) * this.position, (this.height - 941 * scale) / 2);
    ctx.scale(scale, scale);

    this.glow(1498, 210, 230, 0.105 + Math.sin(t * 0.6) * 0.014);
    this.glow(1538, 724, 66, 0.16 + Math.sin(t * 2.3) * 0.02 + Math.sin(t * 4.1) * 0.008);
    this.glow(778, 539, 45, 0.12 + Math.sin(t * 1.8) * 0.015);

    ctx.save();
    ctx.clip(this.window);
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    for (const drop of this.drops) {
      const y = (drop.y + t * drop.speed) % 640 - 50;
      const x = drop.x - y * 0.045;
      ctx.strokeStyle = `rgba(203, 222, 235, ${drop.alpha})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 1.1, y + drop.length);
      ctx.stroke();
    }
    ctx.restore();

    // Slow wisps fade before restarting, anchored to the drawn cup.
    for (let i = 0; i < 3; i++) {
      const phase = (t / 7 + i / 3) % 1;
      const opacity = Math.sin(phase * Math.PI) ** 2;
      const lift = phase * 58;
      const x = 1247 + Math.sin(t * 0.7 + i * 2) * 7 + (i - 1) * 12;
      const y = 658 - lift;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x - 22, y - 24, x + 24, y - 44, x + 5, y - 67);
      ctx.bezierCurveTo(x - 10, y - 85, x - 12, y - 98, x + 3, y - 113);
      ctx.lineWidth = 9;
      ctx.strokeStyle = `rgba(244, 226, 199, ${opacity * 0.025})`;
      ctx.stroke();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = `rgba(244, 226, 199, ${opacity * 0.13})`;
      ctx.stroke();
    }

    for (let i = 0; i < 12; i++) {
      const phase = (t / (18 + i) + i * 0.137) % 1;
      const x = 1370 + (i * 41) % 190 + Math.sin(t * 0.2 + i) * 11;
      const y = 250 + phase * 270;
      ctx.fillStyle = `rgba(255, 218, 151, ${Math.sin(phase * Math.PI) * 0.25})`;
      ctx.beginPath();
      ctx.arc(x, y, i % 3 === 0 ? 1.5 : 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
