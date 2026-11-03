# TITI'S HUB.exe

**TITI OS — Digital Environment 01.** A small pixel-art desktop at night that opens every project by Titi.

Live: https://tiephenc.github.io/titi-hub/

No framework, no build step, no dependencies: plain HTML, CSS and JavaScript modules, served as-is by GitHub Pages.

## Everyday maintenance

Almost everything is edited in two files.

### Add, change or publish an application — `config/projects.js`

Each entry looks like this:

```js
{
  id: "kotonoha",                 // lowercase, unique; also the deep link (#kotonoha)
  name: "KOTONOHA",
  file: "kotonoha.app",           // name shown in the file explorer
  tagline: "言の葉 — learn Japanese from N4 to N2",
  description: "…",
  contents: ["Grammar lessons", "…"],
  url: "https://tiephenc.github.io/kotonoha/",
  status: "online",
  icon: "kotonoha",               // a key of MAPS in src/utils/icons.js
  accent: "#8FA68E",
  splash: "genko",                // small visual identity, see SPLASHES in src/components/apps.js
}
```

Statuses:

| status | what the window shows |
| --- | --- |
| `online` | **Open application** button (new tab). Needs an `https://` URL. |
| `link-pending` | "Link not configured" — the project exists but its address isn't set. |
| `under-development` | "Under development", no button. |
| `coming-soon` | "Coming soon", no button. |

**To publish a project:** paste its address into `url` and change `status` to `"online"`. The desktop icon, start menu, file explorer and preview window all update from that one entry.

**To add a new application:** add an entry. It appears on the desktop, in the start menu and in `/APPLICATIONS` automatically. Reuse an existing `icon` and `splash`, or draw a new 16×16 icon in `src/utils/icons.js` (one character per pixel, colours in `PALETTE`).

### Personal links and the About text — `config/settings.js`

- `SITE.kofiUrl` — the Ko-fi page. Set it to `""` and the button is disabled with a note.
- `SITE.githubUrl` — shown in About and `/ABOUT/github.url`.
- `ABOUT` — the text of the About window. Only put published facts here.

## Publishing

Every push to `main` runs `.github/workflows/pages.yml`:

1. `node scripts/check.mjs` — checks that every script parses, every referenced file exists, and the project registry is valid (an `online` project without an `https` URL fails the build). Nothing is deployed if it fails.
2. Copies `index.html`, `404.html`, `assets/`, `config/` and `src/` into `_site` and deploys it to GitHub Pages.

Run the same check locally before pushing:

```sh
node scripts/check.mjs
```

Preview locally with any static server, from the repository root:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

(Opening `index.html` directly from disk will not work: browsers block JavaScript modules on `file://`.)

## How it is built

```
index.html                 page shell, SEO / Open Graph metadata
404.html                   "file not found" page for GitHub Pages
config/
  projects.js              the application registry (single source of URLs)
  settings.js              site links, About text, default preferences
src/
  main.js                  boot: wires everything together
  components/
    scene.js               the room and Marseille at dusk, painted on a low-res canvas
    windowManager.js       open / focus / move / minimise / close, saved positions
    apps.js                window contents: projects, About, Ko-fi, Settings, Files, system.log
    desktop.js             desktop icons and the boot log
    taskbar.js             start menu, tasks, tray, clock
    menu.js                accessible popover menus
    notify.js              small system notifications
  utils/
    icons.js               16×16 pixel icons as SVG
    prefs.js               preferences store (localStorage)
    storage.js, sound.js, dom.js
  styles/
    base.css               tokens, type, buttons
    desktop.css            desktop, taskbar, menus, compact layout
    windows.css            window chrome
    apps.css               window contents
assets/                    favicon, touch icon, Open Graph image
scripts/check.mjs          pre-deploy checks
```

### Behaviour worth knowing

- **Mouse:** click selects an icon, double-click opens it. **Touch and narrow screens (≤ 720 px):** one tap opens, windows become full-screen sheets, and the taskbar shows a window switcher instead of task buttons. Dragging is mouse-only, so touch scrolling is never captured.
- **Keyboard:** Tab or arrow keys move between icons, Enter opens. Escape closes the focused window or menu. With a title bar focused, arrow keys move the window (Shift for bigger steps). The start menu opens with Enter/↑ and is navigated with arrows.
- **Settings** (sound, ambient animation, reduced motion, desk lamp, interface scale) persist in `localStorage` under `titios.*`. Sound is off by default and nothing ever autoplays. Reduced motion follows the system until the visitor changes it.
- **Deep links:** `…/titi-hub/#kotonoha`, `#about`, `#kofi`, `#settings`, `#files`, `#syslog` open that window on load.
- The scene pauses when the tab is hidden, when a full-screen window covers it on mobile, and when animation or motion is turned off.
- A couple of small things reward a curious click. The system log has a hint.

## Credits and licences

Code, icons and the illustration (a room on the rooftops of Noailles at dusk, looking west over the Vieux-Port, Notre-Dame de la Garde, the Frioul, the MuCEM, La Major and the CMA CGM tower): © Tiéphen Chauvin. Fonts from Google Fonts under the SIL Open Font License 1.1: Pixelify Sans, IBM Plex Sans JP, IBM Plex Mono.
