/**
 * Popover menus attached to a taskbar button (the start menu and the
 * compact-screen window switcher). Arrow keys move between items,
 * Escape closes and gives focus back to the button, clicking outside closes.
 */
import { h } from "../utils/dom.js";
import { play } from "../utils/sound.js";

const openMenus = new Set();

export function closeAllMenus(except) {
  for (const m of openMenus) if (m !== except) m.close();
}

export function createMenu({ button, panel, render, label }) {
  panel.setAttribute("role", "menu");
  panel.setAttribute("aria-label", label);
  panel.tabIndex = -1;
  button.setAttribute("aria-haspopup", "menu");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", panel.id);

  const items = () => Array.from(panel.querySelectorAll('[role="menuitem"]'));

  const api = {
    isOpen: () => !panel.hidden,
    open({ focusFirst = false } = {}) {
      closeAllMenus(api);
      panel.replaceChildren(...render(api));
      panel.hidden = false;
      button.setAttribute("aria-expanded", "true");
      panel.classList.remove("is-opening");
      void panel.offsetWidth;
      panel.classList.add("is-opening");
      openMenus.add(api);
      play("click");
      const first = items()[0];
      if (focusFirst && first) first.focus();
      else panel.focus({ preventScroll: true });
    },
    close({ returnFocus = false } = {}) {
      if (panel.hidden) return;
      panel.hidden = true;
      button.setAttribute("aria-expanded", "false");
      openMenus.delete(api);
      if (returnFocus) button.focus();
    },
    toggle(opts) {
      if (api.isOpen()) api.close();
      else api.open(opts);
    },
  };

  button.addEventListener("click", (e) => api.toggle({ focusFirst: e.detail === 0 }));
  button.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      api.open({ focusFirst: true });
    }
  });

  panel.addEventListener("keydown", (e) => {
    const list = items();
    const i = list.indexOf(document.activeElement);
    const go = (n) => {
      e.preventDefault();
      list[(n + list.length) % list.length]?.focus();
    };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i < 0 ? list.length - 1 : i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      api.close({ returnFocus: true });
    } else if (e.key === "Tab") {
      api.close();
    }
  });

  document.addEventListener("pointerdown", (e) => {
    if (!api.isOpen()) return;
    if (panel.contains(e.target) || button.contains(e.target)) return;
    api.close();
  });

  return api;
}

/** A menu item. `run` receives the item element (used as the opener). */
export function menuItem({ name, meta, icon, run, menu }) {
  return h(
    "button",
    {
      class: "menu-item",
      type: "button",
      role: "menuitem",
      tabindex: "-1",
      onclick: (e) => {
        menu.close();
        run(document.querySelector('[aria-controls="' + e.currentTarget.closest("[role=menu]").id + '"]'));
      },
    },
    icon,
    h("span", { class: "menu-item__name" }, name),
    meta && h("span", { class: "menu-item__meta" }, meta)
  );
}
