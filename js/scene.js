/* Decorative geometry, rendered locally. No external animation runtime. */
window.FAOrb = class FAOrb {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = null;
    try {
      this.context = canvas?.getContext("2d", { alpha: true });
    } catch {
      /* Keep the SVG fallback. */
    }
    if (!this.context) return;
    this.frameId = 0;
    this.elapsed = 1.2;
    this.lastTime = 0;
    this.inView = true;
    this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.rows = window.innerWidth < 760 ? 22 : 30;
    this.columns = 112;
    this.geometry = new Float32Array(this.rows * this.columns * 3);
    this.projected = new Float32Array(this.geometry.length);
    for (let row = 0; row < this.rows; row++) {
      const v = (row / this.rows) * Math.PI * 2;
      for (let col = 0; col < this.columns; col++) {
        const u = (col / this.columns) * Math.PI * 2;
        const radius = 1.24 + 0.15 * Math.cos(u * 3);
        const tube = 0.47 + 0.08 * Math.sin(u * 2);
        const at = (row * this.columns + col) * 3;
        this.geometry[at] = (radius + tube * Math.cos(v)) * Math.cos(u);
        this.geometry[at + 1] = (radius + tube * Math.cos(v)) * Math.sin(u);
        this.geometry[at + 2] = tube * Math.sin(v) + 0.24 * Math.sin(u * 3);
      }
    }
    this.frame = this.frame.bind(this);
    this.resize = this.resize.bind(this);
    this.sync = this.sync.bind(this);
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(this.resize);
      this.resizeObserver.observe(canvas.parentElement);
    } else window.addEventListener("resize", this.resize, { passive: true });
    if (typeof IntersectionObserver !== "undefined") {
      this.viewObserver = new IntersectionObserver(
        (entries) => {
          this.inView = entries[0].isIntersecting;
          this.sync();
        },
        { rootMargin: "70px" },
      );
      this.viewObserver.observe(canvas);
    }
    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener(
        "pointermove",
        (event) => {
          if (!this.enabled()) return;
          this.pointer.targetX =
            event.clientX / Math.max(window.innerWidth, 1) - 0.5;
          this.pointer.targetY =
            event.clientY / Math.max(window.innerHeight, 1) - 0.5;
        },
        { passive: true },
      );
    }
    document.addEventListener("portfolio:motion", this.sync);
    document.addEventListener("visibilitychange", this.sync);
    this.resize();
    canvas.parentElement.classList.add("canvas-ready");
    this.sync();
  }
  enabled() {
    return (
      document.documentElement.dataset.motion !== "off" &&
      !document.hidden &&
      this.inView
    );
  }
  resize() {
    const bounds = this.canvas.parentElement.getBoundingClientRect();
    this.width = Math.max(1, bounds.width || 640);
    this.height = Math.max(1, bounds.height || 640);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render();
  }
  sync() {
    if (this.enabled()) {
      if (!this.frameId) {
        this.lastTime = 0;
        this.frameId = requestAnimationFrame(this.frame);
      }
    } else {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
      this.lastTime = 0;
    }
  }
  frame(now) {
    this.frameId = 0;
    if (!this.enabled()) return;
    if (!this.lastTime || now - this.lastTime >= 26) {
      this.elapsed += this.lastTime
        ? Math.min(now - this.lastTime, 60) / 1000
        : 0;
      this.lastTime = now;
      this.pointer.x += (this.pointer.targetX - this.pointer.x) * 0.06;
      this.pointer.y += (this.pointer.targetY - this.pointer.y) * 0.06;
      this.render();
    }
    this.frameId = requestAnimationFrame(this.frame);
  }
  render() {
    const ctx = this.context;
    const t = this.elapsed;
    const ax = 0.84 + Math.sin(t * 0.16) * 0.28 + this.pointer.y * 0.45;
    const ay = -0.3 + t * 0.14 + this.pointer.x * 0.6;
    const az = -0.44 + Math.sin(t * 0.12) * 0.3;
    const sx = Math.sin(ax),
      cx = Math.cos(ax),
      sy = Math.sin(ay),
      cy = Math.cos(ay),
      sz = Math.sin(az),
      cz = Math.cos(az);
    const scale = Math.min(this.width, this.height) * 0.235;
    const centerX = this.width * 0.51,
      centerY = this.height * 0.52;
    ctx.clearRect(0, 0, this.width, this.height);
    for (let i = 0; i < this.geometry.length; i += 3) {
      const x = this.geometry[i],
        y = this.geometry[i + 1],
        z = this.geometry[i + 2];
      const a = x * cy + z * sy,
        b = z * cy - x * sy;
      const c = y * cx - b * sx,
        d = y * sx + b * cx;
      const depth = 4.5 / (4.5 + d);
      this.projected[i] = centerX + (a * cz - c * sz) * scale * depth;
      this.projected[i + 1] = centerY + (a * sz + c * cz) * scale * depth;
      this.projected[i + 2] = d;
    }
    ctx.lineWidth = 0.7;
    ctx.lineJoin = "round";
    for (let row = 0; row < this.rows; row++) {
      ctx.beginPath();
      let depth = 0;
      for (let col = 0; col <= this.columns; col++) {
        const at = (row * this.columns + (col % this.columns)) * 3;
        if (!col) ctx.moveTo(this.projected[at], this.projected[at + 1]);
        else ctx.lineTo(this.projected[at], this.projected[at + 1]);
        depth += this.projected[at + 2];
      }
      const opacity = 0.3 + (1 - (depth / this.columns + 1.8) / 3.6) * 0.45;
      ctx.strokeStyle =
        row % 7 === 0
          ? `rgba(224,212,255,${opacity})`
          : `rgba(163,138,255,${opacity})`;
      ctx.stroke();
    }
    ctx.lineWidth = 0.5;
    for (let col = 0; col < this.columns; col += 4) {
      ctx.beginPath();
      for (let row = 0; row <= this.rows; row++) {
        const at = ((row % this.rows) * this.columns + col) * 3;
        if (!row) ctx.moveTo(this.projected[at], this.projected[at + 1]);
        else ctx.lineTo(this.projected[at], this.projected[at + 1]);
      }
      ctx.strokeStyle = "rgba(163,138,255,.24)";
      ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const angle = t * 0.12 + i * Math.PI * 0.4;
      const x = centerX + Math.cos(angle) * scale * 2.05;
      const y = centerY + Math.sin(angle) * scale * 1.65;
      const arm = i === 0 ? 5 : 2.5;
      ctx.strokeStyle = i === 0 ? "#dcf988" : "#d5c7ff";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(x - arm, y);
      ctx.lineTo(x + arm, y);
      ctx.moveTo(x, y - arm);
      ctx.lineTo(x, y + arm);
      ctx.stroke();
    }
  }
};
