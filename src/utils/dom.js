/** Tiny DOM helpers. No framework, no virtual DOM. */

/**
 * h("button", { class: "btn", onclick: fn }, "Label", child)
 * - attributes starting with "on" become event listeners
 * - `html` sets innerHTML (only ever used with trusted, local strings)
 * - `false`, `null` and `undefined` attributes/children are skipped
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === false || value == null) continue;
    if (key === "html") {
      el.innerHTML = value;
    } else if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "dataset") {
      Object.assign(el.dataset, value);
    } else if (key === "style" && typeof value === "object") {
      Object.assign(el.style, value);
    } else {
      el.setAttribute(key, value === true ? "" : String(value));
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === false || child == null) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/** Parse a trusted SVG/HTML string into a single element. */
export function frag(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function focusable(root) {
  return $$(
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
    root
  ).filter((el) => !el.closest("[hidden]"));
}

export const isCompact = () => window.matchMedia("(max-width: 720px)").matches;
