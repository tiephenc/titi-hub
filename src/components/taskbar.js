/**
 * Taskbar: start menu, open windows, system tray and clock.
 */
import { PROJECTS, STATUS_LABELS } from "../../config/projects.js";
import { SITE } from "../../config/settings.js";
import { h, frag } from "../utils/dom.js";
import { renderIcon, GLYPHS } from "../utils/icons.js";
import { createMenu, menuItem } from "./menu.js";
import { notify } from "./notify.js";
import * as music from "../utils/music.js";

const glyph = (name) => frag(`<span class="glyph">${renderIcon(name)}</span>`);

function greeting(d = new Date()) {
  const hr = d.getHours();
  if (hr < 5) return "still awake";
  if (hr < 12) return "good morning";
  if (hr < 18) return "good afternoon";
  if (hr < 22) return "good evening";
  return "late night";
}

export function createTaskbar({ root, startPanel, switchPanel, wm, apps, prefs }) {
  const startBtn = root.querySelector(".tb-start");
  const tasks = root.querySelector(".tb-tasks");
  const switchBtn = root.querySelector(".tb-switch");
  const switchCount = switchBtn.querySelector(".tb-switch__count");
  const statusEl = root.querySelector(".tray-status");
  const statusLabel = statusEl.querySelector(".tray-status__label");
  const soundBtn = root.querySelector(".tray-sound");
  const kofiBtn = root.querySelector(".tray-kofi");
  const clockBtn = root.querySelector(".tray-clock");

  startBtn.prepend(glyph("logo"));
  kofiBtn.append(glyph("kofi"));

  /* Start menu */
  const start = createMenu({
    button: startBtn,
    panel: startPanel,
    label: "Start",
    render: (menu) => [
      h(
        "div",
        { class: "menu-head" },
        glyph("logo"),
        h("div", {}, h("p", { class: "menu-head__title" }, SITE.os), h("p", { class: "menu-head__sub" }, `${SITE.edition.toLowerCase()} · ${greeting()}`))
      ),
      h(
        "div",
        { class: "menu-group", role: "group", "aria-labelledby": "menu-cap-apps" },
        h("p", { class: "menu-caption", id: "menu-cap-apps" }, "Applications"),
        PROJECTS.map((p) =>
          menuItem({ menu, name: p.name, meta: STATUS_LABELS[p.status].toLowerCase(), icon: glyph(p.icon), run: (o) => apps.openProject(p.id, o) })
        )
      ),
      h(
        "div",
        { class: "menu-group", role: "group", "aria-labelledby": "menu-cap-sys" },
        h("p", { class: "menu-caption", id: "menu-cap-sys" }, "This desktop"),
        menuItem({ menu, name: "Personal space", meta: "/personal", icon: glyph("files"), run: (o) => apps.openExplorer("personal", o) }),
        menuItem({ menu, name: "About Titi", icon: glyph("about"), run: (o) => apps.openAbout(o) }),
        menuItem({ menu, name: "Support my work", meta: "ko-fi", icon: glyph("kofi"), run: (o) => apps.openSupport(o) }),
        menuItem({ menu, name: "Files", icon: glyph("files"), run: (o) => apps.openExplorer("applications", o) }),
        menuItem({ menu, name: "Settings", icon: glyph("settings"), run: (o) => apps.openSettings(o) })
      ),
      h("p", { class: "menu-foot" }, `${SITE.os} ${SITE.version}`),
    ],
  });

  /* Window switcher (compact screens) */
  const switcher = createMenu({
    button: switchBtn,
    panel: switchPanel,
    label: "Open windows",
    render: (menu) => {
      const open = wm.list();
      const head = h("div", { class: "menu-head" }, frag(`<span class="glyph">${GLYPHS.windows}</span>`), h("div", {}, h("p", { class: "menu-head__title" }, "Open windows"), h("p", { class: "menu-head__sub" }, open.length ? `${open.length} running` : "nothing running")));
      if (!open.length) {
        return [head, h("p", { class: "menu-caption", style: { padding: "1rem" } }, "Tap an icon on the desktop to open something.")];
      }
      return [
        head,
        h(
          "div",
          { class: "menu-group" },
          open.map((w) =>
            menuItem({ menu, name: w.title, meta: w.state === "minimized" ? "minimized" : w.id === wm.activeId ? "in front" : "", icon: glyph(w.icon), run: () => wm.focus(w.id, { moveFocus: true }) })
          )
        ),
        h("div", { class: "menu-group" }, menuItem({ menu, name: "Close all windows", icon: glyph("logo"), run: () => wm.closeAll() })),
      ];
    },
  });

  /* Tasks */
  function renderTasks(list, activeId) {
    tasks.replaceChildren(
      ...list.map((w) => {
        const state = w.state === "minimized" ? "minimized" : w.id === activeId ? "active" : "open";
        return h(
          "button",
          {
            class: "tb-btn tb-task",
            type: "button",
            "data-task": w.id,
            "data-state": state,
            "aria-pressed": String(state === "active"),
            title: state === "minimized" ? `${w.title} (minimized)` : w.title,
            onclick: () => wm.toggle(w.id),
          },
          glyph(w.icon),
          h("span", { class: "tb-task__name" }, w.title)
        );
      })
    );
    const n = list.length;
    switchCount.textContent = String(n);
    switchBtn.setAttribute("aria-label", `Open windows: ${n}`);
  }

  /* Tray: connection status */
  function renderStatus(announce) {
    const online = navigator.onLine !== false;
    statusEl.dataset.online = String(online);
    statusLabel.textContent = online ? "online" : "offline";
    statusEl.title = online ? "Connected — applications can open" : "No connection — applications will open when you're back online";
    if (announce) notify(online ? "Connection restored." : "You're offline. Applications open again once you reconnect.", { icon: "logo", tone: online ? "cool" : "warm" });
  }
  window.addEventListener("online", () => renderStatus(true));
  window.addEventListener("offline", () => renderStatus(true));
  renderStatus(false);

  /* Tray: global volume — the speaker opens a small panel. */
  const volPanel = document.getElementById("volume-panel");
  const volMaster = document.getElementById("vol-master");
  const volMusic = document.getElementById("vol-music");
  const volSounds = document.getElementById("vol-sounds");
  const volMute = document.getElementById("vol-mute");
  const volRecord = document.getElementById("vol-record");
  const outputs = volPanel.querySelectorAll(".vol-value");

  function renderVolume() {
    const p = prefs.get();
    const level = p.muted ? 0 : p.volume;
    const pct = Math.round(level * 100);
    soundBtn.innerHTML = level < 0.01 ? GLYPHS.soundOff : level < 0.5 ? GLYPHS.soundLow : GLYPHS.soundOn;
    const label = p.muted ? "Volume: muted" : `Volume: ${pct}%`;
    soundBtn.setAttribute("aria-label", label);
    soundBtn.title = label;
    soundBtn.classList.toggle("is-muted", level < 0.01);
    if (document.activeElement !== volMaster) volMaster.value = String(Math.round(p.volume * 100));
    if (document.activeElement !== volMusic) volMusic.value = String(Math.round(p.musicVolume * 100));
    volMaster.style.setProperty("--fill", Math.round(p.volume * 100) + "%");
    volMusic.style.setProperty("--fill", Math.round(p.musicVolume * 100) + "%");
    volMaster.setAttribute("aria-valuetext", p.muted ? "muted" : Math.round(p.volume * 100) + "%");
    volMusic.setAttribute("aria-valuetext", Math.round(p.musicVolume * 100) + "%");
    outputs[0].textContent = p.muted ? "mute" : Math.round(p.volume * 100) + "%";
    outputs[1].textContent = Math.round(p.musicVolume * 100) + "%";
    volMaster.closest(".vol-row").classList.toggle("is-muted", p.muted);
    volSounds.setAttribute("aria-checked", String(p.sound));
    volMute.textContent = p.muted ? "Unmute" : "Mute all";
    volMute.setAttribute("aria-pressed", String(p.muted));
    volRecord.textContent = music.isPlaying() ? "Stop the record" : "Play a record";
  }

  function openVolume() {
    closeMenus();
    volPanel.hidden = false;
    soundBtn.setAttribute("aria-expanded", "true");
    volPanel.classList.remove("is-opening");
    void volPanel.offsetWidth;
    volPanel.classList.add("is-opening");
    renderVolume();
    volMaster.focus();
  }
  function closeVolume({ returnFocus = false } = {}) {
    if (volPanel.hidden) return;
    volPanel.hidden = true;
    soundBtn.setAttribute("aria-expanded", "false");
    if (returnFocus) soundBtn.focus();
  }
  function closeMenus() {
    start.close();
    switcher.close();
  }

  soundBtn.addEventListener("click", () => (volPanel.hidden ? openVolume() : closeVolume()));
  volMaster.addEventListener("input", () => prefs.set({ volume: Number(volMaster.value) / 100, muted: false }));
  volMusic.addEventListener("input", () => prefs.set({ musicVolume: Number(volMusic.value) / 100 }));
  volSounds.addEventListener("click", () => {
    const on = !prefs.get().sound;
    prefs.set({ sound: on, ...(on ? { muted: false } : {}) });
  });
  volMute.addEventListener("click", () => prefs.set({ muted: !prefs.get().muted }));
  volRecord.addEventListener("click", () => {
    const on = music.toggleMusic();
    if (on && prefs.get().muted) prefs.set({ muted: false });
    renderVolume();
  });
  volPanel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeVolume({ returnFocus: true });
    }
  });
  document.addEventListener("pointerdown", (e) => {
    if (volPanel.hidden || volPanel.contains(e.target) || soundBtn.contains(e.target)) return;
    closeVolume();
  });
  startBtn.addEventListener("click", () => closeVolume());
  switchBtn.addEventListener("click", () => closeVolume());
  prefs.subscribe(renderVolume);
  music.onMusicChange(renderVolume);
  renderVolume();

  /* Tray: Ko-fi */
  kofiBtn.addEventListener("click", (e) => apps.openSupport(e.currentTarget));

  /* Tray: clock — opens the system log */
  const timeEl = clockBtn.querySelector("time");
  function tick() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    timeEl.innerHTML = `${hh}<span class="colon ambient">:</span>${mm}`;
    timeEl.dateTime = d.toISOString();
    const full = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
    clockBtn.title = `${full} — open system log`;
    clockBtn.setAttribute("aria-label", `${hh}:${mm}, ${full}. Open system log`);
  }
  tick();
  setTimeout(() => {
    tick();
    setInterval(tick, 60000);
  }, (60 - new Date().getSeconds()) * 1000);
  clockBtn.addEventListener("click", (e) => apps.openLog(e.currentTarget));

  return { renderTasks, start, switcher };
}
