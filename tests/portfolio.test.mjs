import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { parseHTML } from "linkedom";

function app(
  filename = "index.html",
  { reduced = false, clipboardWorks = true } = {},
) {
  const { document, window } = parseHTML(readFileSync(filename, "utf8"));
  let active = document.body,
    nextFrame = 0;
  const frames = new Map(),
    mediaListeners = [],
    storage = new Map(),
    copied = [];
  Object.defineProperty(document, "activeElement", { get: () => active });
  Object.defineProperty(document, "hidden", { value: false, writable: true });
  window.HTMLElement.prototype.focus = function () {
    active = this;
  };
  window.innerWidth = 390;
  window.innerHeight = 844;
  window.scrollY = 0;
  window.devicePixelRatio = 3;
  window.CSS = { supports: () => true };
  window.matchMedia = (query) => ({
    matches: query.includes("reduced") ? reduced : false,
    addEventListener(type, fn) {
      mediaListeners.push(fn);
    },
  });
  window.location = {
    assign(href) {
      window.redirect = href;
    },
  };
  const raf = (fn) => {
    const id = ++nextFrame;
    frames.set(id, fn);
    return id;
  };
  window.requestAnimationFrame = raf;
  const dialog = document.querySelector("dialog");
  if (dialog) {
    dialog.showModal = function () {
      this.open = true;
      this.setAttribute("open", "");
    };
    dialog.close = function () {
      this.open = false;
      this.removeAttribute("open");
      this.dispatchEvent(new window.Event("close"));
    };
  }
  const sandbox = {
    window,
    document,
    console,
    CustomEvent: window.CustomEvent,
    Float32Array,
    navigator: {
      clipboard: {
        async writeText(value) {
          if (!clipboardWorks) throw new Error("Denied");
          copied.push(value);
        },
      },
    },
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    requestAnimationFrame: raf,
    cancelAnimationFrame: (id) => frames.delete(id),
    setTimeout: () => 1,
    clearTimeout() {},
  };
  const context = vm.createContext(sandbox);
  function run(file) {
    vm.runInContext(readFileSync(file, "utf8"), context);
  }
  function click(selector) {
    const element = document.querySelector(selector);
    assert(element, selector);
    element.dispatchEvent(new window.Event("click", { bubbles: true }));
    return element;
  }
  function frame(now) {
    const work = [...frames.values()];
    frames.clear();
    work.forEach((fn) => fn(now));
  }
  return {
    document,
    window,
    run,
    click,
    frames,
    frame,
    mediaListeners,
    storage,
    copied,
  };
}

