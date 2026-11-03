/**
 * Window contents: project previews, About, Support, Settings,
 * the file explorer and the system log. Everything reads from
 * config/projects.js and config/settings.js.
 */
import { PROJECTS, STATUS_LABELS, isLaunchable } from "../../config/projects.js";
import { SITE, ABOUT, SCALE_STEPS } from "../../config/settings.js";
import { h, frag } from "../utils/dom.js";
import { renderIcon, GLYPHS } from "../utils/icons.js";
import { notify } from "./notify.js";
import { play } from "../utils/sound.js";
import * as music from "../utils/music.js";

const icon = (name, cls = "glyph") => frag(`<span class="${cls}">${renderIcon(name)}</span>`);
const external = (label) => [label, frag(GLYPHS.external), h("span", { class: "visually-hidden" }, " (opens in a new tab)")];

/* ------------------------------------------------------------- splashes */

const SPLASHES = {
  editorial: (p) =>
    h(
      "div",
      { class: "splash splash--editorial", "aria-hidden": "true" },
      h("div", { class: "masthead" }, h("b", {}, p.name), h("span", {}, "ゼミ · 報告 · 考察")),
      h(
        "ul",
        { class: "rubrics" },
        p.contents.map((c) => {
          const [fr, jp] = c.split(" / ");
          return h("li", {}, fr, jp && h("small", {}, jp));
        })
      )
    ),

  lab: () =>
    h(
      "div",
      { class: "splash splash--lab", "aria-hidden": "true" },
      h("span", { class: "stamp" }, "LAB"),
      h(
        "div",
        { class: "specimen" },
        frag("<ruby>言葉<rt>kotoba</rt></ruby>"),
        h("span", { class: "bracket" }),
        h("span", { class: "gloss" }, "n. word · language")
      )
    ),

  columns: () =>
    h(
      "div",
      { class: "splash splash--columns", "aria-hidden": "true" },
      frag(`<span class="temple">${renderIcon("agora")}</span>`),
      h("div", { class: "tape" }, h("span", {}, "UNDER DEVELOPMENT"))
    ),

  genko: () =>
    h(
      "div",
      { class: "splash splash--genko", "aria-hidden": "true" },
      h("div", { class: "genko" }, ["言", "の", "葉", "", "", ""].map((c) => h("span", {}, c))),
      h(
        "ol",
        { class: "levels" },
        ["N4", "N3", "N2"].map((n) => h("li", {}, h("b", {}, n)))
      )
    ),

  door: () =>
    h(
      "div",
      { class: "splash splash--door", "aria-hidden": "true" },
      frag(`<span class="door">${renderIcon("room")}</span>`),
      h("span", { class: "spill" }),
      h("span", { class: "sign" }, "not open yet")
    ),
};

/* --------------------------------------------------------- the factory */

