/**
 * A small desktop window manager.
 *
 * open(spec) creates (or restores) a window; every window has an id, so the
 * same application never opens twice. Windows can be focused, raised,
 * minimised to the taskbar, moved with the mouse (or the arrow keys when
 * the title bar has focus) and closed. Positions persist in localStorage.
 *
 * On compact screens windows become full-screen sheets and dragging is off,
 * so touch scrolling and tapping are never hijacked.
 */
import { h, frag, isCompact } from "../utils/dom.js";
import { renderIcon, GLYPHS } from "../utils/icons.js";
import { load, save, remove } from "../utils/storage.js";
import { play } from "../utils/sound.js";

const BAR_MIN_VISIBLE = 96;

export function createWindowManager({ layer, onChange = () => {}, reducedMotion = () => false }) {
  const wins = new Map();
  let z = 10;
  let activeId = null;
  let openedCount = 0;
  let layout = load("layout", {});

  const bounds = () => ({ w: layer.clientWidth, h: layer.clientHeight });

  function clamp(win, x, y) {
    const { w, h } = bounds();
    const ew = win.el.offsetWidth;
    const minX = Math.min(0, -(ew - BAR_MIN_VISIBLE));
    const maxX = Math.max(0, w - BAR_MIN_VISIBLE);
    return {
      x: Math.round(Math.min(Math.max(x, minX), maxX)),
      y: Math.round(Math.min(Math.max(y, 0), Math.max(0, h - 40))),
    };
  }

  function place(win, x, y) {
    const p = clamp(win, x, y);
    win.x = p.x;
    win.y = p.y;
    win.el.style.left = p.x + "px";
    win.el.style.top = p.y + "px";
  }

  function defaultPosition(win) {
    const { w, h } = bounds();
    const ew = win.el.offsetWidth;
    const eh = win.el.offsetHeight;
    const step = (openedCount % 6) * 28;
    // Open a little right of centre so the desktop icons stay visible.
    const x = Math.max(16, Math.round((w - ew) / 2 + Math.min(w * 0.06, 80))) + step;
    const y = Math.max(16, Math.round((h - eh) / 2.6)) + step;
    return { x, y };
  }

  function emit() {
    onChange(list(), activeId);
  }

  function list() {
    return Array.from(wins.values()).sort((a, b) => a.order - b.order);
  }

  function topVisible(exceptId) {
    let best = null;
    for (const w of wins.values()) {
      if (w.id === exceptId || w.state !== "open") continue;
      if (!best || w.z > best.z) best = w;
    }
    return best;
  }

  function focus(id, { moveFocus = false } = {}) {
    const win = wins.get(id);
    if (!win) return;
    if (win.state === "minimized") return restore(id);
    if (activeId !== id || win.z !== z) {
      win.z = ++z;
      win.el.style.zIndex = String(win.z);
    }
    for (const w of wins.values()) w.el.classList.toggle("is-active", w.id === id);
    activeId = id;
    if (moveFocus) win.el.focus({ preventScroll: true });
    emit();
  }

  function activateNext(exceptId) {
    const next = topVisible(exceptId);
    activeId = null;
    for (const w of wins.values()) w.el.classList.remove("is-active");
    if (next) {
      focus(next.id);
      return next;
    }
    emit();
    return null;
  }

  function animate(win, cls, done) {
    if (reducedMotion()) {
      done?.();
      return;
    }
    win.el.classList.remove("is-entering", "is-leaving");
    void win.el.offsetWidth;
    win.el.classList.add(cls);
    let finished = false;
    const end = () => {
      if (finished) return;
      finished = true;
      win.el.classList.remove(cls);
      done?.();
    };
    win.el.addEventListener("animationend", end, { once: true });
    setTimeout(end, 320);
  }

  function open(spec) {
    const existing = wins.get(spec.id);
    if (existing) {
      if (existing.state === "minimized") restore(spec.id);
      else focus(spec.id, { moveFocus: true });
      return existing;
    }

    const titleId = `win-${spec.id}-title`;
    const btnMin = h("button", { class: "win-btn", type: "button", "data-act": "min", "aria-label": `Minimize ${spec.title}`, title: "Minimize", html: GLYPHS.minimize });
    const btnClose = h("button", { class: "win-btn", type: "button", "data-act": "close", "aria-label": `Close ${spec.title}`, title: "Close", html: GLYPHS.close });
    const bar = h(
      "header",
      {
        class: "win-bar",
        tabindex: "0",
        "aria-label": `${spec.title} title bar. Arrow keys move the window.`,
      },
      frag(`<span class="win-bar__icon">${renderIcon(spec.icon)}</span>`),
      h("h2", { class: "win-bar__title", id: titleId }, spec.title),
      h("span", { class: "win-bar__path", "aria-hidden": "true" }, spec.path || ""),
      h("div", { class: "win-ctl" }, btnMin, btnClose)
    );
    const body = h("div", { class: "win-body" });
    const el = h(
      "section",
      {
        class: "win",
        role: "dialog",
        "aria-labelledby": titleId,
        tabindex: "-1",
        "data-win": spec.id,
      },
      bar,
      body
    );
    el.style.setProperty("--w", spec.width || "32rem");
    if (spec.accent) el.style.setProperty("--accent", spec.accent);

    const win = {
      id: spec.id,
      title: spec.title,
      icon: spec.icon,
      el,
      body,
      state: "open",
      order: Date.now() + openedCount,
      opener: spec.opener || (document.activeElement !== document.body ? document.activeElement : null),
      z: 0,
      x: 0,
      y: 0,
      onClose: spec.onClose,
    };
    wins.set(spec.id, win);

    spec.build?.(body, { close: () => close(spec.id), focus: () => focus(spec.id) });

    el.style.visibility = "hidden";
    layer.append(el);
    const saved = layout[spec.id];
    const pos = saved ? saved : defaultPosition(win);
    place(win, pos.x, pos.y);
    el.style.visibility = "";
    openedCount += 1;

    btnMin.addEventListener("click", () => minimize(spec.id));
    btnClose.addEventListener("click", () => close(spec.id));
    el.addEventListener("pointerdown", () => focus(spec.id), true);
    el.addEventListener("focusin", () => {
      if (activeId !== spec.id) focus(spec.id);
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !e.target.closest("input, textarea, select")) {
        e.stopPropagation();
        close(spec.id);
      }
    });
    bar.addEventListener("keydown", (e) => {
      if (isCompact() || e.target !== bar) return;
      const step = e.shiftKey ? 64 : 16;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const mv = moves[e.key];
      if (!mv) return;
      e.preventDefault();
      place(win, win.x + mv[0], win.y + mv[1]);
      remember(win);
    });
    enableDrag(win, bar);

    focus(spec.id);
    animate(win, "is-entering");
    el.focus({ preventScroll: true });
    play("open");
    return win;
  }

  function enableDrag(win, bar) {
    let start = null;
    bar.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.pointerType === "touch" || isCompact()) return;
      if (e.target.closest(".win-btn")) return;
      e.preventDefault();
      start = { px: e.clientX, py: e.clientY, x: win.x, y: win.y, id: e.pointerId };
      bar.setPointerCapture(e.pointerId);
      win.el.classList.add("is-dragging");
    });
    bar.addEventListener("pointermove", (e) => {
      if (!start || e.pointerId !== start.id) return;
      place(win, start.x + e.clientX - start.px, start.y + e.clientY - start.py);
    });
    const stop = (e) => {
      if (!start || e.pointerId !== start.id) return;
      start = null;
      win.el.classList.remove("is-dragging");
      if (bar.hasPointerCapture(e.pointerId)) bar.releasePointerCapture(e.pointerId);
      remember(win);
    };
    bar.addEventListener("pointerup", stop);
    bar.addEventListener("pointercancel", stop);
    bar.addEventListener("lostpointercapture", () => {
      start = null;
      win.el.classList.remove("is-dragging");
    });
  }

  function remember(win) {
    layout[win.id] = { x: win.x, y: win.y };
    save("layout", layout);
  }

  function returnFocusFrom(win) {
    const target = win.opener;
    if (target && target.isConnected && !target.closest("[hidden]") && !target.closest(".win")) {
      target.focus({ preventScroll: true });
      return;
    }
    const next = topVisible(win.id);
    if (next) next.el.focus({ preventScroll: true });
    else document.querySelector(".icon")?.focus({ preventScroll: true });
  }

  function close(id) {
    const win = wins.get(id);
    if (!win || win.closing) return;
    win.closing = true;
    const hadFocus = win.el.contains(document.activeElement);
    play("close");
    animate(win, "is-leaving", () => {
      win.el.remove();
      wins.delete(id);
      win.onClose?.();
      if (activeId === id) activateNext(id);
      else emit();
      if (hadFocus) returnFocusFrom(win);
    });
  }

  function minimize(id) {
    const win = wins.get(id);
    if (!win || win.state === "minimized") return;
    const hadFocus = win.el.contains(document.activeElement);
    win.state = "minimized";
    win.el.hidden = true;
    play("close");
    if (activeId === id) activateNext(id);
    else emit();
    if (hadFocus) {
      const task = document.querySelector(`[data-task="${CSS.escape(id)}"]`);
      if (task && task.offsetParent) task.focus();
      else returnFocusFrom(win);
    }
  }

  function restore(id) {
    const win = wins.get(id);
    if (!win) return;
    win.state = "open";
    win.el.hidden = false;
    place(win, win.x, win.y);
    focus(id);
    animate(win, "is-entering");
    win.el.focus({ preventScroll: true });
    play("open");
  }

  /** Taskbar behaviour: activate, or minimise if it is already in front. */
  function toggle(id) {
    const win = wins.get(id);
    if (!win) return;
    if (win.state === "minimized") restore(id);
    else if (activeId === id) minimize(id);
    else focus(id, { moveFocus: true });
  }

  function resetLayout() {
    layout = {};
    remove("layout");
    openedCount = 0;
    for (const win of list()) {
      const p = defaultPosition(win);
      place(win, p.x, p.y);
      openedCount += 1;
    }
  }

  window.addEventListener("resize", () => {
    for (const win of wins.values()) place(win, win.x, win.y);
  });

  return {
    open,
    close,
    minimize,
    restore,
    toggle,
    focus,
    list,
    resetLayout,
    get activeId() {
      return activeId;
    },
    has: (id) => wins.has(id),
    closeAll() {
      for (const id of Array.from(wins.keys())) close(id);
    },
  };
}
