/**
 * Taskbar: start menu, open windows, system tray and clock.
 */
import { PROJECTS, STATUS_LABELS } from "../../config/projects.js";
import { SITE } from "../../config/settings.js";
import { h, frag } from "../utils/dom.js";
import { renderIcon, GLYPHS } from "../utils/icons.js";
import { createMenu, menuItem } from "./menu.js";
import { notify } from "./notify.js";

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

  /* Tray: sound */
  function renderSound(p) {
    soundBtn.innerHTML = p.sound ? GLYPHS.soundOn : GLYPHS.soundOff;
    soundBtn.setAttribute("aria-pressed", String(p.sound));
    soundBtn.title = p.sound ? "Sound on" : "Sound off";
  }
  soundBtn.addEventListener("click", () => {
    const on = !prefs.get().sound;
    prefs.set({ sound: on });
    notify(on ? "Sound on." : "Sound off.", { icon: "settings", sound: on ? "notify" : null, duration: 1800 });
  });
  prefs.subscribe(renderSound);
  renderSound(prefs.get());

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