test("Los filtros muestran los proyectos de cada categoría y anuncian el resultado", () => {
  const a = app();
  a.run("js/portfolio.js");
  a.click('[data-filter="commerce"]');
  assert.deepEqual(
    [...a.document.querySelectorAll(".project")]
      .filter((x) => !x.hidden)
      .map((x) => x.querySelector("h3").textContent),
    ["Datalisting", "Nuts"],
  );
  assert.equal(
    a.document.getElementById("filter-status").textContent,
    "2 proyectos disponibles",
  );
  assert.equal(
    a.document
      .querySelector('[data-filter="commerce"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  a.click('[data-filter="platform"]');
  assert.equal(
    [...a.document.querySelectorAll(".project")].filter((x) => !x.hidden)
      .length,
    3,
  );
  a.click('[data-filter="all"]');
  assert.equal(
    [...a.document.querySelectorAll(".project")].filter((x) => !x.hidden)
      .length,
    4,
  );
});
test("El menú móvil controla foco, cierre con Escape y acceso al contenido", () => {
  const a = app();
  a.run("js/portfolio.js");
  a.click("#menu-toggle");
  assert.equal(
    a.document.getElementById("menu-toggle").getAttribute("aria-expanded"),
    "true",
  );
  assert.equal(a.document.querySelector("main").inert, true);
  assert.equal(a.document.activeElement.getAttribute("href"), "#proyectos");
  const event = new a.window.Event("keydown", {
    bubbles: true,
    cancelable: true,
  });
  event.key = "Escape";
  a.document.dispatchEvent(event);
  assert.equal(
    a.document.getElementById("menu-toggle").getAttribute("aria-expanded"),
    "false",
  );
  assert.equal(a.document.querySelector("main").inert, false);
  assert.equal(a.document.activeElement.id, "menu-toggle");
  a.click("#menu-toggle");
  a.click("#menu-scrim");
  assert.equal(a.document.getElementById("menu-scrim").hidden, true);
});
test("Cada proyecto abre detalles y enlaces reales; cerrar devuelve el foco", () => {
  const a = app();
  a.run("js/portfolio.js");
  for (const name of ["datalisting", "nuts", "attache", "reservas"]) {
    const button = a.click(`[data-project="${name}"]`);
    assert.equal(a.document.querySelector("dialog").open, true);
    assert(
      a.document.getElementById("dialog-description").textContent.length > 80,
    );
    for (const link of a.document.querySelectorAll("#dialog-actions a")) {
      assert(link.href.startsWith("https://"));
      assert(link.rel.includes("noopener"));
    }
    a.click("#dialog-close");
    assert.equal(a.document.querySelector("dialog").open, false);
    assert.equal(a.document.activeElement, button);
  }
});
test("Sin diálogo nativo, los proyectos conservan un destino utilizable", () => {
  const a = app();
  a.document.querySelector("dialog").showModal = undefined;
  a.run("js/portfolio.js");
  a.click('[data-project="reservas"]');
  assert.equal(
    a.window.redirect,
    "https://github.com/20FacuSam23/reservas-fullstack",
  );
});
test("Movimiento reducido conserva el contenido visible y el control permite pausarlo", () => {
  const a = app("index.html", { reduced: true });
  a.run("js/portfolio.js");
  assert.equal(a.document.documentElement.dataset.motion, "off");
  assert(
    [...a.document.querySelectorAll(".reveal")].every((el) =>
      el.classList.contains("is-visible"),
    ),
  );
  a.click("#motion-toggle");
  assert.equal(a.document.documentElement.dataset.motion, "on");
  a.click("#motion-toggle");
  assert.equal(a.storage.get("fa-motion"), "off");
});
test("Copiar email informa éxito y también contempla el portapapeles bloqueado", async () => {
  const a = app();
  a.run("js/portfolio.js");
  a.click("#copy-email");
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(a.copied, ["facundo.samela@gmail.com"]);
  assert(
    a.document.getElementById("copy-status").textContent.includes("copiado"),
  );
  const b = app("index.html", { clipboardWorks: false });
  b.window.HTMLElement.prototype.select = function () {};
  b.run("js/portfolio.js");
  b.click("#copy-email");
  await new Promise((resolve) => setImmediate(resolve));
  assert(
    b.document
      .getElementById("copy-status")
      .textContent.includes("No se pudo copiar"),
  );
});
test("La escena genera coordenadas finitas, limita resolución y se detiene al pausar", () => {
  const a = app();
  const canvas = a.document.getElementById("hero-canvas");
  const ctx = {
    setTransform() {},
    clearRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
  };
  canvas.getContext = () => ctx;
  canvas.parentElement.getBoundingClientRect = () => ({
    width: 700,
    height: 650,
  });
  a.document.documentElement.dataset.motion = "off";
  a.run("js/scene.js");
  const orb = new a.window.FAOrb(canvas);
  assert.equal(canvas.width, 1120);
  assert.equal(canvas.height, 1040);
  assert([...orb.projected].every(Number.isFinite));
  assert.equal(a.frames.size, 0);
  a.document.documentElement.dataset.motion = "on";
  orb.sync();
  assert.equal(a.frames.size, 1);
  a.frame(100);
  assert.equal(a.frames.size, 1);
  a.document.hidden = true;
  orb.sync();
  assert.equal(a.frames.size, 0);
});
test("La presentación tiene reproducción voluntaria, navegación y pausa al ocultarse", () => {
  const a = app("presentacion.html");
  a.window.FAOrb = class {};
  a.run("js/presentacion.js");
  assert.equal(a.frames.size, 0);
  a.click("#reel-next");
  assert.equal(a.document.querySelector('[data-slide="1"]').hidden, false);
  a.click("#reel-previous");
  assert.equal(a.document.querySelector('[data-slide="0"]').hidden, false);
  a.click("#reel-play");
  assert.equal(a.document.getElementById("reel-play").textContent, "Pausar");
  for (let t = 1; t <= 4601; t += 50) a.frame(t);
  assert.equal(a.document.querySelector('[data-slide="1"]').hidden, false);
  a.document.hidden = true;
  a.document.dispatchEvent(new a.window.Event("visibilitychange"));
  assert.equal(a.frames.size, 0);
  a.click("#reel-play");
  assert.equal(a.document.documentElement.dataset.motion, "off");
});
