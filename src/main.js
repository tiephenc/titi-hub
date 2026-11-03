/**
 * TITI OS — boot.
 * Wires the scene, the window manager, the desktop, the taskbar and the
 * preferences together. Every module stays usable on its own.
 */
import { PROJECTS } from "../config/projects.js";
import { $, isCompact } from "./utils/dom.js";
import { createPrefs } from "./utils/prefs.js";
import { setSoundEnabled } from "./utils/sound.js";
import { createScene } from "./components/scene.js";
import { createWindowManager } from "./components/windowManager.js";
import { createApps } from "./components/apps.js";
import { createDesktop, runBootLog } from "./components/desktop.js";
import { createTaskbar } from "./components/taskbar.js";
import { closeAllMenus } from "./components/menu.js";
import { initNotifications, notify } from "./components/notify.js";

window.__titiBoot = Date.now();

const prefs = createPrefs();
const root = document.documentElement;
const desktopEl = $("#desktop");

initNotifications($("#toasts"));

/* Scene — the wallpaper is decoration, so a failure must never stop the desktop. */
let scene = { setAmbient() {}, setPaused() {}, setLamp() {}, hitsLamp: () => false };
try {
  scene = createScene($("#scene"), { lamp: prefs.get().lamp });
} catch (err) {
  console.warn("TITI OS: the night scene could not be drawn.", err);
}

/* Window manager */
let taskbar = null;
const wm = createWindowManager({
  layer: $("#win-layer"),
  reducedMotion: () => prefs.reduced(),
  onChange(list, activeId) {
    taskbar?.renderTasks(list, activeId);
    const covering = isCompact() && list.some((w) => w.state === "open");
    scene.setPaused(covering);
  },
});

const apps = createApps({ wm, prefs });
const desktop = createDesktop({ list: $("#desktop-icons"), openApp: (id, opener) => apps.open(id, opener) });
taskbar = createTaskbar({
  root: $("#taskbar"),
  startPanel: $("#start-menu"),
  switchPanel: $("#switcher"),
  wm,
  apps,
  prefs,
});

/* Preferences → interface */
let lastLamp = prefs.get().lamp;
function applyPrefs(p) {
  root.style.setProperty("--scale", String(p.scale));
  const reduced = prefs.reduced();
  root.classList.toggle("reduce-motion", reduced);
  root.classList.toggle("no-ambient", !p.ambient);
  scene.setAmbient(p.ambient && !reduced);
  setSoundEnabled(p.sound);
  if (p.lamp !== lastLamp) {
    lastLamp = p.lamp;
    scene.setLamp(p.lamp);
  }
}
prefs.subscribe(applyPrefs);
applyPrefs(prefs.get());

/* Compact layout flag */
const compactQuery = window.matchMedia("(max-width: 720px)");
const syncCompact = () => {
  document.body.classList.toggle("is-compact", compactQuery.matches);
  taskbar.renderTasks(wm.list(), wm.activeId);
  scene.setPaused(compactQuery.matches && wm.list().some((w) => w.state === "open"));
};
compactQuery.addEventListener?.("change", syncCompact);
syncCompact();

/* Clicking the empty desktop deselects icons — and the lamp has a switch. */
desktopEl.addEventListener("click", (e) => {
  if (e.target !== desktopEl && e.target.id !== "desktop-icons") return;
  desktop.clearSelection();
  closeAllMenus();
  if (scene.hitsLamp(e.clientX, e.clientY)) {
    const on = !prefs.get().lamp;
    prefs.set({ lamp: on });
    notify(on ? "Lamp on." : "Lamp off. The city keeps you company.", { icon: "logo", tone: "warm", duration: 2600 });
  }
});
desktopEl.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  const over = (e.target === desktopEl || e.target.id === "desktop-icons") && scene.hitsLamp(e.clientX, e.clientY);
  desktopEl.style.cursor = over ? "pointer" : "";
});

/* Deep links: titi-hub/#kotonoha opens that window. */
const known = new Set([...PROJECTS.map((p) => p.id), "about", "kofi", "settings", "files", "syslog"]);
function openFromHash() {
  const id = decodeURIComponent(location.hash.replace(/^#\/?/, "")).toLowerCase();
  if (known.has(id)) apps.open(id);
}
window.addEventListener("hashchange", openFromHash);

/* Boot */
runBootLog($("#boot-log"), { lampOn: prefs.get().lamp, reduced: prefs.reduced() });
openFromHash();
document.body.classList.add("is-ready");
