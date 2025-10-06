/* ==========================================================================
   NeuroKid – app.js (solo FRONT, sin backend)
   Funciones:
   - Menú móvil accesible (toggle, aria-expanded)
   - Modal de Login/Registro con roles (abrir/cerrar + focus trap simple)
   - Redirección por rol a paneles: padres / psicologos / admin
   - Scrollspy simple para resaltar enlaces activos del navbar
   - Utilidades menores (helper de delegación, toasts de demo)
   ========================================================================== */

(function () {
  "use strict";

  /* ----------------------------------------
   * Helpers
   * ---------------------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function on(el, evt, selOrFn, fn) {
    // Delegación si se pasa selector, o listener directo si se pasa función
    if (typeof selOrFn === "string") {
      el.addEventListener(evt, (e) => {
        const match = e.target.closest(selOrFn);
        if (match) fn.call(match, e);
      });
    } else {
      el.addEventListener(evt, selOrFn);
    }
  }

  function trapFocus(container) {
    const focusable = $$(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      container
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handle(e) {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", handle);
    return () => container.removeEventListener("keydown", handle);
  }

  /* ----------------------------------------
   * Menú móvil (navbar)
   * ---------------------------------------- */
  const btnMobile = $("#btnMobile");
  const navMobile = $("#navMobile");

  if (btnMobile && navMobile) {
    on(btnMobile, "click", () => {
      const isOpen = !navMobile.classList.contains("hidden");
      navMobile.classList.toggle("hidden");
      btnMobile.setAttribute("aria-expanded", String(!isOpen));
      // Reemplazar iconos por si cambian en DOM
      if (window.feather) feather.replace();
    });

    // Cerrar al activar algún enlace
    on(navMobile, "click", "a", () => {
      navMobile.classList.add("hidden");
      btnMobile.setAttribute("aria-expanded", "false");
    });
  }

  /* ----------------------------------------
   * Modal de Login/Registro (UI sin backend)
   * ---------------------------------------- */
  const loginModal = $("#loginModal");
  const openLoginLinks = $$('a[href="#login"], [data-open-login]');
  const closeLoginBtn = $("#closeLogin");
  let releaseTrap = null;

  function openModal(modal) {
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.setAttribute("aria-hidden", "false");

    // Focus & trap
    const firstFocusable = modal.querySelector(
      'input, button, select, a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable) firstFocusable.focus();
    releaseTrap = trapFocus(modal);
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modal.setAttribute("aria-hidden", "true");
    if (releaseTrap) releaseTrap();
    document.body.style.overflow = "";
    // Devolver foco al disparador si existe
    if (document._lastTrigger && document._lastTrigger.focus) {
      document._lastTrigger.focus();
    }
  }

  // Abrir
  openLoginLinks.forEach((link) => {
    on(link, "click", (e) => {
      e.preventDefault();
      document._lastTrigger = link;
      openModal(loginModal);
    });
  });

  // Cerrar
  if (closeLoginBtn) {
    on(closeLoginBtn, "click", () => closeModal(loginModal));
  }
  // Cerrar por click en backdrop (no cerrar si se hace click en el contenedor del modal)
  if (loginModal) {
    on(loginModal, "mousedown", (e) => {
      if (e.target === loginModal) closeModal(loginModal);
    });
  }
  // Cerrar con ESC
  on(document, "keydown", (e) => {
    if (e.key === "Escape" && loginModal && !loginModal.classList.contains("hidden")) {
      closeModal(loginModal);
    }
  });

  /* ----------------------------------------
   * Redirección por rol (solo UI)
   * - Lee el valor del select y navega al panel estático
   * ---------------------------------------- */
  const rolSelect = $("#rolSelect");
  const btnEntrar = $("#btnEntrar");

  function showToast(msg = "Acción realizada") {
    // Toast simple y accesible
    let toast = document.createElement("div");
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.className =
      "fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] bg-gray-900 text-white px-4 py-2 rounded-lg shadow";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2000);
  }

  if (btnEntrar) {
    on(btnEntrar, "click", () => {
      const value = rolSelect ? rolSelect.value : "";
      if (!value) {
        showToast("Selecciona un rol para continuar");
        // micro animación (shake)
        btnEntrar.classList.add("animate-pulse");
        setTimeout(() => btnEntrar.classList.remove("animate-pulse"), 400);
        return;
      }
      // Guardar rol en sessionStorage (por si el panel lo quiere leer)
      try {
        sessionStorage.setItem("nk-rol", value);
      } catch (_) {}
      // Redirigir a panel estático correspondiente
      // Estructura esperada:
      //  - ./dashboards/padres.html
      //  - ./dashboards/psicologos.html
      //  - ./dashboards/admin.html
      window.location.href = `./dashboards/${value}.html`;
    });
  }

  /* ----------------------------------------
   * Scrollspy simple (resalta el link activo del navbar al hacer scroll)
   * ---------------------------------------- */
  const sections = $$("section[id], header[id]");
  const navLinks = $$('nav a[href^="#"]');

  if ("IntersectionObserver" in window && sections.length && navLinks.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("id");
          if (!id) return;
          const link = navLinks.find((a) => a.getAttribute("href") === `#${id}`);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach((a) => a.classList.remove("text-indigo-600", "font-semibold"));
            link.classList.add("text-indigo-600", "font-semibold");
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach((sec) => io.observe(sec));
  }

  /* ----------------------------------------
   * Reemplazo de iconos inicial (por si no se llamó aún)
   * ---------------------------------------- */
  if (window.feather) {
    try { feather.replace(); } catch (_) {}
  }
})();
