(() => {
  "use strict";
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  let motionEnabled = !reducedMotion.matches;
  try {
    if (sessionStorage.getItem("fa-motion") === "off") motionEnabled = false;
  } catch {
    /* Storage is optional. */
  }
  const motionButton = document.getElementById("motion-toggle");
  function setMotion(enabled, remember = false) {
    motionEnabled = enabled;
    root.dataset.motion = enabled ? "on" : "off";
    motionButton?.setAttribute("aria-pressed", String(!enabled));
    const label = enabled ? "Pausar animaciones" : "Reanudar animaciones";
    motionButton?.setAttribute("aria-label", label);
    motionButton?.setAttribute("title", label);
    if (!enabled) {
      document
        .querySelectorAll(".reveal")
        .forEach((element) => element.classList.add("is-visible"));
      document
        .querySelectorAll(".magnetic")
        .forEach((element) => element.style.removeProperty("transform"));
      document.querySelectorAll(".project-cover").forEach((element) => {
        element.style.removeProperty("--tilt-x");
        element.style.removeProperty("--tilt-y");
      });
    }
    if (remember) {
      try {
        sessionStorage.setItem("fa-motion", enabled ? "on" : "off");
      } catch {
        /* Optional. */
      }
    }
    document.dispatchEvent(
      new CustomEvent("portfolio:motion", { detail: { enabled } }),
    );
  }
  setMotion(motionEnabled);
  motionButton?.addEventListener("click", () =>
    setMotion(!motionEnabled, true),
  );
  reducedMotion.addEventListener?.("change", (event) =>
    setMotion(!event.matches),
  );
  document.addEventListener("visibilitychange", () =>
    root.classList.toggle("page-hidden", document.hidden),
  );
  const canvas = document.getElementById("hero-canvas");
  if (canvas && window.FAOrb) new window.FAOrb(canvas);

  const menuButton = document.getElementById("menu-toggle");
  const navigation = document.getElementById("navigation");
  const scrim = document.getElementById("menu-scrim");
  const main = document.querySelector("main");
  const footer = document.querySelector("footer");
  let menuOpen = false;
  function setMenu(open, returnFocus = false) {
    menuOpen = open;
    navigation?.classList.toggle("is-open", open);
    menuButton?.setAttribute("aria-expanded", String(open));
    menuButton?.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    if (scrim) scrim.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    if (main) main.inert = open;
    if (footer) footer.inert = open;
    if (open) navigation?.querySelector("a")?.focus();
    else if (returnFocus) menuButton?.focus();
  }
  menuButton?.addEventListener("click", () => setMenu(!menuOpen, menuOpen));
  scrim?.addEventListener("click", () => setMenu(false, true));
  window.addEventListener(
    "resize",
    () => {
      if (menuOpen && window.innerWidth > 760) setMenu(false);
    },
    { passive: true },
  );
  navigation?.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      if (!menuOpen) return;
      setMenu(false);
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    }),
  );
  document.addEventListener("keydown", (event) => {
    if (!menuOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setMenu(false, true);
    }
    if (event.key === "Tab") {
      const links = [...navigation.querySelectorAll("a")];
      const focusable = [...links, motionButton, menuButton].filter(Boolean);
      const first = focusable[0],
        last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  if (typeof IntersectionObserver !== "undefined") {
    const revealObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        }),
      { threshold: 0.08, rootMargin: "0px 0px 20px 0px" },
    );
    document
      .querySelectorAll(".reveal")
      .forEach((element) => revealObserver.observe(element));
    if (motionEnabled) root.classList.add("can-reveal");
    const sectionObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navigation?.querySelectorAll("a").forEach((link) => {
            if (link.getAttribute("href") === `#${entry.target.id}`)
              link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        }),
      { rootMargin: "-15% 0px -65% 0px" },
    );
    document
      .querySelectorAll("main>section[id]")
      .forEach((section) => sectionObserver.observe(section));
  }

  const projects = {
    datalisting: {
      eyebrow: "01 / PROYECTO PROPIO",
      title: "Datalisting",
      description:
        "Un proyecto de plataforma web para crear tiendas con identidad propia, organizar catálogos y conectar la experiencia de compra con su gestión. El frontend público forma parte de un desarrollo más amplio.",
      stack: ["HTML", "CSS", "JavaScript", "API REST", "Diseño de interfaces"],
      note: "La tienda genérica es una demostración con catálogo ilustrativo y pedidos simulados. No ejecuta cobros reales. La portada del portfolio es una composición gráfica del proyecto.",
      links: [
        {
          label: "Explorar la demo",
          href: "https://20facusam23.github.io/datalisting-tienda/",
        },
        {
          label: "Ver código",
          href: "https://github.com/20FacuSam23/datalisting-tienda",
        },
      ],
    },
    nuts: {
      eyebrow: "02 / COMERCIO & DISEÑO",
      title: "Nuts",
      description:
        "Una tienda de productos naturales y dietéticos con catálogo, fichas de producto y carrito. Una identidad visual propia dentro del desarrollo de Datalisting.",
      stack: ["Diseño web", "JavaScript", "Catálogo", "Carrito"],
      note: "La disponibilidad y el registro de pedidos dependen del servidor de la tienda. La imagen del portfolio pertenece a una exploración anterior del diseño.",
      links: [
        {
          label: "Explorar la tienda",
          href: "https://20facusam23.github.io/datalisting-tienda/nuts/",
        },
        {
          label: "Ver código",
          href: "https://github.com/20FacuSam23/datalisting-tienda/tree/main/nuts",
        },
      ],
    },
    attache: {
      eyebrow: "03 / DESARROLLO FULL STACK",
      title: "Attache",
      description:
        "Un proyecto de portfolio desarrollado con una interfaz en Angular y un backend en Spring Boot. Una exploración de la presentación personal, la formación, la experiencia y las habilidades dentro de una aplicación web.",
      stack: ["Angular", "Spring Boot", "Java", "Frontend & backend"],
      note: "La captura muestra una etapa anterior de la interfaz. Los repositorios permiten explorar el desarrollo; no se presenta como un servicio desplegado actualmente.",
      links: [
        {
          label: "Ver frontend",
          href: "https://github.com/20FacuSam23/Portfolio-FrontEnd-Angular",
        },
        {
          label: "Ver backend",
          href: "https://github.com/20FacuSam23/Attache-BackEnd-SpringBoot",
        },
      ],
    },
    reservas: {
      eyebrow: "04 / APLICACIÓN & API",
      title: "Sistema de reservas",
      description:
        "Una aplicación full stack para consultar espacios disponibles y crear reservas. El frontend consume una API REST y contempla estados de la interfaz y validaciones de los datos ingresados.",
      stack: ["React", "TypeScript", "Node.js", "Express", "PostgreSQL"],
      note: "Proyecto de práctica técnica. El repositorio incluye las instrucciones para ejecutarlo. La portada es una composición gráfica, no una captura de la aplicación.",
      links: [
        {
          label: "Explorar el proyecto",
          href: "https://github.com/20FacuSam23/reservas-fullstack",
        },
      ],
    },
  };
  const dialog = document.getElementById("project-dialog");
  let previousFocus = null;
  document.querySelectorAll("[data-project]").forEach((button) =>
    button.addEventListener("click", () => {
      const project = projects[button.dataset.project];
      if (!project) return;
      if (!dialog || typeof dialog.showModal !== "function") {
        window.location.assign(project.links[0].href);
        return;
      }
      previousFocus = button;
      document.getElementById("dialog-eyebrow").textContent = project.eyebrow;
      document.getElementById("dialog-title").textContent = project.title;
      document.getElementById("dialog-description").textContent =
        project.description;
      document.getElementById("dialog-note").textContent = project.note;
      const stack = document.getElementById("dialog-stack");
      stack.replaceChildren(
        ...project.stack.map((label) => {
          const li = document.createElement("li");
          li.textContent = label;
          return li;
        }),
      );
      const actions = document.getElementById("dialog-actions");
      actions.replaceChildren(
        ...project.links.map((item, index) => {
          const link = document.createElement("a");
          link.className = `button ${index ? "button-outline" : "button-primary"}`;
          link.href = item.href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = `${item.label} ↗`;
          return link;
        }),
      );
      dialog.showModal();
      document.body.classList.add("modal-open");
      document.getElementById("dialog-close")?.focus();
    }),
  );
  document
    .getElementById("dialog-close")
    ?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog?.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    previousFocus?.focus();
  });

  let pendingTransition = null,
    filterRequest = 0;
  document.querySelectorAll("[data-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      const request = ++filterRequest;
      const filter = button.dataset.filter;
      const update = () => {
        if (request !== filterRequest) return;
        let count = 0;
        document
          .querySelectorAll(".project[data-category]")
          .forEach((project) => {
            const visible =
              filter === "all" ||
              project.dataset.category.split(" ").includes(filter);
            project.hidden = !visible;
            if (visible) {
              count++;
              project.classList.add("is-visible");
            }
          });
        document
          .querySelector(".project-grid")
          ?.classList.toggle("is-filtered", filter !== "all");
        document
          .querySelectorAll("[data-filter]")
          .forEach((item) =>
            item.setAttribute("aria-pressed", String(item === button)),
          );
        const status = document.getElementById("filter-status");
        if (status)
          status.textContent = `${count} ${count === 1 ? "proyecto disponible" : "proyectos disponibles"}`;
      };
      if (motionEnabled && typeof document.startViewTransition === "function") {
        pendingTransition?.skipTransition();
        pendingTransition = document.startViewTransition(update);
        pendingTransition.finished.catch(() => {});
      } else update();
    }),
  );

  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      if (!motionEnabled || !finePointer.matches) return;
      const rect = element.getBoundingClientRect();
      const x = Math.max(
        -7,
        Math.min(7, (event.clientX - rect.left - rect.width / 2) * 0.1),
      );
      const y = Math.max(
        -5,
        Math.min(5, (event.clientY - rect.top - rect.height / 2) * 0.15),
      );
      element.style.transform = `translate(${x}px,${y}px)`;
    });
    element.addEventListener("pointerleave", () =>
      element.style.removeProperty("transform"),
    );
  });
  document.querySelectorAll(".project-cover").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      if (!motionEnabled || !finePointer.matches || window.innerWidth <= 760)
        return;
      const rect = element.getBoundingClientRect();
      element.style.setProperty(
        "--tilt-x",
        `${(-(event.clientY - rect.top - rect.height / 2) / rect.height) * 4}deg`,
      );
      element.style.setProperty(
        "--tilt-y",
        `${((event.clientX - rect.left - rect.width / 2) / rect.width) * 4}deg`,
      );
    });
    element.addEventListener("pointerleave", () => {
      element.style.removeProperty("--tilt-x");
      element.style.removeProperty("--tilt-y");
    });
  });

  const copyButton = document.getElementById("copy-email");
  let copyTimer;
  copyButton?.addEventListener("click", async () => {
    const email = copyButton.dataset.email;
    const status = document.getElementById("copy-status");
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
        copied = true;
      }
    } catch {
      /* Try a selectable fallback below. */
    }
    if (!copied) {
      const field = document.createElement("textarea");
      field.value = email;
      field.readOnly = true;
      field.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.append(field);
      field.select();
      try {
        copied =
          typeof document.execCommand === "function" &&
          document.execCommand("copy");
      } catch {
        /* The email remains visible on the page. */
      }
      field.remove();
      copyButton.focus();
    }
    copyButton.textContent = copied
      ? "Email copiado ✓"
      : "No se pudo copiar";
    if (status)
      status.textContent = copied
        ? "Email copiado al portapapeles."
        : "No se pudo copiar el email. Usá el enlace de contacto para abrir tu aplicación de correo.";
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copyButton.textContent = "Copiar email ⧉";
    }, 3500);
  });
  if (!window.CSS?.supports?.("animation-timeline: scroll()")) {
    const progress = document.querySelector(".page-progress span");
    let scheduled = false;
    const paintProgress = () => {
      scheduled = false;
      const total = root.scrollHeight - window.innerHeight;
      if (progress)
        progress.style.transform = `scaleX(${total > 0 ? Math.max(0, Math.min(1, window.scrollY / total)) : 0})`;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(paintProgress);
        }
      },
      { passive: true },
    );
    window.addEventListener("resize", paintProgress, { passive: true });
    paintProgress();
  }
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
