/**
 * The night room — an original pixel-art wallpaper drawn on a low-resolution
 * canvas and scaled up by whole numbers so every pixel stays crisp.
 *
 * Static parts (wall, window frame, skyline, desk, monitor, lamp, glows) are
 * painted once into an offscreen buffer. Each frame only adds what moves:
 * rain on the glass, a few city windows, the beacon, the cursor, the steam.
 * Runs at ~12 fps, stops when the tab is hidden, and draws a single still
 * frame when ambient animation or motion is turned off.
 */

const C = {
  wall: "#171A20",
  wallDark: "#121419",
  wallDot: "#1A1E24",
  outline: "#0E1014",
  frame: "#2A313B",
  frameLight: "#3A434F",
  sky: ["#0C1016", "#10151D", "#141B25", "#19222E", "#1E2935"],
  far: "#161C25",
  near: "#0F1318",
  haze: "#1C2632",
  rain: "#2F3E47",
  rainLight: "#46575F",
  streak: "#1E2833",
  deskTop: "#2C333D",
  deskEdge: "#3A434F",
  deskFront: "#1A1E24",
  deskFrontDark: "#14171C",
  body: "#2A3039",
  bodyLight: "#363E49",
  screen: "#111919",
  screenGlow: "#172223",
  screenIcon: "#4E6267",
  screenWin: "#33444A",
  amber: "#C49B70",
  amberDim: "#7D6248",
  amberDeep: "#8A6A4B",
  amberLight: "#A98560",
  bulb: "#F2DDBA",
  teal: "#78949A",
  tealDim: "#4E6267",
  pot: "#5E4A38",
  leaf: "#465A4A",
  leafLight: "#5C7260",
  mug: "#A8B4B9",
  mugShade: "#7C878D",
  steam: "#5A646B",
  book1: "#3A434F",
  book2: "#4E6267",
  book3: "#6B5640",
  paper: "#9C8D77",
  pages: "#8E989D",
};

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16));

