(() => {
  "use strict";
  const frame = document.querySelector(".reel-frame");
  const slides = [...document.querySelectorAll("[data-slide]")];
  const playButton = document.getElementById("reel-play");
  const status = document.getElementById("reel-status");
  const counter = document.getElementById("reel-counter");
  const progress = document.getElementById("reel-progress");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current = 0,
    playing = false,
    rafId = 0,
    lastTime = 0,
    elapsed = 0;
  const duration = 4500;
  const orb = new window.FAOrb(document.getElementById("reel-canvas"));
  function syncMotion() {
    document.documentElement.dataset.motion =
      playing && !reducedMotion.matches ? "on" : "off";
    document.dispatchEvent(new CustomEvent("portfolio:motion"));
  }
  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
      slide.classList.toggle("is-current", i === current);
    });
    frame.dataset.current = String(current);
    counter.textContent = `${String(current + 1).padStart(2, "0")} / 04`;
    if (!playing)
      status.textContent = `Diapositiva ${current + 1} de ${slides.length}.`;
    progress.style.transform = `scaleX(${current / slides.length})`;
  }
  function tick(now) {
    rafId = 0;
    if (!playing || document.hidden) return;
    if (lastTime) elapsed += Math.min(now - lastTime, 100);
    lastTime = now;
    if (elapsed >= duration) {
      elapsed %= duration;
      show(current + 1);
    }
    progress.style.transform = `scaleX(${(current + elapsed / duration) / slides.length})`;
    rafId = requestAnimationFrame(tick);
  }
  function setPlaying(value) {
    playing = value;
    lastTime = 0;
    playButton.textContent = value ? "Pausar" : "Reproducir";
    playButton.setAttribute("aria-pressed", String(value));
    status.textContent = `${value ? "Presentación en reproducción" : "Presentación detenida"}. Diapositiva ${current + 1} de ${slides.length}.`;
    cancelAnimationFrame(rafId);
    rafId = 0;
    syncMotion();
    if (value && !document.hidden) rafId = requestAnimationFrame(tick);
  }
  function step(direction) {
    setPlaying(false);
    elapsed = 0;
    show(current + direction);
  }
  playButton.addEventListener("click", () => setPlaying(!playing));
  document
    .getElementById("reel-previous")
    .addEventListener("click", () => step(-1));
  document.getElementById("reel-next").addEventListener("click", () => step(1));
  const fullscreen = document.getElementById("reel-fullscreen");
  if (typeof frame.requestFullscreen !== "function") fullscreen.hidden = true;
  fullscreen.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await frame.requestFullscreen();
    } catch {
      status.textContent =
        "El navegador no permitió abrir la presentación en pantalla completa.";
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.target.closest("a,button,input,textarea")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
    if (event.key === " ") {
      event.preventDefault();
      setPlaying(!playing);
    }
  });
  document.addEventListener("visibilitychange", () => {
    lastTime = 0;
    cancelAnimationFrame(rafId);
    rafId = 0;
    if (playing && !document.hidden) rafId = requestAnimationFrame(tick);
  });
  reducedMotion.addEventListener?.("change", () => {
    if (reducedMotion.matches) setPlaying(false);
  });
  show(0);
  syncMotion();
})();