export function createApps({ wm, prefs }) {
  const projectById = (id) => PROJECTS.find((p) => p.id === id);

  /* ---------------------------------------------------------- projects */

  function statusChip(status) {
    return h("span", { class: "chip notched", dataset: { status } }, STATUS_LABELS[status] || status);
  }

  function launchArea(p) {
    if (isLaunchable(p)) {
      const host = p.url.replace(/^https:\/\//, "").replace(/\/$/, "");
      return h(
        "div",
        { class: "launch" },
        h(
          "a",
          {
            class: "btn notched",
            href: p.url,
            target: "_blank",
            rel: "noopener",
            onclick: () => notify(`${p.name} opened in a new tab.`, { icon: p.icon }),
          },
          external("Open application")
        ),
        h("span", { class: "launch__url" }, host)
      );
    }
    const copy = {
      "under-development": ["Under development", `${p.name} is not public yet. This window becomes its launcher the day it ships.`],
      "coming-soon": ["Coming soon", `${p.name} has no public address yet. The door opens from here when it's ready.`],
      "link-pending": ["Link not configured", `${p.name} exists, but its public address hasn't been added to this desktop yet.`],
    }[p.status] || ["Unavailable", `${p.name} can't be opened from here yet.`];
    return h(
      "div",
      { class: "notice", role: "status" },
      h("span", { class: "loader ambient", "aria-hidden": "true" }, h("i"), h("i"), h("i")),
      h("div", {}, h("p", { class: "notice__title" }, copy[0]), h("p", { class: "notice__text" }, copy[1]))
    );
  }

  function openProject(id, opener) {
    const p = projectById(id);
    if (!p) return;
    wm.open({
      id: p.id,
      title: p.name,
      icon: p.icon,
      path: `~/applications/${p.file}`,
      width: "34rem",
      accent: p.accent,
      opener,
      build(body) {
        const splash = (SPLASHES[p.splash] || SPLASHES.editorial)(p);
        body.append(
          h(
            "article",
            { class: "app" },
            splash,
            h(
              "div",
              { class: "app-section" },
              h(
                "div",
                { class: "project-head" },
                icon(p.icon, "project-head__icon"),
                h("div", { class: "project-head__text" }, h("h3", { class: "project-name" }, p.name), h("p", { class: "project-tagline" }, p.tagline)),
                statusChip(p.status)
              ),
              h("p", { class: "project-desc" }, p.description)
            ),
            h(
              "div",
              { class: "app-section" },
              h("h4", { class: "contents-caption" }, "Inside"),
              h("ul", { class: "tags" }, p.contents.map((c) => h("li", {}, c)))
            ),
            h("div", { class: "app-section" }, launchArea(p))
          )
        );
      },
    });
  }

  /* -------------------------------------------------------------- about */

  function openAbout(opener) {
    wm.open({
      id: "about",
      title: "About Titi",
      icon: "about",
      path: "~/about/about_titi.txt",
      width: "34rem",
      accent: "#C49B70",
      opener,
      build(body) {
        const links = [];
        if (SITE.githubUrl) {
          links.push(h("a", { class: "btn notched", href: SITE.githubUrl, target: "_blank", rel: "noopener" }, external("GitHub")));
        }
        links.push(
          h("button", { class: "btn btn--ghost notched", type: "button", onclick: (e) => openSupport(e.currentTarget) }, "Support my work")
        );
        body.append(
          h(
            "article",
            { class: "app" },
            h(
              "div",
              { class: "app-section" },
              h(
                "div",
                { class: "about-hero" },
                icon("logo", "portrait"),
                h("div", {}, h("h3", { class: "about-name" }, ABOUT.name), ABOUT.fullName && h("p", { class: "about-sub" }, ABOUT.fullName + " · developer of everything on this desktop"))
              )
            ),
            h("div", { class: "app-section prose" }, h("p", {}, ABOUT.intro), ABOUT.body && h("p", {}, ABOUT.body)),
            h(
              "div",
              { class: "app-section facts" },
              h("div", {}, h("h3", {}, "Interests"), h("ul", {}, ABOUT.interests.map((i) => h("li", {}, i)))),
              h(
                "div",
                {},
                h("h3", {}, "Languages"),
                h("ul", {}, ABOUT.languages.map((l) => h("li", { lang: l.label === "日本語" ? "ja" : l.label === "Français" ? "fr" : null }, l.label, l.note && h("small", { lang: "en" }, l.note))))
              ),
              h(
                "div",
                {},
                h("h3", {}, "Independent projects"),
                h(
                  "ul",
                  {},
                  PROJECTS.map((p) =>
                    h("li", {}, h("button", { class: "linkish", type: "button", onclick: (e) => openProject(p.id, e.currentTarget) }, p.name), h("small", {}, STATUS_LABELS[p.status]))
                  )
                )
              )
            ),
            h("div", { class: "app-section button-row" }, links)
          )
        );
      },
    });
  }

  /* ------------------------------------------------------------ support */

  function openSupport(opener) {
    wm.open({
      id: "kofi",
      title: "Support my work",
      icon: "kofi",
      path: "~/personal/support.lnk",
      width: "26rem",
      accent: "#C49B70",
      opener,
      build(body) {
        const ready = /^https:\/\//.test(SITE.kofiUrl || "");
        const action = ready
          ? h(
              "a",
              {
                class: "btn notched",
                href: SITE.kofiUrl,
                target: "_blank",
                rel: "noopener",
                onclick: () => notify("Ko-fi opened in a new tab. Thank you.", { icon: "kofi", tone: "warm" }),
              },
              "BUY ME A COFFEE ☕",
              h("span", { class: "visually-hidden" }, " (opens Ko-fi in a new tab)")
            )
          : h("button", { class: "btn notched", type: "button", disabled: true, "aria-describedby": "kofi-missing" }, "BUY ME A COFFEE ☕");
        body.append(
          h(
            "article",
            { class: "support" },
            h("div", { class: "cup", "aria-hidden": "true" }, frag(renderIcon("kofi")), h("span", { class: "steam ambient" }, h("i"), h("i"), h("i"))),
            h("h3", {}, "SUPPORT MY WORK"),
            h(
              "p",
              {},
              "These projects are independently developed and maintained. If you enjoy what I build, you can help me keep creating."
            ),
            action,
            ready
              ? h("p", { class: "note" }, SITE.kofiUrl.replace(/^https:\/\//, ""))
              : h("p", { class: "note", id: "kofi-missing" }, "Ko-fi link not configured yet.")
          )
        );
      },
    });
  }

  /* ----------------------------------------------------------- settings */

  function openSettings(opener) {
    let unsubscribe = () => {};
    wm.open({
      id: "settings",
      title: "Settings",
      icon: "settings",
      path: "~/personal/settings.cfg",
      width: "30rem",
      opener,
      onClose: () => unsubscribe(),
      build(body) {
        const switches = [];

        const row = (label, help, control) =>
          h("li", {}, h("div", {}, h("p", { class: "setting__label", id: `set-${label.replace(/\W+/g, "-")}` }, label), help && h("p", { class: "setting__help" }, help)), control);

        const toggle = (key, label, help, { get, set } = {}) => {
          const id = `set-${label.replace(/\W+/g, "-")}`;
          const state = h("span", { class: "switch__state", "aria-hidden": "true" });
          const btn = h("button", {
            class: "switch",
            type: "button",
            role: "switch",
            "aria-labelledby": id,
            onclick: () => {
              const current = get ? get() : prefs.get()[key];
              if (set) set(!current);
              else prefs.set({ [key]: !current });
              play("click");
            },
          });
          switches.push(() => {
            const on = get ? get() : prefs.get()[key];
            btn.setAttribute("aria-checked", String(on));
            state.textContent = on ? "on" : "off";
          });
          return row(label, help, h("div", { class: "setting__control" }, state, btn));
        };

        const scaleGroup = h(
          "div",
          { class: "segmented", role: "radiogroup", "aria-labelledby": "set-Interface-scale" },
          SCALE_STEPS.map((s) =>
            h(
              "button",
              {
                type: "button",
                role: "radio",
                "data-scale": s,
                onclick: () => {
                  prefs.set({ scale: s });
                  play("click");
                },
                onkeydown: (e) => {
                  const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
                  if (!(e.key in keys)) return;
                  e.preventDefault();
                  const i = SCALE_STEPS.indexOf(prefs.get().scale);
                  const next = SCALE_STEPS[(i + keys[e.key] + SCALE_STEPS.length) % SCALE_STEPS.length];
                  prefs.set({ scale: next });
                  scaleGroup.querySelector(`[data-scale="${next}"]`)?.focus();
                },
              },
              Math.round(s * 100) + "%"
            )
          )
        );
        switches.push(() => {
          const cur = prefs.get().scale;
          scaleGroup.querySelectorAll("button").forEach((b) => {
            const on = Number(b.dataset.scale) === cur;
            b.setAttribute("aria-checked", String(on));
            b.tabIndex = on ? 0 : -1;
          });
        });

        const volume = h("input", {
          class: "range",
          type: "range",
          min: "0",
          max: "100",
          step: "5",
          "aria-labelledby": "set-Music-volume",
          oninput: (e) => prefs.set({ musicVolume: Number(e.target.value) / 100 }),
        });
        switches.push(() => {
          const v = Math.round(prefs.get().musicVolume * 100);
          if (document.activeElement !== volume) volume.value = String(v);
          volume.style.setProperty("--fill", v + "%");
          volume.setAttribute("aria-valuetext", v + "%");
        });

        const motionHelp = h("span");
        switches.push(() => {
          motionHelp.textContent =
            prefs.get().reducedMotion === null
              ? `Following your system (${prefs.systemReduced() ? "reduced" : "full motion"}).`
              : "Set by you on this desktop.";
        });

        body.append(
          h(
            "ul",
            { class: "settings-list" },
            toggle("sound", "Sound", "Small interface sounds. Off until you turn it on."),
            toggle("ambient", "Ambient animation", "Gulls, neon, city lights and the cat."),
            toggle("reducedMotion", "Reduce motion", motionHelp, {
              get: () => prefs.reduced(),
              set: (v) => prefs.set({ reducedMotion: v }),
            }),
            toggle("lamp", "Desk lamp", "The warm light on the desk."),
            toggle("rain", "Rain", "Rain on Marseille, and on the window."),
            toggle("blinds", "Blinds down", "Darkens the room. Something glows."),
            toggle("record", "Record player", "Lo-fi composed live in your browser.", {
              get: () => music.isPlaying(),
              set: () => music.toggleMusic(),
            }),
            row("Music volume", null, volume),
            row("Interface scale", "Size of text, icons and windows.", scaleGroup),
            row(
              "Desktop layout",
              "Put every window back in its default place.",
              h(
                "button",
                {
                  class: "btn btn--ghost notched",
                  type: "button",
                  onclick: () => {
                    wm.resetLayout();
                    notify("Desktop layout reset.", { icon: "settings" });
                  },
                },
                "Reset layout"
              )
            ),
            row(
              "All settings",
              "Sound off, animation on, system motion, 100%.",
              h(
                "button",
                {
                  class: "btn btn--ghost notched",
                  type: "button",
                  onclick: () => {
                    prefs.reset();
                    notify("Settings restored to defaults.", { icon: "settings" });
                  },
                },
                "Restore defaults"
              )
            )
          )
        );
        const sync = () => switches.forEach((fn) => fn());
        sync();
        const offPrefs = prefs.subscribe(sync);
        const offMusic = music.onMusicChange(sync);
        unsubscribe = () => {
          offPrefs();
          offMusic();
        };
      },
    });
  }

  /* ----------------------------------------------------------- explorer */

  function folders() {
    const project = (p) => ({
      name: p.file,
      icon: p.icon,
      meta: STATUS_LABELS[p.status],
      open: (el) => openProject(p.id, el),
    });
    const aboutEntries = [{ name: "about_titi.txt", icon: "about", meta: "text", open: (el) => openAbout(el) }];
    if (SITE.githubUrl) aboutEntries.push({ name: "github.url", icon: "link", meta: "github.com", href: SITE.githubUrl });
    aboutEntries.push({ name: "system.log", icon: "text", meta: "log", open: (el) => openLog(el) });

    return [
      { id: "applications", path: "/APPLICATIONS", items: PROJECTS.map(project) },
      {
        id: "personal",
        path: "/PERSONAL",
        items: [
          ...PROJECTS.filter((p) => p.personal).map(project),
          { name: "support.lnk", icon: "kofi", meta: "Ko-fi", open: (el) => openSupport(el) },
          { name: "settings.cfg", icon: "settings", meta: "preferences", open: (el) => openSettings(el) },
        ],
      },
      {
        id: "projects",
        path: "/PROJECTS",
        items: PROJECTS.map((p) => ({
          name: `${p.id}/`,
          icon: "files",
          meta: isLaunchable(p) ? p.url.replace(/^https:\/\//, "").replace(/\/$/, "") : "no public address yet",
          open: (el) => openProject(p.id, el),
        })),
      },
      { id: "about", path: "/ABOUT", items: aboutEntries },
    ];
  }

  let explorerNavigate = null;

  function openExplorer(folderId = "applications", opener) {
    if (wm.has("files") && explorerNavigate) {
      explorerNavigate(folderId);
      wm.focus("files", { moveFocus: true });
      return;
    }
    wm.open({
      id: "files",
      title: "Files",
      icon: "files",
      path: "~/",
      width: "38rem",
      opener,
      onClose: () => (explorerNavigate = null),
      build(body) {
        const data = folders();
        const side = h("nav", { class: "explorer__side", "aria-label": "Folders" });
        const pathEl = h("span");
        const list = h("ul", { class: "file-list" });
        const foot = h("p", { class: "explorer__foot", "aria-live": "polite" });

        const show = (id, { focusList = false } = {}) => {
          const folder = data.find((f) => f.id === id) || data[0];
          side.querySelectorAll(".folder-btn").forEach((b) => b.setAttribute("aria-current", String(b.dataset.folder === folder.id)));
          pathEl.textContent = "C:" + folder.path;
          list.replaceChildren(
            ...folder.items.map((item) => {
              const inner = [icon(item.icon), h("span", { class: "file-row__name" }, item.name), h("span", { class: "file-row__meta" }, item.meta)];
              const el = item.href
                ? h("a", { class: "file-row", href: item.href, target: "_blank", rel: "noopener" }, inner, h("span", { class: "visually-hidden" }, " (opens in a new tab)"))
                : h("button", { class: "file-row", type: "button", onclick: (e) => item.open(e.currentTarget) }, inner);
              return h("li", {}, el);
            })
          );
          foot.textContent = `${folder.items.length} item${folder.items.length === 1 ? "" : "s"}`;
          if (focusList) list.querySelector(".file-row")?.focus();
        };

        data.forEach((f) =>
          side.append(
            h(
              "button",
              {
                class: "folder-btn",
                type: "button",
                "data-folder": f.id,
                onclick: () => {
                  show(f.id);
                  play("select");
                },
              },
              icon("files"),
              f.path
            )
          )
        );

        body.append(
          h(
            "div",
            { class: "explorer" },
            side,
            h(
              "div",
              { class: "explorer__main" },
              h("p", { class: "explorer__path" }, pathEl, h("span", { class: "caret", "aria-hidden": "true" }, "_")),
              list,
              foot
            )
          )
        );
        show(folderId);
        explorerNavigate = (id) => show(id, { focusList: true });
      },
    });
  }

  /* --------------------------------------------------------- system log */

  function openLog(opener) {
    let timer = 0;
    wm.open({
      id: "syslog",
      title: "system.log",
      icon: "text",
      path: "~/about/system.log",
      width: "28rem",
      opener,
      onClose: () => clearInterval(timer),
      build(body) {
        const pre = h("div", { class: "syslog", role: "log" });
        const pad = (n) => String(n).padStart(2, "0");
        const line = (k, v, cls = "v") => h("p", {}, h("span", { class: "k" }, k.padEnd(14, ".") + " "), h("span", { class: cls }, v));
        const render = () => {
          const up = Math.floor((Date.now() - window.__titiBoot) / 1000);
          const counts = PROJECTS.reduce((acc, p) => ((acc[p.status] = (acc[p.status] || 0) + 1), acc), {});
          const p = prefs.get();
          pre.replaceChildren(
            h("p", { class: "ok" }, `${SITE.os} ${SITE.version} — ${SITE.edition.toLowerCase()}`),
            line("session", `${pad(Math.floor(up / 3600))}:${pad(Math.floor(up / 60) % 60)}:${pad(up % 60)}`),
            line("viewport", `${window.innerWidth}×${window.innerHeight}`),
            line("windows", `${wm.list().length} open`),
            line("applications", Object.entries(counts).map(([s, n]) => `${n} ${STATUS_LABELS[s].toLowerCase()}`).join(", ")),
            line("outside", p.ambient && !prefs.reduced() ? "marseille, dusk" : "marseille, dusk (still)"),
            line("lamp", p.lamp ? "on" : "off", p.lamp ? "warm" : "v"),
            line("rain", p.rain ? "falling" : "none"),
            line("blinds", p.blinds ? "down — fireflies out" : "up"),
            line("record", music.isPlaying() ? "TITI FM, side A" : "stopped", music.isPlaying() ? "ok" : "v"),
            line("sound", p.sound ? "on" : "off"),
            h("p", { class: "k" }, "› everything in the room answers to a click. try the cat.")
          );
        };
        render();
        timer = setInterval(render, 1000);
        body.append(pre);
      },
    });
  }

  /* -------------------------------------------------------------- router */

  const SYSTEM = {
    about: openAbout,
    kofi: openSupport,
    settings: openSettings,
    files: (opener) => openExplorer("applications", opener),
    syslog: openLog,
  };

  function open(id, opener) {
    if (SYSTEM[id]) return SYSTEM[id](opener);
    return openProject(id, opener);
  }

  return { open, openProject, openAbout, openSupport, openSettings, openExplorer, openLog };
}