const bayer = (x, y) => BAYER[y & 3][x & 3];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function createScene(canvas, { lamp = true } = {}) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const buffer = document.createElement("canvas");
  const bctx = buffer.getContext("2d", { alpha: false, willReadFrequently: true });

  let W = 0;
  let H = 0;
  let PX = 4;
  let L = null;
  let lampOn = lamp;
  let ambient = true;
  let paused = false;
  let raf = 0;
  let lastFrame = 0;
  let drops = [];
  let lights = [];
  let beacon = null;
  let steam = [];
  let resizeTimer = 0;

  /* ----------------------------------------------------------------- layout */

  function measure() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    PX = Math.max(3, Math.round(Math.min(vh, vw * 0.9) / 120));
    W = Math.ceil(vw / PX);
    H = Math.ceil(vh / PX);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = W * PX + "px";
    canvas.style.height = H * PX + "px";
    buffer.width = W;
    buffer.height = H;

    const portrait = H > W * 1.05;
    const r = Math.round;
    L = portrait
      ? {
          portrait,
          deskY: r(H * 0.83),
          win: { x0: r(W * 0.12), x1: r(W * 0.88), y0: r(H * 0.47), y1: r(H * 0.71) },
          lampX: r(W * 0.86),
          monX: r(W * 0.44),
          monW: 26,
          monH: 19,
          booksX: r(W * 0.06),
          mugX: r(W * 0.68),
        }
      : {
          portrait,
          deskY: r(H * 0.8),
          win: { x0: r(W * 0.47), x1: r(W * 0.83), y0: r(H * 0.1), y1: r(H * 0.58) },
          lampX: r(W * 0.885),
          monX: r(W * 0.655),
          monW: 32,
          monH: 23,
          booksX: r(W * 0.475),
          mugX: r(W * 0.775),
        };
  }

  /* ----------------------------------------------------------- static paint */

  const fill = (c, x, y, w, h) => {
    bctx.fillStyle = c;
    bctx.fillRect(x, y, w, h);
  };

  function paintStatic() {
    const { win, deskY } = L;
    const rand = rng(1701);

    // Wall, with a darker ceiling dithered in and a faint dotted wallpaper.
    fill(C.wall, 0, 0, W, H);
    const ceil = Math.round(H * 0.4);
    for (let y = 0; y < ceil; y++) {
      const k = 1 - y / ceil;
      for (let x = 0; x < W; x++) {
        if (k * 0.85 > bayer(x, y)) fill(C.wallDark, x, y, 1, 1);
      }
    }
    for (let y = 3; y < deskY; y += 6) {
      for (let x = (y / 6) % 2 ? 3 : 0; x < W; x += 6) fill(C.wallDot, x, y, 1, 1);
    }

    // Window: outline, frame, sky.
    fill(C.outline, win.x0 - 3, win.y0 - 3, win.x1 - win.x0 + 6, win.y1 - win.y0 + 6);
    fill(C.frame, win.x0 - 2, win.y0 - 2, win.x1 - win.x0 + 4, win.y1 - win.y0 + 4);
    fill(C.frameLight, win.x0 - 2, win.y0 - 2, win.x1 - win.x0 + 4, 1);
    const gh = win.y1 - win.y0;
    for (let y = win.y0; y < win.y1; y++) {
      const t = ((y - win.y0) / gh) * (C.sky.length - 1);
      for (let x = win.x0; x < win.x1; x++) {
        const i = Math.min(C.sky.length - 1, Math.floor(t + bayer(x, y) - 0.5 + 0.5));
        fill(C.sky[Math.max(0, i)], x, y, 1, 1);
      }
    }

    // A few stars between the clouds.
    for (let i = 0; i < (win.x1 - win.x0) / 6; i++) {
      const x = win.x0 + Math.floor(rand() * (win.x1 - win.x0));
      const y = win.y0 + Math.floor(rand() * gh * 0.35);
      fill(rand() > 0.7 ? "#4A5560" : "#2C3540", x, y, 1, 1);
    }

    // Skyline: a far layer and a near layer of buildings.
    const ground = win.y1;
    lights = [];
    let tallest = { x: 0, y: ground };
    const skyline = (color, minH, maxH, minW, maxW, withLights) => {
      let x = win.x0 - Math.floor(rand() * 4);
      while (x < win.x1) {
        const bw = minW + Math.floor(rand() * (maxW - minW));
        const bh = Math.floor(gh * (minH + rand() * (maxH - minH)));
        const top = ground - bh;
        const x0 = Math.max(x, win.x0);
        const x1 = Math.min(x + bw, win.x1);
        if (x1 > x0) {
          fill(color, x0, top, x1 - x0, bh);
          if (rand() > 0.6 && x1 - x0 > 3) fill(color, x0 + 1, top - 2, Math.max(1, (x1 - x0) >> 1), 2);
          if (withLights) {
            if (top < tallest.y) tallest = { x: Math.floor((x0 + x1) / 2), y: top - 3 };
            for (let wy = top + 2; wy < ground - 1; wy += 2) {
              for (let wx = x0 + 1; wx < x1 - 1; wx += 2) {
                const p = rand();
                if (p < 0.11) {
                  const tone = rand();
                  lights.push({
                    x: wx,
                    y: wy,
                    c: tone < 0.62 ? C.amberDim : tone < 0.9 ? C.tealDim : C.amber,
                    on: rand() > 0.12,
                  });
                }
              }
            }
          }
        }
        x += bw + (withLights ? 0 : Math.floor(rand() * 3));
      }
    };
    skyline(C.far, 0.35, 0.7, 4, 10, false);
    // Low haze over the far city.
    for (let y = ground - Math.floor(gh * 0.3); y < ground; y++) {
      const k = (y - (ground - gh * 0.3)) / (gh * 0.3);
      for (let x = win.x0; x < win.x1; x++) if (k * 0.5 > bayer(x, y)) fill(C.haze, x, y, 1, 1);
    }
    skyline(C.near, 0.18, 0.48, 5, 13, true);
    fill(C.near, tallest.x, tallest.y, 1, 3);
    beacon = { x: tallest.x, y: tallest.y - 1 };

    // Old raindrops drying on the glass.
    for (let i = 0; i < (win.x1 - win.x0) / 9; i++) {
      const x = win.x0 + 1 + Math.floor(rand() * (win.x1 - win.x0 - 2));
      const y = win.y0 + Math.floor(rand() * gh * 0.8);
      const len = 2 + Math.floor(rand() * 6);
      fill(C.streak, x, y, 1, Math.min(len, win.y1 - y));
    }

    // Mullions and sill.
    const mx = Math.round((win.x0 + win.x1) / 2);
    const my = win.y0 + Math.round(gh * 0.42);
    fill(C.frame, mx - 1, win.y0, 2, gh);
    fill(C.frame, win.x0, my, win.x1 - win.x0, 2);
    fill(C.frameLight, mx - 1, win.y0, 1, gh);
    fill(C.outline, win.x0 - 5, win.y1 + 2, win.x1 - win.x0 + 10, 4);
    fill(C.deskTop, win.x0 - 4, win.y1 + 2, win.x1 - win.x0 + 8, 2);
    fill(C.frameLight, win.x0 - 4, win.y1 + 2, win.x1 - win.x0 + 8, 1);

    // A small plant on the sill.
    const px = win.x1 - 9;
    const py = win.y1 + 2;
    fill(C.outline, px - 1, py - 5, 7, 5);
    fill(C.pot, px, py - 4, 5, 4);
    fill(C.amberDeep, px, py - 4, 5, 1);
    const leaves = [[1, -6], [2, -7], [3, -6], [0, -8], [2, -9], [4, -8], [5, -7], [-1, -7], [3, -10]];
    leaves.forEach(([lx, ly], i) => fill(i % 3 ? C.leaf : C.leafLight, px + lx, py + ly, 1 + (i % 2), 1));
    fill(C.leaf, px + 2, py - 6, 1, 2);

    // Desk.
    fill(C.outline, 0, deskY - 1, W, 1);
    fill(C.deskEdge, 0, deskY, W, 1);
    fill(C.deskTop, 0, deskY + 1, W, 2);
    fill(C.outline, 0, deskY + 3, W, 1);
    fill(C.deskFront, 0, deskY + 4, W, H - deskY - 4);
    for (let y = deskY + 4; y < H; y++) {
      const k = (y - deskY - 4) / Math.max(1, H - deskY - 4);
      for (let x = 0; x < W; x++) if (k * 0.9 > bayer(x, y)) fill(C.deskFrontDark, x, y, 1, 1);
    }

    paintMonitor();
    paintBooks();
    paintMug();
    paintLamp();

    // Glows are blended per pixel with an ordered dither.
    const img = bctx.getImageData(0, 0, W, H);
    const m = monitorBox();
    glow(img, m.x + m.w / 2, m.y + m.h / 2, m.w * 1.25, C.teal, 0.1, 0.55);
    if (lampOn) {
      const s = shadeBox();
      glow(img, s.cx, s.cy + 2, 26, C.amber, 0.09, 0.75);
      cone(img, s.cx, s.cy + 3, deskY + 3, 18, C.amber, 0.16);
    }
    bctx.putImageData(img, 0, 0);
  }

  function glow(img, cx, cy, r, color, strength, cutoff) {
    const [cr, cg, cb] = hex(color);
    const d = img.data;
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(W, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(H, Math.ceil(cy + r));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const dist = Math.hypot(x - cx, (y - cy) * 1.15) / r;
        if (dist >= 1) continue;
        const k = Math.pow(1 - dist, 1.6);
        if (k * cutoff < bayer(x, y) * 0.9) continue;
        const a = strength * (0.55 + 0.45 * k);
        const i = (y * W + x) * 4;
        d[i] += (cr - d[i]) * a;
        d[i + 1] += (cg - d[i + 1]) * a;
        d[i + 2] += (cb - d[i + 2]) * a;
      }
    }
  }

  function cone(img, cx, top, bottom, spread, color, strength) {
    const [cr, cg, cb] = hex(color);
    const d = img.data;
    for (let y = top; y <= Math.min(bottom, H - 1); y++) {
      const t = (y - top) / Math.max(1, bottom - top);
      const half = 2 + spread * t;
      for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
        if (x < 0 || x >= W) continue;
        const edge = 1 - Math.abs(x - cx) / half;
        const k = edge * (1 - t * 0.45);
        if (k < bayer(x, y) * 0.85) continue;
        const onDesk = y >= bottom - 2;
        const a = strength * (onDesk ? 1.6 : 1) * (0.5 + 0.5 * k);
        const i = (y * W + x) * 4;
        d[i] += (cr - d[i]) * a;
        d[i + 1] += (cg - d[i + 1]) * a;
        d[i + 2] += (cb - d[i + 2]) * a;
      }
    }
  }

  function monitorBox() {
    const w = L.monW;
    const h = L.monH;
    return { x: L.monX - Math.floor(w / 2), y: L.deskY - h - 3, w, h };
  }

  function paintMonitor() {
    const { x, y, w, h } = monitorBox();
    // Cable behind the desk.
    fill(C.outline, x + w - 4, y + h, 1, 3);
    fill(C.outline, x - 1, y - 1, w + 2, h + 2);
    fill(C.body, x, y, w, h);
    fill(C.bodyLight, x, y, w, 1);
    fill(C.bodyLight, x, y, 1, h);
    // Screen.
    const sx = x + 3;
    const sy = y + 3;
    const sw = w - 6;
    const sh = h - 7;
    fill(C.outline, sx - 1, sy - 1, sw + 2, sh + 2);
    fill(C.screen, sx, sy, sw, sh);
    for (let yy = sy; yy < sy + sh; yy++) {
      for (let xx = sx; xx < sx + sw; xx++) {
        const k = 1 - Math.hypot((xx - sx - sw / 2) / sw, (yy - sy - sh / 2) / sh) * 1.6;
        if (k > bayer(xx, yy)) fill(C.screenGlow, xx, yy, 1, 1);
      }
    }
    // A tiny version of this very desktop.
    for (let i = 0; i < 3; i++) fill(C.screenIcon, sx + 2, sy + 2 + i * 3, 2, 2);
    fill(C.screenWin, sx + Math.floor(sw * 0.45), sy + 3, Math.floor(sw * 0.42), Math.floor(sh * 0.55));
    fill(C.screen, sx + Math.floor(sw * 0.45) + 1, sy + 5, Math.floor(sw * 0.42) - 2, Math.floor(sh * 0.55) - 3);
    fill(C.screenWin, sx, sy + sh - 2, sw, 2);
    // Power light and stand.
    fill(C.tealDim, x + w - 4, y + h - 3, 2, 1);
    fill(C.outline, L.monX - 3, y + h, 6, 3);
    fill(C.body, L.monX - 2, y + h, 4, 2);
    fill(C.outline, L.monX - 6, L.deskY - 1, 12, 1);
    fill(C.bodyLight, L.monX - 5, L.deskY - 1, 10, 1);
    // A note pinned to the wall beside it.
    fill(C.outline, x - 8, y + 1, 6, 6);
    fill(C.paper, x - 7, y + 2, 4, 4);
    fill(C.amberDeep, x - 6, y + 2, 1, 1);
  }

  function paintBooks() {
    const x = L.booksX;
    const y = L.deskY;
    const stack = [
      [16, C.book1],
      [13, C.book3],
      [15, C.book2],
    ];
    stack.forEach(([w, c], i) => {
      const by = y - 3 * (i + 1);
      const bx = x + (i === 1 ? 2 : i === 2 ? 1 : 0);
      fill(C.outline, bx - 1, by - 1, w + 2, 4);
      fill(c, bx, by, w, 2);
      fill(C.pages, bx + w - 2, by, 2, 2);
    });
  }

  function paintMug() {
    const x = L.mugX;
    const y = L.deskY - 5;
    fill(C.outline, x - 1, y - 1, 6, 6);
    fill(C.mug, x, y, 4, 4);
    fill(C.mugShade, x + 3, y, 1, 4);
    fill(C.amberDeep, x, y, 4, 1);
    fill(C.outline, x + 5, y + 1, 2, 3);
    fill(C.mugShade, x + 4, y + 1, 1, 1);
    fill(C.mugShade, x + 5, y + 2, 1, 1);
    fill(C.mugShade, x + 4, y + 3, 1, 1);
  }

  function shadeBox() {
    const x = L.lampX;
    return { cx: x - 7, cy: L.deskY - 19, x0: x - 13, x1: x + 4, y0: L.deskY - 26, y1: L.deskY };
  }

  function paintLamp() {
    const x = L.lampX;
    const d = L.deskY;
    // Base.
    fill(C.outline, x - 5, d - 3, 11, 3);
    fill(C.body, x - 4, d - 2, 9, 2);
    fill(C.bodyLight, x - 4, d - 2, 9, 1);
    // Pole and arm.
    fill(C.outline, x - 1, d - 17, 3, 15);
    fill(C.frameLight, x, d - 17, 1, 15);
    for (let i = 0; i < 6; i++) {
      fill(C.outline, x - i - 1, d - 18 - i, 3, 2);
      fill(C.frameLight, x - i, d - 18 - i, 1, 1);
    }
    // Shade, tilted toward the desk.
    const cx = x - 7;
    const top = d - 24;
    const rows = [3, 5, 7, 9, 11];
    rows.forEach((w, i) => {
      const y = top + i;
      fill(C.outline, cx - Math.ceil(w / 2) - 1, y, w + 2, 1);
      fill(i === 0 ? C.amberLight : C.amberDeep, cx - Math.ceil(w / 2), y, w, 1);
      fill(C.amberLight, cx - Math.ceil(w / 2), y, 1, 1);
    });
    fill(C.outline, cx - 7, top + 5, 14, 1);
    fill(lampOn ? C.bulb : C.frame, cx - 3, top + 5, 6, 1);
  }

  /* ---------------------------------------------------------------- dynamic */

  function seedDynamic() {
    const { win } = L;
    const area = (win.x1 - win.x0) * (win.y1 - win.y0);
    const rand = rng(Date.now() & 0xffff);
    drops = Array.from({ length: Math.round(area / 150) }, () => ({
      x: win.x0 + rand() * (win.x1 - win.x0 + 10),
      y: win.y0 + rand() * (win.y1 - win.y0),
      len: 2 + Math.floor(rand() * 3),
      v: 1.6 + rand() * 1.4,
      light: rand() > 0.82,
    }));
    steam = [];
  }

  function frame(now) {
    ctx.drawImage(buffer, 0, 0);
    const { win } = L;
    const t = now / 1000;

    // City windows.
    for (const l of lights) if (l.on) {
      ctx.fillStyle = l.c;
      ctx.fillRect(l.x, l.y, 1, 1);
    }
    // Aircraft-warning light on the tallest roof.
    if (beacon && (t % 2.4 < 1.2 || !ambient)) {
      ctx.fillStyle = C.amber;
      ctx.fillRect(beacon.x, beacon.y, 1, 1);
    }

    // Rain on the glass.
    for (const p of drops) {
      ctx.fillStyle = p.light ? C.rainLight : C.rain;
      const x0 = Math.floor(p.x);
      const y0 = Math.floor(p.y);
      for (let i = 0; i < p.len; i++) {
        const xx = x0 - Math.floor((y0 + i) / 4) + Math.floor(y0 / 4);
        const yy = y0 + i;
        if (xx >= win.x0 && xx < win.x1 && yy >= win.y0 && yy < win.y1) ctx.fillRect(xx, yy, 1, 1);
      }
    }

    // Cursor on the tiny monitor.
    const m = monitorBox();
    const sw = m.w - 6;
    if (t % 1.1 < 0.6 || !ambient) {
      ctx.fillStyle = C.amber;
      ctx.fillRect(m.x + 3 + Math.floor(sw * 0.45) + 2, m.y + 3 + 3, 1, 1);
    }

    // Steam from the mug, now and then.
    for (const s of steam) {
      ctx.fillStyle = C.steam;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
    }
  }

  function step(dt) {
    const { win } = L;
    for (const p of drops) {
      p.y += p.v * dt * 12;
      if (p.y > win.y1) {
        p.y = win.y0 - p.len - Math.random() * 6;
        p.x = win.x0 + Math.random() * (win.x1 - win.x0 + 10);
      }
    }
    if (Math.random() < 0.004 * dt * 12 && lights.length) {
      const l = lights[Math.floor(Math.random() * lights.length)];
      l.on = !l.on;
    }
    if (Math.random() < 0.05 * dt * 12 && steam.length < 4) {
      steam.push({ x: L.mugX + 1 + Math.random() * 2, y: L.deskY - 7, life: 1 });
    }
    steam = steam.filter((s) => {
      s.y -= dt * 3;
      s.x += Math.sin(s.y) * dt * 1.5;
      s.life -= dt * 0.45;
      return s.life > 0;
    });
  }

  function loop(now) {
    raf = 0;
    if (!running()) return;
    const dt = Math.min(0.25, (now - lastFrame) / 1000);
    if (now - lastFrame >= 1000 / 12) {
      step(dt);
      frame(now);
      lastFrame = now;
    }
    raf = requestAnimationFrame(loop);
  }

  const running = () => ambient && !paused && !document.hidden;

  function kick() {
    if (running()) {
      if (!raf) {
        lastFrame = performance.now();
        raf = requestAnimationFrame(loop);
      }
    } else {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      frame(performance.now());
    }
  }

  function rebuild() {
    measure();
    paintStatic();
    seedDynamic();
    frame(performance.now());
    kick();
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, 120);
  }

  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", kick);
  rebuild();

  return {
    setAmbient(on) {
      ambient = Boolean(on);
      kick();
    },
    setPaused(on) {
      paused = Boolean(on);
      kick();
    },
    setLamp(on) {
      lampOn = Boolean(on);
      paintStatic();
      frame(performance.now());
    },
    /** True when the viewport point falls on the desk lamp. */
    hitsLamp(clientX, clientY) {
      if (!L) return false;
      const x = Math.floor(clientX / PX);
      const y = Math.floor(clientY / PX);
      const s = shadeBox();
      return x >= s.x0 && x <= s.x1 && y >= s.y0 && y <= s.y1;
    },
  };
}
