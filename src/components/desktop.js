/**
 * Desktop icons and the boot log.
 *
 * Mouse: click selects, double-click opens.
 * Touch / compact screens: one tap opens.
 * Keyboard: Tab or the arrow keys move between icons, Enter opens.
 */
import { PROJECTS } from "../../config/projects.js";
import { h, frag, isCompact } from "../utils/dom.js";
import { renderIcon } from "../utils/icons.js";
import { play } from "../utils/sound.js";
import { notify } from "./notify.js";

export const SHORTCUTS = [
  ...PROJECTS.map((p) => ({ id: p.id, label: p.name, icon: p.icon, status: p.status })),
  { id: "about", label: "ABOUT", icon: "about" },
  { id: "kofi", label: "KO-FI", icon: "kofi" },
  { id: "files", label: "FILES", icon: "files" },
];

export function createDesktop({ list, openApp }) {
  let lastPointer = "mouse";
  let hinted = false;

  const select = (btn) => {
    for (const b of list.querySelectorAll(".icon")) b.setAttribute("aria-current", String(b === btn));
  };

  const icons = SHORTCUTS.map((s) => {
    const btn = h(
      "button",
      {
        class: "icon",
        type: "button",
        "data-app": s.id,
        "aria-current": "false",
        "aria-describedby": "icon-hint",
      },
      h(
        "span",
        { class: "icon__art" },
        frag(renderIcon(s.icon)),
        s.status && h("span", { class: "icon__status", dataset: { status: s.status }, "aria-hidden": "true" })
      ),
      h("span", { class: "icon__label" }, s.label)
    );

    btn.addEventListener("pointerdown", (e) => {
      lastPointer = e.pointerType || "mouse";
    });

    btn.addEventListener("click", (e) => {
      const keyboard = e.detail === 0;
      if (keyboard || lastPointer !== "mouse" || isCompact()) {
        select(btn);
        openApp(s.id, btn);
        return;
      }
      if (e.detail === 1) {
        select(btn);
        play("select");
        if (!hinted) {
          hinted = true;
          setTimeout(() => {
            if (btn.getAttribute("aria-current") === "true" && document.activeElement === btn) {
              notify("Double-click to open, or press Enter.", { icon: s.icon, sound: null, duration: 3000 });
            }
          }, 650);
        }
      }
    });

    btn.addEventListener("dblclick", () => {
      if (lastPointer !== "mouse" || isCompact()) return;
      hinted = true;
      openApp(s.id, btn);
    });

    return h("li", {}, btn);
  });

  list.replaceChildren(...icons);

  list.addEventListener("keydown", (e) => {
    const btns = Array.from(list.querySelectorAll(".icon"));
    const i = btns.indexOf(document.activeElement);
    if (i < 0) return;
    const cols = isCompact() ? Number(getComputedStyle(list).gridTemplateColumns.split(" ").length) : 1;
    const delta = { ArrowDown: cols, ArrowUp: -cols, ArrowRight: isCompact() ? 1 : rowsPerColumn(list), ArrowLeft: isCompact() ? -1 : -rowsPerColumn(list) }[e.key];
    let next = null;
    if (delta !== undefined) next = btns[Math.min(btns.length - 1, Math.max(0, i + delta))];
    if (e.key === "Home") next = btns[0];
    if (e.key === "End") next = btns[btns.length - 1];
    if (next) {
      e.preventDefault();
      next.focus();
      select(next);
    }
  });

  return {
    clearSelection: () => select(null),
  };
}

function rowsPerColumn(list) {
  const rows = getComputedStyle(list).gridTemplateRows.split(" ").filter(Boolean).length;
  return Math.max(1, rows);
}

/** A few lines of boot text in the corner. Decorative, never blocking. */
export function runBootLog(el, { lampOn, reduced }) {
  const lines = [
    ["TITI OS 1.0.0 · digital environment 01", ""],
    ["mounting /applications ........ ", "ok"],
    ["desk lamp ..................... ", lampOn ? "on" : "off"],
    ["weather ....................... ", "rain"],
    [isCompact() ? "› tap an icon to open it" : "› double-click an icon to open it", "", "hint"],
  ];
  el.replaceChildren();
  const delay = reduced ? 0 : 140;
  lines.forEach(([text, status, cls], i) => {
    setTimeout(() => {
      el.append(h("p", { class: cls || null }, text, status && h("span", { class: "ok" }, status)));
    }, i * delay);
  });
  setTimeout(() => el.classList.add("is-gone"), lines.length * delay + 7000);
  setTimeout(() => el.remove(), lines.length * delay + 8500);
}
