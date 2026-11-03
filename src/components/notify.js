import { h, frag } from "../utils/dom.js";
import { renderIcon } from "../utils/icons.js";
import { play } from "../utils/sound.js";

let root = null;

export function initNotifications(container) {
  root = container;
}

/**
 * Small system message in the corner. Read out politely by screen readers
 * through the container's aria-live region.
 */
export function notify(text, { icon = "logo", tone = "cool", duration = 3600, sound = "notify" } = {}) {
  if (!root) return;
  const toast = h("div", { class: "toast", dataset: { tone } }, frag(`<span class="glyph">${renderIcon(icon)}</span>`), h("span", {}, text));
  root.append(toast);
  while (root.children.length > 3) root.firstElementChild.remove();
  if (sound) play(sound);
  setTimeout(() => {
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 220);
  }, duration);
}
