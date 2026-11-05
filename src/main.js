/**
 * TITI OS — boot.
 * Wires the scene, the window manager, the desktop, the taskbar and the
 * preferences together. Every module stays usable on its own.
 */
import { PROJECTS } from "../config/projects.js";
import { $, isCompact } from "./utils/dom.js";
import { createPrefs } from "./utils/prefs.js";
import { setSoundEnabled, setMasterVolume as setUiVolume, play } from "./utils/sound.js";
import * as music from "./utils/music.js";
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
const noop = () => {};
let scene = { setAmbient: noop, setPaused: noop, setLamp: noop, setRain: noop, setBlinds: noop, setMusic: noop, sip: () => 0, refill: noop, pokeCat: noop, cycleFans: noop, water: noop, hitTest: () => null, hitsLamp: () => false, locate: () => null, state: () => ({}) };
try {
  scene = createScene($("#scene"), { lamp: prefs.get().lamp, rain: prefs.get().rain, blinds: prefs.get().blinds });
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

/* Sound needs a first click or key press before the browser allows it. */
let activated = false;
const isActivated = () => activated || Boolean(navigator.userActivation?.hasBeenActive);
function onFirstGesture() {
  activated = true;
  music.wake();
  syncAmbientSound(prefs.get());
}
document.addEventListener("pointerdown", onFirstGesture);
document.addEventListener("keydown", onFirstGesture);
function syncAmbientSound(p) {
  if (!isActivated()) return;
  music.setRainSound(p.sound && p.rain);
}

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
  scene.setRain(p.rain);
  scene.setBlinds(p.blinds);
  const master = p.muted ? 0 : p.volume;
  setUiVolume(master);
  music.setMasterVolume(master);
  music.setMusicVolume(p.musicVolume);
  syncAmbientSound(p);
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

/* The room is clickable: every object does something. */
const sceneTip = $("#scene-tip");
const onBackground = (e) => e.target === desktopEl || e.target.id === "desktop-icons";

function toggleRecord() {
  const on = music.toggleMusic();
  notify(on ? "Now playing: TITI FM — lo-fi, composed live." : "Record stopped.", { icon: "logo", tone: "warm", duration: 2600, sound: null });
}

function sceneLabel(id) {
  const p = prefs.get();
  const st = scene.state();
  return {
    computer: "Computer — open Files",
    books: "BAM — academic notes",
    shelfbooks: "TRAD/LAB — translation lab",
    kanji: "言 — KOTONOHA",
    poster: "TITI'S ROOM",
    clock: "Clock — system log",
    lamp: p.lamp ? "Turn the lamp off" : "Turn the lamp on",
    pc: "Change the fan colour",
    cat: "Pet the cat",
    plant: "Water the plant",
    coffee: st.coffee > 0 ? "Take a sip" : "Empty mug — refill on Ko-fi",
    turntable: music.isPlaying() ? "Stop the record" : "Play a record",
    window: p.rain ? "Stop the rain" : "Let it rain",
    blinds: p.blinds ? "Raise the blinds" : "Lower the blinds",
  }[id];
}

const SCENE_ACTIONS = {
  computer: () => apps.openExplorer("applications"),
  books: () => apps.openProject("bam"),
  shelfbooks: () => apps.openProject("tradlab"),
  kanji: () => apps.openProject("kotonoha"),
  poster: () => apps.openProject("room"),
  clock: () => apps.openLog(),
  lamp: () => {
    const on = !prefs.get().lamp;
    prefs.set({ lamp: on });
    notify(on ? "Lamp on." : "Lamp off. The city keeps you company.", { icon: "logo", tone: "warm", duration: 2600 });
  },
  pc: () => {
    scene.cycleFans();
    play("click");
  },
  cat: () => {
    scene.pokeCat();
    if (prefs.get().sound) music.meow();
    notify("Mrrp.", { icon: "logo", duration: 1600, sound: null });
  },
  plant: (e) => {
    scene.water(e.clientX, e.clientY);
    if (prefs.get().sound) music.waterSound();
  },
  coffee: () => {
    const left = scene.sip();
    if (left === -1) {
      scene.refill();
      apps.openSupport();
      notify("Fresh coffee. Thanks for stopping by.", { icon: "kofi", tone: "warm", sound: null });
      return;
    }
    if (prefs.get().sound) music.sipSound();
    notify(left === 0 ? "Last sip. The mug is empty." : "A sip of coffee.", { icon: "kofi", tone: "warm", duration: 1800, sound: null });
  },
  turntable: toggleRecord,
  window: () => {
    const on = !prefs.get().rain;
    prefs.set({ rain: on });
    notify(on ? "It's raining on Marseille." : "The rain stops.", { icon: "logo", duration: 2200 });
  },
  blinds: () => {
    const down = !prefs.get().blinds;
    prefs.set({ blinds: down });
    notify(down ? "Blinds down. Something glows in the dark…" : "Blinds up.", { icon: "logo", duration: 2400 });
  },
};

desktopEl.addEventListener("click", (e) => {
  if (!onBackground(e)) return;
  desktop.clearSelection();
  closeAllMenus();
  const id = scene.hitTest(e.clientX, e.clientY);
  if (id && SCENE_ACTIONS[id]) {
    SCENE_ACTIONS[id](e);
    if (sceneTip && !sceneTip.hidden) sceneTip.textContent = sceneLabel(id);
  }
});

desktopEl.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  const id = onBackground(e) ? scene.hitTest(e.clientX, e.clientY) : null;
  desktopEl.style.cursor = id ? "pointer" : "";
  if (!sceneTip) return;
  if (!id) {
    sceneTip.hidden = true;
    return;
  }
  sceneTip.textContent = sceneLabel(id);
  sceneTip.hidden = false;
  const r = sceneTip.getBoundingClientRect();
  const x = Math.min(e.clientX + 14, window.innerWidth - r.width - 8);
  const y = e.clientY + 18 + r.height > window.innerHeight - 50 ? e.clientY - r.height - 10 : e.clientY + 18;
  sceneTip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
});
desktopEl.addEventListener("pointerleave", () => {
  if (sceneTip) sceneTip.hidden = true;
});

/* The record player, seen from the taskbar too. */
const musicBtn = $(".tray-music");
music.onMusicChange(({ playing }) => {
  scene.setMusic(playing);
  if (musicBtn) {
    musicBtn.hidden = !playing;
    musicBtn.setAttribute("aria-pressed", String(playing));
  }
});
musicBtn?.addEventListener("click", () => {
  music.stopMusic();
  notify("Record stopped.", { icon: "logo", duration: 1800, sound: null });
});

/* A small handle for debugging from the console. */
window.titiOS = { scene, music, prefs, open: (id) => apps.open(id) };

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
