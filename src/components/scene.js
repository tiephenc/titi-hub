/**
 * The night room — a bedroom-studio on the rooftops of Noailles, looking
 * west over Marseille just after sunset, when the sky turns violet.
 *
 * Through the window, from left to right: Notre-Dame de la Garde floodlit
 * on its hill, Fort Saint-Nicolas, the Vieux-Port full of masts, the harbour
 * mouth with the sun gone down behind the Frioul and the Château d'If,
 * Fort Saint-Jean and the MuCEM's concrete lace, La Major's striped domes
 * and the CMA CGM tower. In front: canal-tile roofs, antennas, laundry,
 * string lights, and the neon of a slightly cyberpunk city.
 *
 * Everything is original pixel art drawn in code into a low-resolution
 * buffer, then scaled up by a whole number so pixels stay crisp. The static
 * picture is painted once per resize; each frame only adds what moves.
 */

/* ============================================================== palette */

const SKY = [
  "#120F28", "#171331", "#1D163B", "#251A45", "#2F1E50", "#3B2259",
  "#49275F", "#592C66", "#6B326B", "#7E386F", "#934072", "#A84B73",
  "#BD5872", "#CF686E", "#DE7C69", "#E99264", "#F2A862",
];

const C = {
  star: "#C9C0F0",
  starDim: "#6E64A0",
  cloudDark: "#2E1F4A",
  cloud: "#40295B",
  cloudLit: "#B3577C",
  cloudHot: "#E8857C",
  cloudEdge: "#F4B08A",
  sun: "#FFE2A8",
  sunEdge: "#FFB97E",
  seaFar: "#5C3466",
  sea: "#3A2552",
  seaDeep: "#261A3D",
  glint: "#F6B486",
  glintPink: "#E07A90",
  hillFar: "#4A2D5E",
  island: "#3A2450",
  islandLit: "#6A3F6E",
  hill: "#261A3B",
  hillLit: "#3A2650",
  tree: "#1D1830",
  house: "#30224A",
  cityBack: "#2C2046",
  city: "#221A38",
  cityFront: "#1A1530",
  cityEdge: "#4A3463",
  win1: "#F2C46D",
  win2: "#E39A55",
  win3: "#FFE6A8",
  winCyan: "#6FE3E8",
  winPink: "#FF6FAE",
  stone: "#E6B57C",
  stoneMid: "#C48A58",
  stoneDark: "#8A5A40",
  stoneDeep: "#5A3A36",
  gold: "#FFD76A",
  goldHot: "#FFF3C4",
  fort: "#5C3E58",
  fortLit: "#8A5E6A",
  fortDark: "#3A2742",
  mucem: "#3E3150",
  mucemLace: "#241C34",
  mucemGlow: "#E8A060",
  major1: "#9B7C80",
  major2: "#5E5470",
  majorDark: "#3A2E4A",
  tower: "#2C2A52",
  towerLit: "#46407A",
  towerEdge: "#6A63A8",
  neonCyan: "#4FEAF2",
  neonPink: "#FF4FA0",
  neonRed: "#FF3B4E",
  water: "#2E1F48",
  waterLit: "#5B3A6A",
  hull: "#15102A",
  hullLit: "#C9B8D8",
  mast: "#6A5A84",
  roofDark: "#3A2229",
  tile1: "#6E3B3C",
  tile2: "#7E4743",
  tileGap: "#4A2830",
  tileLit: "#A8645A",
  tileRidge: "#B9765F",
  wallFront: "#1E1630",
  wallFrontLit: "#3A2848",
  shutter: "#3E5A66",
  shutterLit: "#5A7F88",
  chimney: "#4A2E36",
  chimneyCap: "#6A4248",
  antenna: "#3A3550",
  cable: "#0E0B18",
  laundry1: "#C9B8D8",
  laundry2: "#E07A90",
  laundry3: "#6FB7C4",
  bulb: "#FFD58A",

  // Room
  wall: "#1A1829",
  wallDark: "#131221",
  ceiling: "#100F1C",
  frame: "#0E0C18",
  frameIn: "#262238",
  frameLit: "#4A3D66",
  sill: "#2C2740",
  sillLit: "#6A5288",
  blind: "#2E2A44",
  blindLit: "#5A4A7A",
  desk: "#2A2236",
  deskLit: "#54456E",
  deskFront: "#1C1828",
  deskDark: "#141220",
  metal: "#2E3446",
  metalLit: "#4A5470",
  outline: "#0A0912",
  screenLit: "#3FB8C8",
  screenHi: "#9BEFF5",
  keys: "#3A3A52",
  keysLit: "#5A5A7A",
  mug: "#C9C3D8",
  mugShade: "#8A84A0",
  coffee: "#4A2E22",
  lampBody: "#2A2838",
  lampShade: "#C4874E",
  lampShadeLit: "#E8B070",
  bulbHot: "#FFF0C8",
  book1: "#4E3A5E",
  book2: "#2E4A5A",
  book3: "#6A3A44",
  book4: "#7A6A4A",
  book5: "#3A5A4A",
  pages: "#B8AFC8",
  leaf: "#1F4A42",
  leafLit: "#3A7A66",
  leafDark: "#143029",
  pot: "#6A4A3E",
  potLit: "#9A6A52",
  pcCase: "#1E1C2E",
  pcGlass: "#2A2840",
  fan: "#FF4FA0",
  fanDim: "#8A2A60",
  catBody: "#0E0A16",
  catRim: "#7A4A8A",
  headphones: "#2A2838",
  led: "#FF4F7A",
  steam: "#8A84A8",
};

/* ===================================================== tiny utilities */

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((r) => r.map((v) => (v + 0.5) / 16));
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

const rgbCache = new Map();
function rgb(hex) {
  let v = rgbCache.get(hex);
  if (!v) {
    const n = parseInt(hex.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    rgbCache.set(hex, v);
  }
  return v;
}

/** A painter working directly on a pixel buffer. */
function makePainter(W, H) {
  const img = new ImageData(W, H);
  const d = new Uint32Array(img.data.buffer);
  const packed = new Map();
  let clip = null;
  const pack = (hex) => {
    let v = packed.get(hex);
    if (v === undefined) {
      const [r, g, b] = rgb(hex);
      v = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
      packed.set(hex, v);
    }
    return v;
  };
  const inside = (x, y) =>
    x >= 0 && y >= 0 && x < W && y < H && (!clip || (x >= clip.x0 && x < clip.x1 && y >= clip.y0 && y < clip.y1));

  const occ = new Uint8Array(W * H);
  const P = {
    W,
    H,
    img,
    occ,
    occluding: false,
    setClip(c) {
      clip = c;
    },
    px(x, y, c) {
      x |= 0;
      y |= 0;
      if (inside(x, y)) {
        d[y * W + x] = pack(c);
        if (P.occluding) occ[y * W + x] = 0;
      }
    },
    rect(x, y, w, h, c) {
      for (let j = y | 0; j < y + h; j++) for (let i = x | 0; i < x + w; i++) P.px(i, j, c);
    },
    hline(x0, x1, y, c) {
      for (let i = Math.min(x0, x1); i <= Math.max(x0, x1); i++) P.px(i, y, c);
    },
    vline(x, y0, y1, c) {
      for (let j = Math.min(y0, y1); j <= Math.max(y0, y1); j++) P.px(x, j, c);
    },
    line(x0, y0, x1, y1, c) {
      x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
      const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
      const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        P.px(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    },
    /** Filled polygon, scanline even-odd. */
    poly(pts, c) {
      const ys = pts.map((p) => p[1]);
      const y0 = Math.floor(Math.min(...ys));
      const y1 = Math.ceil(Math.max(...ys));
      for (let y = y0; y <= y1; y++) {
        const xs = [];
        for (let i = 0; i < pts.length; i++) {
          const [ax, ay] = pts[i];
          const [bx, by] = pts[(i + 1) % pts.length];
          if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) {
            xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
          }
        }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) {
          for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) P.px(x, y, c);
        }
      }
    },
    blend(x, y, hex, a) {
      x |= 0;
      y |= 0;
      if (!inside(x, y) || a <= 0) return;
      const i = y * W + x;
      const v = d[i];
      const [cr, cg, cb] = rgb(hex);
      const r = v & 255, g = (v >> 8) & 255, b = (v >> 16) & 255;
      const k = Math.min(1, a);
      d[i] = ((255 << 24) | (Math.round(b + (cb - b) * k) << 16) | (Math.round(g + (cg - g) * k) << 8) | Math.round(r + (cr - r) * k)) >>> 0;
    },
    /** Soft light, quantised with an ordered dither so it stays pixel-art. */
    glow(cx, cy, r, hex, strength, { ry = r, steps = 3 } = {}) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
          const dist = Math.hypot((x - cx) / r, (y - cy) / ry);
          if (dist >= 1) continue;
          const k = Math.pow(1 - dist, 1.5);
          const q = Math.floor(k * steps + bayer(x, y)) / steps;
          if (q > 0) P.blend(x, y, hex, q * strength);
        }
      }
    },
    /** Dithered vertical gradient through a list of colours. */
    vgrad(x, y, w, h, stops, warp) {
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          let t = j / Math.max(1, h - 1);
          if (warp) t = warp(t, x + i, y + j);
          const f = Math.max(0, Math.min(stops.length - 1.001, t * (stops.length - 1)));
          const k = Math.floor(f);
          P.px(x + i, y + j, f - k > bayer(x + i, y + j) ? stops[k + 1] : stops[k]);
        }
      }
    },
    /** Sprite from strings; map is char → colour, "." is transparent. */
    spr(rows, map, x, y) {
      rows.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) {
          const ch = row[i];
          if (ch !== "." && map[ch]) P.px(x + i, y + j, map[ch]);
        }
      });
    },
  };
  return P;
}

/* ============================================================= sprites */

// Notre-Dame de la Garde: bell tower with the gilded Virgin, nave and domes.
const NDG = [
  "..........G..........",
  ".........GgG.........",
  "..........g..........",
  ".........ggg.........",
  "..........g..........",
  ".........sSs.........",
  "........sSSSs........",
  "........SdSdS........",
  "........SSSSS........",
  "........SdSdS........",
  "........SdSdS........",
  "........SSSSS........",
  "........SSmSS........",
  "........SSmSS........",
  "........SdSdS........",
  "........SSSSS........",
  "...mSSm.SSmSS........",
  "..mSSSSmSSSSS........",
  ".mSSSSSSSSSSSSSSm....",
  ".SSdSSdSSSSSSdSSSSm..",
  "mSSdSSdSSSdSSdSSdSSm.",
  "SSSSSSSSSSSSSSSSSSSSS",
  "SmmSmmSmmSmmSmmSmmSmS",
];

// Château d'If on its rock.
const IF_FORT = [
  "......f......",
  ".....fff.....",
  "..fF.fFf.Ff..",
  "..fFFfFfFFf..",
  ".fffffffffff.",
];

// Fort Saint-Jean: walls and the square Tour du Roi René.
const FORT_JEAN = [
  "......FF.........",
  ".....FFFF........",
  ".....FlFf........",
  ".....FFFf........",
  ".....FlFf...F.F..",
  "..F.FFFFfF.FFFFF.",
  ".FFFFFFFFFFFFFFFf",
  "FFFFFFFFFFFFFFFFf",
];

// La Major: striped domes and towers.
const MAJOR = [
  "..............a...........",
  ".............bab..........",
  "....a.......aaaaa.........",
  "...bab.....bbbbbbb........",
  "..aaaaa...aaaaaaaaa...a...",
  "..bbbbb...bbbbbbbbb..bab..",
  "..aaaaa..aaaaaaaaaaa.aaa..",
  ".ddddddd.ddddddddddd.ddd..",
  ".dwdwdwdddwdwdwdwdwddwdw..",
  "dddddddddddddddddddddddddd",
  "dwdwdwdwdwdwdwdwdwdwdwdwdd",
];

// The cat on the sill, from behind, backlit.
const CAT = [
  ".r....r...",
  ".kr..rk...",
  ".kkkkkk...",
  "rkkkkkkr..",
  ".kkkkkk...",
  "..kkkk....",
  ".rkkkkr...",
  "rkkkkkkr..",
  "kkkkkkkk..",
  "kkkkkkkkr.",
  "kkkkkkkkk.",
];

// 言 — "word", in neon.
const KANJI = [
  "....#....",
  "#########",
  ".........",
  ".#######.",
  ".........",
  ".#######.",
  ".........",
  ".#######.",
  ".#.....#.",
  ".#.....#.",
  ".#######.",
];

const DIGITS = {
  0: ["###", "#.#", "#.#", "#.#", "###"],
  1: [".#.", "##.", ".#.", ".#.", "###"],
  2: ["###", "..#", "###", "#..", "###"],
  3: ["###", "..#", "###", "..#", "###"],
  4: ["#.#", "#.#", "###", "..#", "..#"],
  5: ["###", "#..", "###", "..#", "###"],
  6: ["###", "#..", "###", "#.#", "###"],
  7: ["###", "..#", "..#", ".#.", ".#."],
  8: ["###", "#.#", "###", "#.#", "###"],
  9: ["###", "#.#", "###", "..#", "###"],
};

/* ============================================================== scene */

export function createScene(canvas, { lamp = true, rain = true, blinds = false } = {}) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const buffer = document.createElement("canvas");
  const bctx = buffer.getContext("2d", { alpha: false });

  let W = 0;
  let H = 0;
  let PX = 3;
  let L = null;
  let lampOn = lamp;
  let ambient = true;
  let paused = false;
  let raf = 0;
  let lastFrame = 0;
  let resizeTimer = 0;
  let dyn = null;

  // Interactive state.
  let hits = [];
  let rainOn = rain;
  let blindPos = blinds ? 1 : 0;
  let blindTarget = blindPos;
  let musicOn = false;
  let coffee = 3;
  let fanIdx = 0;
  let catPokeAt = -99;
  let lastT = 0;
  let drops = [];
  let beads = [];
  let fireflies = [];
  let notes = [];
  let lastNote = 0;
  const FAN_COLORS = ["#FF4FA0", "#4FEAF2", "#B27CFF", "#FFB070"];
  const glass = document.createElement("canvas");
  const gctx = glass.getContext("2d");
  const maskCanvas = document.createElement("canvas");
  const hit = (id, x0, y0, x1, y1) => hits.push({ id, x0, y0, x1, y1 });
  const now = () => performance.now() / 1000;

  /* ------------------------------------------------------------ layout */

  function measure() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    PX = Math.max(2, Math.round(Math.min(vh, vw * 1.6) / 270));
    W = Math.ceil(vw / PX);
    H = Math.ceil(vh / PX);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = W * PX + "px";
    canvas.style.height = H * PX + "px";
    buffer.width = W;
    buffer.height = H;
    glass.width = maskCanvas.width = W;
    glass.height = maskCanvas.height = H;

    const portrait = H > W * 1.1;
    const r = Math.round;
    L = portrait
      ? {
          portrait,
          win: { x0: r(W * 0.07), x1: r(W * 0.93), y0: r(H * 0.43), y1: r(H * 0.71) },
          deskY: r(H * 0.79),
          deskX0: -2,
          monX: r(W * 0.42),
          lampX: r(W * 0.84),
          mugX: r(W * 0.53),
          pcX: null,
          turntable: { x: 3, w: 34 },
          hang: null,
          booksX: r(W * 0.6),
          shelf: { x0: r(W * 0.5), x1: r(W * 0.95), y: r(H * 0.37) },
          poster: null,
          kanji: { x: r(W * 0.12), y: r(H * 0.335) },
          plantX: null,
          catX: r(W * 0.74),
        }
      : {
          portrait,
          win: { x0: r(W * 0.34), x1: r(W * 0.95), y0: r(H * 0.07), y1: r(H * 0.6) },
          deskY: r(H * 0.7),
          deskX0: r(W * 0.3),
          monX: r(W * 0.56),
          lampX: r(W * 0.75),
          mugX: r(W * 0.64),
          pcX: r(W * 0.86),
          turntable: { x: r(W * 0.185), w: r(W * 0.108) },
          hang: { x: Math.min(W - 7, r(W * 0.95) + 11) },
          booksX: r(W * 0.33),
          shelf: { x0: r(W * 0.185), x1: r(W * 0.325), y: r(H * 0.3) },
          poster: { x: r(W * 0.2), y: r(H * 0.41) },
          kanji: { x: r(W * 0.285), y: r(H * 0.44) },
          plantX: W - 8,
          catX: r(W * 0.82),
        };
  }

  /* ------------------------------------------------------- static paint */

  function paint() {
    const P = makePainter(W, H);
    hits = [];
    dyn = {
      fairy: [],
      waters: [],
      blind: null,
      mug: null,
      turntable: null,
      hang: null,
      lampBulb: null,
      twinkle: [],
      neon: [],
      beacons: [],
      glints: [],
      gulls: [],
      fans: [],
      bulbs: [],
      steam: [],
      strips: null,
      clock: null,
      cat: null,
      billboard: null,
      screen: null,
      drone: null,
    };
    paintRoomBack(P);
    paintView(P);
    paintWindowFrame(P);
    paintRoomFront(P);
    bctx.putImageData(P.img, 0, 0);
    // Mask: where the glass is visible (rain and blinds are drawn only there).
    const m = new ImageData(W, H);
    for (let i = 0; i < W * H; i++) m.data[i * 4 + 3] = P.occ[i] ? 255 : 0;
    maskCanvas.getContext("2d").putImageData(m, 0, 0);
    seedDynamic();
  }

  function seedDynamic() {
    const { win } = L;
    const vw = win.x1 - win.x0;
    const vh = win.y1 - win.y0;
    drops = Array.from({ length: Math.round((vw * vh) / 120) }, () => ({
      x: win.x0 + Math.random() * (vw + 30),
      y: win.y0 + Math.random() * vh,
      len: 3 + Math.floor(Math.random() * 4),
      v: 80 + Math.random() * 60,
    }));
    beads = Array.from({ length: Math.round(vw / 5) }, () => ({
      x: win.x0 + Math.floor(Math.random() * vw),
      y: win.y0 + 8 + Math.floor(Math.random() * vh * 0.9),
      v: 6 + Math.random() * 14,
      slide: false,
    }));
    fireflies = Array.from({ length: L.portrait ? 14 : 26 }, () => ({
      x: Math.random() * W,
      y: H * 0.08 + Math.random() * H * 0.62,
      a: Math.random() * Math.PI * 2,
      p: Math.random() * Math.PI * 2,
      s: 4 + Math.random() * 5,
    }));
    notes = [];
  }

  /* ---------------------------------------------- the view through glass */

  function paintView(P) {
    const { win } = L;
    const vx = win.x0;
    const vy = win.y0;
    const vw = win.x1 - win.x0;
    const vh = win.y1 - win.y0;
    const rand = rng(4242);
    P.setClip(win);
    const X = (f) => Math.round(vx + vw * f);
    const hy = vy + Math.round(vh * 0.5);
    const sunX = X(0.5);

    // Sky: violet overhead, burning low over the sea where the sun just went.
    P.vgrad(vx, vy, vw, hy - vy, SKY, (t, x) => {
      const near = Math.exp(-Math.pow((x - sunX) / (vw * 0.42), 2));
      return Math.min(1, t * (0.86 + 0.14 * near) + near * Math.pow(t, 3) * 0.12);
    });

    // First stars.
    for (let i = 0; i < vw / 7; i++) {
      const x = vx + Math.floor(rand() * vw);
      const y = vy + Math.floor(rand() * (hy - vy) * 0.32);
      const bright = rand() > 0.75;
      P.px(x, y, bright ? C.star : C.starDim);
      if (bright && rand() > 0.5) dyn.twinkle.push({ x, y, c: C.star, off: C.starDim, p: rand() * 9, rate: 0.6 });
    }
    // A thin crescent moon.
    const mx = X(0.12);
    const my = vy + Math.round(vh * 0.12);
    P.glow(mx, my, 9, "#8C7AC8", 0.25);
    for (let y = -3; y <= 3; y++) {
      for (let x = -3; x <= 3; x++) {
        if (x * x + y * y <= 10 && (x - 1.6) * (x - 1.6) + (y + 0.8) * (y + 0.8) > 8) P.px(mx + x, my + y, "#E9E2FF");
      }
    }

    // Long strata of cloud, lit pink and orange from below.
    const cloud = (cx, cy, len, thick, heat) => {
      for (let row = 0; row < thick; row++) {
        const w = Math.round(len * (1 - Math.abs(row - thick * 0.45) / thick) * (0.8 + rand() * 0.25));
        const off = Math.round((rand() - 0.5) * len * 0.25);
        for (let i = 0; i < w; i++) {
          const x = cx - (w >> 1) + off + i;
          const y = cy + row;
          const bottom = row >= thick - 2;
          const edge = i === 0 || i === w - 1;
          let c = row === 0 ? C.cloudDark : C.cloud;
          if (bottom) c = heat > 0.66 ? C.cloudHot : C.cloudLit;
          if (bottom && row === thick - 1 && heat > 0.8 && !edge) c = C.cloudEdge;
          if (edge && bayer(x, y) > 0.5) continue;
          P.px(x, y, c);
        }
      }
    };
    cloud(X(0.3), vy + Math.round(vh * 0.2), Math.round(vw * 0.32), 4, 0.5);
    cloud(X(0.78), vy + Math.round(vh * 0.14), Math.round(vw * 0.36), 5, 0.45);
    cloud(X(0.62), vy + Math.round(vh * 0.31), Math.round(vw * 0.4), 3, 0.85);
    cloud(X(0.18), vy + Math.round(vh * 0.36), Math.round(vw * 0.22), 2, 0.9);
    cloud(X(0.9), vy + Math.round(vh * 0.4), Math.round(vw * 0.18), 2, 0.95);

    // The last sliver of sun, and its halo.
    P.glow(sunX, hy, Math.round(vw * 0.22), "#FF9A6A", 0.4, { ry: Math.round(vh * 0.14) });
    P.glow(sunX, hy, Math.round(vw * 0.08), "#FFC08A", 0.5, { ry: Math.round(vh * 0.05) });
    P.hline(sunX - 4, sunX + 4, hy - 1, C.sunEdge);
    P.hline(sunX - 3, sunX + 3, hy - 1, C.sun);
    P.hline(sunX - 2, sunX + 2, hy - 2, C.sun);

    // The sea.
    P.vgrad(vx, hy, vw, win.y1 - hy, [C.seaFar, C.sea, C.seaDeep, C.seaDeep]);
    P.hline(vx, win.x1, hy, "#8A4A70");
    for (let y = hy + 1; y < hy + Math.round(vh * 0.2); y++) {
      const depth = (y - hy) / (vh * 0.2);
      const spread = 3 + depth * vw * 0.12;
      for (let k = 0; k < 3; k++) {
        if (rand() > 0.55) continue;
        const w = 1 + Math.floor(rand() * (3 + depth * 6));
        const x = Math.round(sunX + (rand() - 0.5) * 2 * spread);
        const c = rand() > 0.45 ? C.glint : C.glintPink;
        P.hline(x, x + w, y, c);
        if (rand() > 0.6) dyn.glints.push({ x, y, w, p: rand() * 10 });
      }
    }

    // Marseilleveyre far on the left; the islands on the horizon.
    P.poly([[vx - 2, hy + 1], [vx - 2, hy - 9], [X(0.06), hy - 11], [X(0.12), hy - 7], [X(0.2), hy - 5], [X(0.28), hy - 1], [X(0.3), hy + 1]], C.hillFar);
    P.poly([[X(0.3), hy + 1], [X(0.32), hy - 3], [X(0.36), hy - 4], [X(0.4), hy - 2], [X(0.44), hy - 3], [X(0.465), hy + 1]], C.island);
    P.hline(X(0.33), X(0.36), hy - 4, C.islandLit);
    P.hline(X(0.405), X(0.44), hy - 3, C.islandLit);
    const ifX = X(0.57);
    P.poly([[ifX - 6, hy + 1], [ifX - 4, hy - 2], [ifX + 5, hy - 2], [ifX + 8, hy + 1]], C.island);
    P.spr(IF_FORT, { f: C.island, F: C.islandLit }, ifX - 5, hy - 7);
    dyn.beacons.push({ x: ifX + 1, y: hy - 8, c: "#FFE6A8", period: 4, on: 0.3, p: 0 });
    dyn.beacons.push({ x: X(0.7), y: hy - 1, c: "#FFF0C8", period: 5, on: 0.18, p: 2 });

    // Notre-Dame de la Garde on its hill.
    const ndgX = X(0.17);
    const hillTop = hy - Math.round(vh * 0.17);
    const hillW = Math.round(vw * 0.26);
    const hillY = (x) => {
      const k = (x - ndgX) / hillW;
      return Math.round(hillTop + Math.min(1, k * k) * (hy + 12 - hillTop));
    };
    for (let x = vx; x <= X(0.42); x++) {
      const y = hillY(x);
      P.vline(x, y, win.y1, C.hill);
      if (x % 2 === 0) P.px(x, y, C.hillLit);
    }
    for (let x = ndgX - hillW + 4; x < ndgX + hillW - 4; x += 3 + Math.floor(rand() * 3)) {
      if (Math.abs(x - ndgX) < 13) continue;
      const y = hillY(x);
      P.rect(x - 1, y - 2, 3, 2, C.tree);
      P.px(x, y - 3, C.tree);
    }
    for (let i = 0; i < hillW * 1.4; i++) {
      const x = ndgX - hillW + Math.floor(rand() * hillW * 2);
      const y = hillY(x) + 3 + Math.floor(rand() * 14);
      if (Math.abs(x - ndgX) < 11 && y < hillTop + 10) continue;
      P.rect(x, y, 3, 2, C.house);
      if (rand() > 0.55) {
        const c = rand() > 0.85 ? C.winCyan : rand() > 0.5 ? C.win1 : C.win2;
        P.px(x + 1, y, c);
        if (rand() > 0.7) dyn.twinkle.push({ x: x + 1, y, c, off: C.house, p: rand() * 30, rate: 0.03 });
      }
    }
    const bx = ndgX - (NDG[0].length >> 1);
    const by = hillTop - NDG.length + 2;
    P.glow(ndgX, by + 14, 16, "#FFB070", 0.22);
    P.spr(NDG, { G: C.goldHot, g: C.gold, S: C.stone, s: C.stoneMid, m: C.stoneDark, d: C.stoneDeep }, bx, by);
    P.glow(ndgX, by + 2, 5, C.gold, 0.35);

    // Vieux-Port: the basin opening toward the harbour mouth.
    const mouthY = hy + Math.round(vh * 0.08);
    const portY = win.y1;
    P.poly([[X(0.42), mouthY], [X(0.6), mouthY], [X(0.84), portY], [X(0.2), portY]], C.water);
    for (let y = mouthY; y < portY; y++) {
      const t = (y - mouthY) / (portY - mouthY);
      const xl = X(0.42) + (X(0.2) - X(0.42)) * t;
      const xr = X(0.6) + (X(0.84) - X(0.6)) * t;
      for (let x = Math.round(xl); x < xr; x++) if (bayer(x, y) < 0.25 * (1 - t)) P.px(x, y, C.waterLit);
    }

    // Fort Saint-Nicolas on the left of the mouth.
    P.poly([[X(0.32), mouthY + 3], [X(0.35), mouthY - 2], [X(0.42), mouthY - 3], [X(0.44), mouthY + 1], [X(0.44), mouthY + 6], [X(0.32), mouthY + 8]], C.fortDark);
    P.hline(X(0.35), X(0.42), mouthY - 3, C.fort);
    for (let x = X(0.355); x < X(0.42); x += 3) P.px(x, mouthY - 4, C.fortDark);
    P.px(X(0.38), mouthY - 1, C.win2);

    // Fort Saint-Jean, the footbridge and the MuCEM on the right.
    const fjX = X(0.58);
    P.spr(FORT_JEAN, { F: C.fort, f: C.fortDark, l: C.win1 }, fjX, mouthY - 7);
    const mcX = X(0.66);
    const mcS = Math.max(10, Math.round(vw * 0.05));
    P.line(fjX + 16, mouthY - 4, mcX, mouthY - 5, C.fortLit);
    P.rect(mcX, mouthY - mcS + 2, mcS, mcS, C.mucem);
    for (let y = mouthY - mcS + 2; y < mouthY + 2; y++) {
      for (let x = mcX; x < mcX + mcS; x++) if ((x + y) % 3 === 0 || (x - y + 99) % 4 === 0) P.px(x, y, C.mucemLace);
    }
    P.hline(mcX, mcX + mcS - 1, mouthY - mcS + 2, "#5A4A70");
    P.hline(mcX + 1, mcX + mcS - 2, mouthY + 1, C.mucemGlow);
    P.glow(mcX + mcS / 2, mouthY + 1, mcS * 0.8, C.mucemGlow, 0.25, { ry: 3 });

    // Le Panier, La Major, the CMA CGM tower.
    for (let x = X(0.6); x < win.x1; x += 4 + Math.floor(rand() * 5)) {
      const h = 4 + Math.floor(rand() * 7);
      const w = 4 + Math.floor(rand() * 5);
      P.rect(x, mouthY - h + 4, w, h + 30, C.cityBack);
      P.hline(x, x + w - 1, mouthY - h + 4, C.cityEdge);
    }
    P.spr(MAJOR, { a: C.major1, b: C.major2, d: C.majorDark, w: C.win2 }, X(0.72), mouthY - 9);
    const tX = X(0.9);
    const tTop = vy + Math.round(vh * 0.13);
    const tBase = mouthY + 2;
    for (let y = tTop; y < tBase; y++) {
      const t = (y - tTop) / (tBase - tTop);
      const half = Math.round(2 + 3 * Math.sin(Math.min(1, t * 1.4) * Math.PI * 0.5));
      const lean = Math.round(Math.sin(t * Math.PI) * 2);
      P.hline(tX - half + lean, tX + half + lean, y, C.tower);
      P.px(tX - half + lean, y, C.towerEdge);
      if (y % 3 === 0) P.hline(tX - half + 1 + lean, tX + half - 1 + lean, y, C.towerLit);
    }
    dyn.strips = { x: tX, top: tTop, base: tBase };
    dyn.beacons.push({ x: tX, y: tTop - 1, c: C.neonRed, period: 1.6, on: 0.5, p: 0 });
    const nH = Math.round((tBase - tTop) * 0.45);
    P.rect(tX + 7, tBase - nH, 6, nH, C.tower);
    for (let y = tBase - nH + 1; y < tBase; y += 2) {
      for (let x = tX + 8; x < tX + 12; x += 2) if (rand() > 0.4) P.px(x, y, rand() > 0.6 ? C.winCyan : C.win1);
    }

    // The quays: façades full of windows.
    const quay = (x0, x1, base) => {
      let x = x0;
      while (x < x1) {
        const w = 6 + Math.floor(rand() * 9);
        const top = base - 10 - Math.floor(rand() * 14);
        P.rect(x, top, w, win.y1 - top, C.city);
        P.hline(x, x + w - 1, top, C.cityEdge);
        P.vline(x + w - 1, top, win.y1, C.cityFront);
        for (let y = top + 2; y < win.y1; y += 3) {
          for (let xx = x + 1; xx < x + w - 2; xx += 2) {
            const p = rand();
            if (p < 0.3) {
              const c = p < 0.03 ? C.winPink : p < 0.07 ? C.winCyan : p < 0.22 ? C.win1 : C.win2;
              P.px(xx, y, c);
              if (rand() > 0.9) dyn.twinkle.push({ x: xx, y, c, off: C.city, p: rand() * 40, rate: 0.025 });
            }
          }
        }
        x += w;
      }
    };
    quay(vx - 3, X(0.27), mouthY + Math.round(vh * 0.2));
    quay(X(0.76), win.x1 + 3, mouthY + Math.round(vh * 0.2));

    // Boats: rows of hulls and a forest of masts.
    for (let row = 0; row < 4; row++) {
      const t = 0.18 + row * 0.2;
      const y = Math.round(mouthY + (portY - mouthY) * t);
      const xl = Math.round(X(0.42) + (X(0.2) - X(0.42)) * t) + 2;
      const xr = Math.round(X(0.6) + (X(0.84) - X(0.6)) * t) - 2;
      P.hline(xl, xr, y + 1, C.cityFront);
      for (let x = xl; x < xr; x += 3 + Math.floor(rand() * 3)) {
        const hw = 2 + Math.floor(rand() * 2);
        P.hline(x, x + hw, y, C.hull);
        P.px(x + hw, y - 1, C.hullLit);
        const mh = 4 + Math.floor(rand() * (4 + row * 3));
        P.vline(x + 1, y - mh, y - 1, C.mast);
        if (rand() > 0.75) dyn.twinkle.push({ x: x + 1, y: y - mh - 1, c: rand() > 0.5 ? "#FFFFFF" : C.neonRed, off: null, p: rand() * 20, rate: 0.4 });
        if (rand() > 0.6) P.px(x + 1, y + 2, C.waterLit);
      }
    }

    paintRooftops(P, rand, { vx, X, vh });

    for (let i = 0; i < 3; i++) dyn.gulls.push({ x: X(0.2 + rand() * 0.6), y: vy + Math.round(vh * (0.24 + rand() * 0.14)), v: 1.2 + rand(), p: rand() * 6 });
    dyn.drone = { y: vy + Math.round(vh * 0.27), t: rand() * 50 };
    P.setClip(null);
  }

  function paintRooftops(P, rand, { vx, X, vh }) {
    const { win } = L;
    const base = win.y0 + Math.round(vh * 0.8);
    const masts = [];
    let neonDone = 0;
    let rx = vx - Math.floor(rand() * 10);
    while (rx < win.x1) {
      const w = 22 + Math.floor(rand() * 18);
      const eave = base + Math.floor(rand() * 8);
      const ridge = eave - 5 - Math.floor(rand() * 4);
      // Façade with shutters.
      P.rect(rx, eave + 1, w, win.y1 - eave + 2, C.wallFront);
      P.vline(rx, eave + 1, win.y1, C.wallFrontLit);
      const step = 7 + Math.floor(rand() * 3);
      for (let wy = eave + 4; wy < win.y1 - 3; wy += 9) {
        for (let wx = rx + 3 + Math.floor(rand() * 2); wx < rx + w - 5; wx += step) {
          const lit = rand() < 0.24;
          P.rect(wx, wy, 3, 5, lit ? C.win1 : C.cable);
          if (lit) {
            P.hline(wx, wx + 2, wy, C.win3);
            P.glow(wx + 1, wy + 2, 5, C.win2, 0.12);
          }
          P.vline(wx - 1, wy, wy + 4, lit ? C.shutterLit : C.shutter);
          P.vline(wx + 3, wy, wy + 4, lit ? C.shutterLit : C.shutter);
          if (rand() > 0.7) P.hline(wx - 2, wx + 4, wy + 5, C.antenna);
        }
      }
      // Canal tiles, ridge to eave.
      for (let y = ridge; y <= eave; y++) {
        const inset = Math.round((eave - y) * 1.6);
        const x0 = rx + inset;
        const x1 = rx + w - inset;
        for (let x = x0; x < x1; x++) {
          let c = (y - ridge) % 2 ? C.tile1 : C.tile2;
          if ((x + ((y - ridge) >> 1)) % 3 === 0) c = C.tileGap;
          if (y === ridge) c = C.tileRidge;
          else if (c !== C.tileGap && (x < x0 + 2 || (y - ridge) % 2 === 0)) c = C.tileLit;
          if (y === eave) c = C.roofDark;
          P.px(x, y, c);
        }
      }
      if (rand() > 0.3) {
        const cx = rx + 6 + Math.floor(rand() * Math.max(1, w - 14));
        P.rect(cx, ridge - 6, 3, 7, C.chimney);
        P.vline(cx, ridge - 6, ridge, C.chimneyCap);
        P.rect(cx - 1, ridge - 7, 5, 1, C.chimneyCap);
        masts.push([cx + 1, ridge - 8]);
      }
      if (rand() > 0.4) {
        const ax = rx + Math.floor(w * (0.5 + rand() * 0.35));
        P.vline(ax, ridge - 11, ridge, C.antenna);
        P.hline(ax - 3, ax + 3, ridge - 10, C.antenna);
        P.hline(ax - 2, ax + 2, ridge - 8, C.antenna);
        P.hline(ax - 1, ax + 1, ridge - 6, C.antenna);
        masts.push([ax, ridge - 11]);
      }
      if (rand() > 0.6) {
        const dx = rx + 3 + Math.floor(rand() * 5);
        P.rect(dx, eave - 3, 3, 2, C.antenna);
        P.px(dx + 1, eave - 4, "#8A84A8");
      }
      // A tabac diamond, a bar sign, a holographic billboard.
      if (neonDone === 0 && rx > X(0.05)) {
        neonDone++;
        const sx = rx + Math.floor(w / 2);
        const sy = eave + 3;
        const pix = [[sx, sy], [sx - 1, sy + 1], [sx + 1, sy + 1], [sx - 2, sy + 2], [sx + 2, sy + 2], [sx - 1, sy + 3], [sx + 1, sy + 3], [sx, sy + 4], [sx, sy + 2]];
        P.glow(sx, sy + 2, 8, C.neonRed, 0.25);
        pix.forEach(([x, y]) => P.px(x, y, C.neonRed));
        dyn.neon.push({ pix, flicker: 0 });
      } else if (neonDone === 1 && rx > X(0.45)) {
        neonDone++;
        const sx = rx + 4;
        const sy = eave + 2;
        const pix = [];
        for (let i = 0; i < 15; i++) pix.push([sx + i, sy], [sx + i, sy + 6]);
        for (let j = 1; j < 6; j++) pix.push([sx, sy + j], [sx + 14, sy + j]);
        const glyphs = [
          ["##.", "#.#", "##.", "#.#", "##."],
          [".#.", "#.#", "###", "#.#", "#.#"],
          ["##.", "#.#", "##.", "#.#", "#.#"],
        ];
        glyphs.forEach((g, n) => g.forEach((row, j) => [...row].forEach((ch, i) => ch === "#" && pix.push([sx + 2 + n * 4 + i, sy + 1 + j]))));
        P.rect(sx + 1, sy + 1, 13, 5, "#1A0A16");
        P.glow(sx + 7, sy + 3, 13, C.neonPink, 0.22);
        pix.forEach(([x, y]) => P.px(x, y, C.neonPink));
        dyn.neon.push({ pix, flicker: 1 });
      } else if (neonDone === 2 && rx > X(0.68) && w > 24) {
        neonDone++;
        const bx = rx + 4;
        const by = eave - 16;
        P.rect(bx - 1, by - 1, 15, 10, C.cable);
        P.vline(bx + 2, by + 9, eave, C.antenna);
        P.vline(bx + 10, by + 9, eave, C.antenna);
        dyn.billboard = { x: bx, y: by, w: 13, h: 8 };
        P.glow(bx + 6, by + 4, 14, C.neonCyan, 0.18);
      }
      rx += w - 2 - Math.floor(rand() * 4);
    }

    // Laundry and string lights between masts.
    masts.sort((a, b) => a[0] - b[0]);
    masts.forEach(([ax, ay], i) => {
      const next = masts[i + 1];
      if (!next) return;
      const [bx, by] = next;
      if (bx - ax < 10 || bx - ax > 48) return;
      const laundry = i % 2 === 1;
      for (let x = ax + 1; x < bx; x++) {
        const t = (x - ax) / (bx - ax);
        const y = Math.round(ay + (by - ay) * t + Math.sin(t * Math.PI) * 4);
        P.px(x, y, C.cable);
        if (laundry && (x - ax) % 6 === 2 && x + 3 < bx) {
          P.rect(x, y + 1, 3, 3 + ((x >> 1) % 2), [C.laundry1, C.laundry2, C.laundry3][(x >> 2) % 3]);
        } else if (!laundry && (x - ax) % 3 === 0) {
          P.px(x, y + 1, C.bulb);
          dyn.bulbs.push({ x, y: y + 1, p: (x * 0.7) % 6 });
        }
      }
    });
  }

  /* ---------------------------------------------------- room: background */

  function paintRoomBack(P) {
    const { win } = L;
    P.rect(0, 0, W, H, C.wall);
    P.vgrad(0, 0, W, Math.round(H * 0.18), [C.ceiling, C.wallDark, C.wall]);
    const rand = rng(77);
    for (let i = 0; i < (W * H) / 90; i++) P.px(Math.floor(rand() * W), Math.floor(rand() * H), rand() > 0.5 ? C.wallDark : "#1E1C30");
    // Violet dusk light falling from the window onto the walls.
    P.glow((win.x0 + win.x1) / 2, (win.y0 + win.y1) / 2, (win.x1 - win.x0) * 0.9, "#6A3A80", 0.22, { ry: (win.y1 - win.y0) * 1.2, steps: 4 });

    if (L.shelf) {
      const { x0, x1, y } = L.shelf;
      P.rect(x0, y, x1 - x0, 3, C.desk);
      P.hline(x0, x1 - 1, y, C.deskLit);
      P.rect(x0 + 3, y + 3, 2, 3, C.metal);
      P.rect(x1 - 5, y + 3, 2, 3, C.metal);
      let bx = x0 + 2;
      const books = [C.book1, C.book2, C.book3, C.book4, C.book5, C.book1];
      for (let i = 0; i < 6 && bx < x0 + (x1 - x0) * 0.3; i++) {
        const h = 9 + ((i * 3) % 5);
        const w = 3 + (i % 2);
        P.rect(bx, y - h, w, h, books[i]);
        P.hline(bx, bx + w - 1, y - h, C.pages);
        P.px(bx + 1, y - h + 3, C.pages);
        bx += w;
      }
      P.line(bx, y - 1, bx + 6, y - 10, C.book4);
      P.line(bx + 1, y - 1, bx + 7, y - 10, C.book4);
      // LED clock showing the real time.
      const clx = Math.min(bx + 10, x1 - 29);
      P.rect(clx, y - 10, 20, 10, C.outline);
      P.rect(clx + 1, y - 9, 18, 8, "#1A0A16");
      dyn.clock = { x: clx + 2, y: y - 8 };
      P.glow(clx + 10, y - 5, 14, C.led, 0.12);
      // Trailing plant.
      const px = x1 - 7;
      P.rect(px, y - 5, 5, 5, C.pot);
      P.hline(px, px + 4, y - 5, C.potLit);
      [[0, -6], [1, -8], [2, -7], [3, -9], [4, -6], [-1, -4], [5, -4]].forEach(([dx, dy]) => P.px(px + dx, y + dy, C.leafLit));
      for (let i = 0; i < 12; i++) P.px(px + 5 + (i % 3 === 0 ? 1 : 0), y + 1 + i, i % 2 ? C.leaf : C.leafLit);
      for (let i = 0; i < 7; i++) P.px(px - 1, y + 2 + i, i % 2 ? C.leafLit : C.leaf);
      hit("shelfbooks", x0, y - 15, bx + 8, y + 1);
      hit("clock", clx, y - 11, clx + 20, y);
      hit("plant", px - 2, y - 10, px + 8, y + 14);
    }

    // A framed print: a tiny sunset on the sea.
    if (L.poster) {
      const { x, y } = L.poster;
      P.rect(x - 1, y - 1, 24, 18, C.outline);
      P.rect(x, y, 22, 16, "#2A2440");
      P.vgrad(x + 2, y + 2, 18, 8, ["#3B2259", "#7E386F", "#DE7C69"]);
      P.rect(x + 2, y + 10, 18, 4, "#3A2552");
      P.hline(x + 8, x + 13, y + 9, C.sun);
      P.hline(x + 9, x + 12, y + 11, C.glint);
      P.hline(x + 7, x + 14, y + 12, C.glintPink);
      hit("poster", x - 1, y - 1, x + 23, y + 17);
    }

    // 言 in pink neon.
    if (L.kanji) {
      const { x, y } = L.kanji;
      P.glow(x + 4, y + 5, 16, C.neonPink, 0.2);
      P.spr(KANJI, { "#": "#7A2A5A" }, x + 1, y + 1);
      const pix = [];
      KANJI.forEach((row, j) => [...row].forEach((ch, i) => ch === "#" && pix.push([x + i, y + j])));
      pix.forEach(([px, py]) => P.px(px, py, "#FF7FBE"));
      dyn.neon.push({ pix, flicker: 2, room: true });
      hit("kanji", x - 2, y - 2, x + 11, y + 13);
    }
    paintHangingPlant(P);
  }

  function paintHangingPlant(P) {
    if (!L.hang) return;
    const { x } = L.hang;
    const potY = Math.round(H * 0.2);
    P.line(x, 0, x - 4, potY - 1, "#5A4A78");
    P.line(x, 0, x + 4, potY - 1, "#5A4A78");
    P.vline(x, 0, potY - 1, "#3A3050");
    const k = Math.round(potY * 0.55);
    P.hline(x - 2, x + 2, k, "#8A7AA8");
    P.rect(x - 5, potY, 11, 6, C.pot);
    P.hline(x - 5, x + 5, potY, C.potLit);
    P.vline(x - 5, potY, potY + 5, C.potLit);
    P.hline(x - 4, x + 4, potY + 6, C.outline);
    [[-4, -2], [-2, -3], [0, -4], [2, -3], [4, -2], [-3, -1], [3, -1], [1, -2], [-1, -2], [5, -1], [-5, -1]].forEach(([dx, dy], i) =>
      P.px(x + dx, potY + dy, i % 2 ? C.leafLit : C.leaf)
    );
    dyn.hang = {
      x,
      y: potY + 5,
      vines: [
        { dx: -5, len: 20, p: 0 },
        { dx: -2, len: 30, p: 1.3 },
        { dx: 1, len: 16, p: 2.1 },
        { dx: 4, len: 25, p: 0.7 },
        { dx: 6, len: 12, p: 2.9 },
      ],
    };
    hit("plant", x - 9, potY - 6, x + 10, potY + 36);
  }

  /* ------------------------------------------------------ window frame */

  function paintWindowFrame(P) {
    const { win } = L;
    const w = win.x1 - win.x0;
    const h = win.y1 - win.y0;
    P.rect(win.x0 - 4, win.y0 - 4, w + 8, 4, C.frame);
    P.rect(win.x0 - 4, win.y1, w + 8, 3, C.frame);
    P.rect(win.x0 - 4, win.y0, 4, h, C.frame);
    P.rect(win.x1, win.y0, 4, h, C.frame);
    P.rect(win.x0 - 3, win.y0 - 3, w + 6, 1, C.frameIn);
    P.vline(win.x1 + 3, win.y0, win.y1, C.frameIn);
    for (const f of [1 / 3, 2 / 3]) {
      const x = Math.round(win.x0 + w * f);
      P.rect(x - 1, win.y0, 3, h, C.frame);
      P.vline(x - 1, win.y0, win.y1 - 1, C.frameLit);
    }
    // Roller blind, rolled most of the way up.
    const by = win.y0 + Math.max(6, Math.round(h * 0.07));
    P.rect(win.x0 - 2, win.y0, w + 4, by - win.y0, C.blind);
    for (let y = win.y0 + 1; y < by; y += 2) P.hline(win.x0 - 2, win.x1 + 1, y, C.blindLit);
    P.rect(win.x0 - 3, by, w + 6, 2, C.outline);
    P.vline(Math.round(win.x0 + w * 0.5), by + 2, by + 6, C.frameIn);
    // Glass reflections.
    P.setClip(win);
    for (let i = 0; i < 3; i++) {
      const x = Math.round(win.x0 + w * (0.1 + i * 0.33));
      for (let k = 0; k < 10; k++) P.blend(x + k, win.y0 + 14 + k, "#FFFFFF", 0.06);
      for (let k = 0; k < 6; k++) P.blend(x + k + 4, win.y0 + 14 + k, "#FFFFFF", 0.04);
    }
    P.setClip(null);
    // From here on, anything painted hides the glass from rain and blinds.
    for (let y = by + 2; y < win.y1; y++) for (let x = win.x0 - 2; x < win.x1 + 2; x++) P.occ[y * W + x] = 1;
    P.occluding = true;
    hit("window", win.x0, win.y0, win.x1, win.y1);
    hit("blinds", win.x0 - 4, win.y0 - 4, win.x1 + 4, by + 3);
    dyn.blind = { y: by + 2, cordX: win.x1 - 5 };
    // Sill, and the cat on it.
    P.rect(win.x0 - 7, win.y1 + 3, w + 14, 4, C.sill);
    P.hline(win.x0 - 7, win.x1 + 6, win.y1 + 3, C.sillLit);
    P.rect(win.x0 - 7, win.y1 + 7, w + 14, 1, C.outline);
    if (L.catX) {
      P.spr(CAT, { k: C.catBody, r: C.catRim }, L.catX, win.y1 + 3 - CAT.length);
      dyn.cat = { x: L.catX + 8, y: win.y1 + 2, hx: L.catX + 3, hy: win.y1 + 3 - CAT.length };
      hit("cat", L.catX - 1, win.y1 - 9, L.catX + 12, win.y1 + 4);
    }
    // Plants on the sill.
    const sy = win.y1 + 3;
    const p1 = win.x0 + 4;
    P.rect(p1, sy - 4, 7, 4, C.pot);
    P.hline(p1, p1 + 6, sy - 4, C.potLit);
    [[0, -5], [1, -6], [2, -7], [3, -6], [4, -7], [5, -6], [6, -5], [2, -5], [4, -5], [3, -8]].forEach(([dx, dy], i) => P.px(p1 + dx, sy + dy, i % 3 ? C.leafLit : C.leaf));
    hit("plant", p1 - 1, sy - 9, p1 + 8, sy);
    const p2 = Math.round(win.x0 + w * 0.27);
    P.rect(p2, sy - 4, 5, 4, "#7A5A6A");
    P.hline(p2, p2 + 4, sy - 4, "#9A7A8A");
    P.rect(p2 + 1, sy - 12, 3, 8, C.leaf);
    P.vline(p2 + 1, sy - 12, sy - 5, C.leafLit);
    P.rect(p2 - 1, sy - 9, 2, 1, C.leaf);
    P.vline(p2 - 1, sy - 11, sy - 9, C.leafLit);
    P.rect(p2 + 4, sy - 8, 2, 1, C.leaf);
    P.vline(p2 + 5, sy - 10, sy - 8, C.leafLit);
    P.px(p2 + 2, sy - 13, "#FF7FBE");
    hit("plant", p2 - 2, sy - 14, p2 + 7, sy);
    // Fairy lights along the top of the window.
    for (let x = win.x0 - 2; x < win.x1 + 2; x++) {
      const t = (x - win.x0) / w;
      const y = by + 3 + Math.round(Math.abs(Math.sin(t * Math.PI * 3)) * 3);
      P.px(x, y, C.outline);
      if ((x - win.x0) % 5 === 0) {
        P.glow(x, y + 1, 4, C.bulb, 0.15);
        P.px(x, y + 1, C.bulb);
        dyn.fairy.push({ x, y: y + 1, p: x * 0.37 });
      }
    }
  }

  /* ---------------------------------------------------- room: furniture */

  const deskDepth = () => (L.portrait ? 6 : 11);

  function paintRoomFront(P) {
    const { deskY } = L;
    const x0 = L.deskX0;
    const dd = deskDepth();
    if (!L.portrait) paintTurntable(P);
    // Desk top, seen slightly from above, lit violet near the window.
    P.rect(x0, deskY, W - x0 + 2, dd, C.desk);
    for (let y = deskY; y < deskY + dd; y++) {
      for (let x = x0; x < W; x++) if (bayer(x, y) < 0.16 - ((y - deskY) / dd) * 0.14) P.px(x, y, C.deskLit);
    }
    P.hline(x0, W, deskY, C.sillLit);
    P.hline(x0, W, deskY + dd, C.deskLit);
    P.rect(x0, deskY + dd + 1, W - x0 + 2, 2, C.outline);
    P.rect(x0 + 2, deskY + dd + 3, W - x0, H - deskY, C.deskFront);
    if (!L.portrait) {
      for (let i = 0; i < 3; i++) {
        const y = deskY + dd + 6 + i * 13;
        P.rect(x0 + 6, y, 34, 11, C.deskDark);
        P.hline(x0 + 6, x0 + 39, y, C.desk);
        P.rect(x0 + 18, y + 4, 10, 2, C.metalLit);
      }
    }
    for (let y = deskY + dd + 3; y < H; y++) {
      for (let x = x0 + 2; x < W; x++) if (bayer(x, y) < ((y - deskY) / (H - deskY)) * 0.6) P.px(x, y, C.deskDark);
    }
    if (L.portrait) paintTurntable(P);
    else paintDeskCactus(P);
    paintBooks(P);
    paintMonitor(P);
    paintMug(P);
    paintLamp(P);
    if (L.pcX) paintPC(P);
    if (L.plantX) paintFloorPlant(P);
    paintChair(P);
  }

  /** A record player — on a low cabinet of records, or on the desk on phones. */
  function paintTurntable(P) {
    const T = L.turntable;
    if (!T) return;
    let top;
    if (!L.portrait) {
      const x0 = T.x;
      const x1 = T.x + T.w;
      top = L.deskY + 12;
      P.rect(x0 - 1, top - 1, x1 - x0 + 2, H - top + 1, C.outline);
      P.rect(x0, top, x1 - x0, H - top, "#221C2E");
      P.rect(x0, top, x1 - x0, 3, "#3A2E48");
      P.hline(x0, x1 - 1, top, "#5A4870");
      const cw = Math.floor((x1 - x0 - 6) / 2) - 1;
      const SLEEVES = ["#E07A90", "#6FB7C4", "#F2C46D", "#B27CFF", "#C9B8D8", "#8A5E6A", "#3E5A66", "#FF7FBE"];
      for (let c = 0; c < 2; c++) {
        const cx0 = x0 + 3 + c * (cw + 2);
        const cy0 = top + 6;
        const ch = 24;
        P.rect(cx0, cy0, cw, ch, "#100D18");
        for (let i = 1; i < cw - 1; i++) {
          const hgt = ch - 3 - ((i * 7 + c * 3) % 5);
          P.vline(cx0 + i, cy0 + ch - hgt, cy0 + ch - 1, i % 2 ? SLEEVES[(i * 3 + c * 5) % SLEEVES.length] : "#1A1530");
        }
        P.hline(cx0, cx0 + cw - 1, cy0 + ch, "#2E2640");
      }
      // A small speaker on the cabinet.
      P.rect(x1 - 9, top - 13, 8, 13, C.outline);
      P.rect(x1 - 8, top - 12, 6, 11, "#1E1A2A");
      P.rect(x1 - 7, top - 7, 4, 4, "#3A3550");
      P.px(x1 - 6, top - 6, "#5A5070");
      P.px(x1 - 6, top - 10, "#3A3550");
      dyn.speaker = { x: x1 - 7, y: top - 7 };
    } else {
      top = L.deskY;
    }
    const pw = 30;
    const px = L.portrait ? T.x : T.x + 2;
    const py = top - 6;
    P.rect(px - 1, py - 1, pw + 2, 8, C.outline);
    P.rect(px, py, pw, 6, "#5A3E30");
    P.hline(px, px + pw - 1, py, "#8A6046");
    P.hline(px, px + pw - 1, py + 5, "#3A2820");
    P.px(px + 3, py + 3, "#C9B8D8");
    P.px(px + 6, py + 3, "#5A2030");
    const rcx = px + 12;
    const rcy = py - 2;
    const rx = 10;
    const ry = 2.6;
    for (let y = -3; y <= 3; y++) {
      for (let x = -rx; x <= rx; x++) {
        const dd = (x * x) / (rx * rx) + (y * y) / (ry * ry);
        if (dd > 1) continue;
        P.px(rcx + x, rcy + y, dd > 0.8 ? "#8A8AA0" : dd > 0.5 ? "#141120" : dd > 0.3 ? "#24202F" : dd > 0.08 ? "#141120" : "#E07A90");
      }
    }
    P.px(rcx, rcy, "#F2C46D");
    const ax = px + pw - 4;
    const ay = py - 3;
    P.rect(ax - 1, ay - 1, 3, 3, "#8A8AA0");
    P.px(ax, ay - 1, "#D9D9E6");
    dyn.turntable = { cx: rcx, cy: rcy, rx, ry, ax, ay, led: [px + 6, py + 3] };
    hit("turntable", px - 2, py - 7, px + pw + 2, py + 7);
  }

  function paintDeskCactus(P) {
    const x = L.deskX0 + 5;
    const y = L.deskY + 3;
    P.rect(x - 1, y - 5, 7, 5, C.outline);
    P.rect(x, y - 4, 5, 4, "#9A6A52");
    P.hline(x, x + 4, y - 4, "#C08A6A");
    P.rect(x + 1, y - 13, 3, 9, "#2E6A50");
    P.vline(x + 1, y - 13, y - 5, "#4A9A6E");
    P.rect(x - 1, y - 10, 2, 1, "#2E6A50");
    P.vline(x - 1, y - 12, y - 10, "#4A9A6E");
    P.rect(x + 4, y - 8, 2, 1, "#2E6A50");
    P.vline(x + 5, y - 11, y - 8, "#4A9A6E");
    [[2, -12], [1, -9], [3, -7], [2, -6]].forEach(([dx, dy]) => P.px(x + dx, y + dy, "#B9E6C8"));
    hit("plant", x - 2, y - 14, x + 7, y);
  }

  /** An empty desk chair, backlit by the window. */
  function paintChair(P) {
    const small = L.portrait;
    const cx = L.monX - (small ? 24 : 40);
    const top = L.deskY + deskDepth() - (small ? 8 : 12);
    const w = small ? 32 : 42;
    for (let y = top; y < H; y++) {
      const t = y - top;
      let half = w / 2;
      if (t < 6) half = w / 2 - (6 - t) * 1.6;
      if (t > 52) half = w / 2 - Math.min(10, (t - 52) * 0.6);
      if (t > 62) break;
      const a = Math.round(cx - half);
      const b = Math.round(cx + half);
      P.hline(a, b, y, "#0C0A14");
      P.px(a, y, t < 40 ? "#3E2C5A" : "#2A1E40");
      P.px(b, y, "#241A36");
      if (t === 0) P.hline(a, b, y, "#4E3A6E");
    }
    // Seams, headrest, a stem and the base.
    P.hline(cx - 14, cx + 14, top + 12, "#16121F");
    P.vline(cx - 8, top + 13, top + 50, "#14101C");
    P.vline(cx + 8, top + 13, top + 50, "#14101C");
    P.rect(cx - 3, top + 62, 6, H - top - 62, "#0C0A14");
    P.vline(cx - 3, top + 62, H, "#2A1E40");
  }

  function paintMonitor(P) {
    const { deskY } = L;
    const mw = L.portrait ? 42 : 58;
    const mh = L.portrait ? 26 : 34;
    const x = L.monX - (mw >> 1);
    const y = deskY - mh - 9;
    P.rect(L.monX - 2, y + mh, 5, 8, C.metal);
    P.vline(L.monX - 2, y + mh, y + mh + 7, C.metalLit);
    P.rect(L.monX - 10, deskY - 2, 21, 2, C.metal);
    P.hline(L.monX - 10, L.monX + 10, deskY - 2, C.metalLit);
    P.rect(x - 1, y - 1, mw + 2, mh + 2, C.outline);
    P.rect(x, y, mw, mh, "#1A1A28");
    const sx = x + 2, sy = y + 2, sw = mw - 4, sh = mh - 4;
    P.vgrad(sx, sy, sw, sh, ["#103A44", "#0E2A33", "#0B1F28"]);
    // A tiny TITI OS on it.
    for (let i = 0; i < 4; i++) P.rect(sx + 2, sy + 2 + i * 5, 3, 3, i === 1 ? C.lampShade : C.screenLit);
    const ww = Math.round(sw * 0.5);
    const wh = Math.round(sh * 0.55);
    const wx = sx + Math.round(sw * 0.35);
    const wy = sy + 3;
    P.rect(wx, wy, ww, wh, "#16505C");
    P.rect(wx, wy, ww, 2, C.screenLit);
    for (let i = 0; i < 3; i++) P.hline(wx + 2, wx + ww - 4 - i * 3, wy + 4 + i * 2, C.screenLit);
    P.rect(wx + 2, wy + wh - 4, 7, 2, C.lampShade);
    P.rect(sx, sy + sh - 2, sw, 2, "#0A1820");
    dyn.screen = { x: wx + 10, y: wy + wh - 4 };
    hit("computer", x - 1, y - 1, x + mw + 1, y + mh + 9);
    P.glow(L.monX, y + mh / 2, mw * 0.9, C.screenLit, 0.12, { ry: mh * 1.2 });
    P.glow(L.monX, deskY + 1, mw * 0.6, C.screenLit, 0.18, { ry: 3 });
    // Keyboard and mouse.
    const kw = L.portrait ? 30 : 40;
    const kx = L.monX - (kw >> 1);
    const ky = deskY + deskDepth() - 5;
    P.rect(kx - 1, ky - 1, kw + 2, 5, C.outline);
    P.rect(kx, ky, kw, 3, C.keys);
    for (let i = 0; i < kw; i += 2) P.px(kx + i, ky, C.keysLit);
    for (let i = 1; i < kw; i += 3) P.px(kx + i, ky + 1, C.keysLit);
    P.rect(kx + kw + 4, ky, 3, 3, C.outline);
    P.rect(kx + kw + 5, ky + 1, 1, 1, C.keysLit);
  }

  function paintBooks(P) {
    const x = L.booksX;
    const y = L.deskY;
    [[22, C.book1], [18, C.book4], [20, C.book2], [16, C.book3]].forEach(([w, c], i) => {
      const by = y - 3 * (i + 1);
      const bx = x + [0, 2, 1, 3][i];
      P.rect(bx - 1, by - 1, w + 2, 4, C.outline);
      P.rect(bx, by, w, 2, c);
      P.rect(bx + w - 3, by, 3, 2, C.pages);
    });
    hit("books", x - 1, y - 19, x + 25, y + 1);
    const hx = x + 6;
    const hy = y - 17;
    P.line(hx, hy + 3, hx + 3, hy, C.headphones);
    P.line(hx + 3, hy, hx + 8, hy, C.headphones);
    P.line(hx + 8, hy, hx + 11, hy + 3, C.headphones);
    P.rect(hx - 1, hy + 2, 3, 3, C.headphones);
    P.rect(hx + 10, hy + 2, 3, 3, C.headphones);
    P.px(hx, hy + 3, C.neonCyan);
  }

  function paintMug(P) {
    const x = L.mugX;
    const y = L.deskY + deskDepth() - 9;
    P.rect(x - 1, y - 1, 8, 9, C.outline);
    P.rect(x, y, 6, 7, C.mug);
    P.vline(x + 5, y, y + 6, C.mugShade);
    P.hline(x, x + 5, y, C.coffee);
    P.rect(x + 7, y + 2, 2, 3, C.outline);
    P.px(x + 6, y + 2, C.mugShade);
    P.px(x + 6, y + 4, C.mugShade);
    dyn.steam = [{ x: x + 2, y: y - 2 }, { x: x + 4, y: y - 3 }];
    dyn.mug = { x, y };
    hit("coffee", x - 2, y - 4, x + 10, y + 8);
  }

  function lampGeom() {
    const x = L.lampX;
    const d = L.deskY;
    return { x, d, sx: x - 11, sy: d - 30 };
  }

  function paintLamp(P) {
    const { x, d, sx, sy } = lampGeom();
    if (lampOn) {
      const end = d + deskDepth();
      for (let y = sy + 5; y < end; y++) {
        const t = (y - sy - 5) / (end - sy - 5);
        const half = 3 + t * 16;
        for (let xx = Math.floor(sx - half); xx <= sx + half; xx++) {
          const k = (1 - Math.abs(xx - sx) / half) * (0.6 + 0.4 * t);
          if (k > bayer(xx, y) * 1.1) P.blend(xx, y, "#FFB870", y >= d ? 0.32 : 0.14);
        }
      }
      P.glow(sx, sy + 4, 26, "#FFB070", 0.18);
    }
    P.rect(x - 6, d - 3, 13, 3, C.lampBody);
    P.hline(x - 6, x + 6, d - 3, C.metalLit);
    P.line(x, d - 4, x + 4, d - 18, C.lampBody);
    P.line(x + 1, d - 4, x + 5, d - 18, C.metalLit);
    P.line(x + 4, d - 18, sx + 2, sy + 1, C.lampBody);
    P.line(x + 4, d - 19, sx + 2, sy, C.metalLit);
    P.rect(x + 3, d - 19, 3, 3, C.metal);
    [5, 7, 9, 11, 13].forEach((w, i) => {
      P.hline(sx - (w >> 1), sx + (w >> 1), sy + i, i < 2 ? C.lampShadeLit : C.lampShade);
      P.px(sx - (w >> 1), sy + i, C.outline);
      P.px(sx + (w >> 1), sy + i, C.outline);
    });
    P.hline(sx - 5, sx + 5, sy + 5, lampOn ? C.bulbHot : C.metal);
    dyn.lampBulb = lampOn ? { x: sx - 5, y: sy + 5, w: 11 } : null;
    hit("lamp", sx - 8, sy - 2, x + 8, d);
  }

  function paintPC(P) {
    const x = L.pcX;
    const d = L.deskY;
    const w = 20;
    const h = 40;
    P.rect(x - 1, d - h - 1, w + 2, h + 1, C.outline);
    P.rect(x, d - h, w, h, C.pcCase);
    P.rect(x + 2, d - h + 2, w - 4, h - 4, C.pcGlass);
    for (let i = 0; i < 3; i++) {
      const cx = x + w / 2;
      const cy = d - h + 8 + i * 12;
      P.glow(cx, cy, 9, C.fan, 0.16);
      for (let a = 0; a < 24; a++) {
        const ang = (a / 24) * Math.PI * 2;
        P.px(Math.round(cx + Math.cos(ang) * 4.5), Math.round(cy + Math.sin(ang) * 4.5), C.fan);
      }
      P.rect(cx - 1, cy - 1, 2, 2, C.fanDim);
      dyn.fans.push({ cx, cy });
    }
    P.px(x + w - 3, d - h + 2, C.neonCyan);
    hit("pc", x - 1, d - h - 1, x + w + 1, d);
  }

  function paintFloorPlant(P) {
    const x = L.plantX;
    const d = L.deskY;
    hit("plant", x - 28, d - 44, W, d + 6);
    const rand = rng(9);
    for (let i = 0; i < 9; i++) {
      const ang = -Math.PI / 2 + (rand() - 0.5) * 1.9;
      const len = 18 + rand() * 22;
      const ex = x + Math.cos(ang) * len;
      const ey = d - 6 + Math.sin(ang) * len;
      P.line(x, d + 6, Math.round(ex), Math.round(ey), C.leafDark);
      for (let k = -3; k <= 3; k++) {
        const t = 0.55 + k * 0.05;
        const lx = Math.round(x + (ex - x) * (0.6 + Math.abs(k) * 0.02));
        const ly = Math.round(d + 6 + (ey - d - 6) * t);
        P.hline(lx - 4 + Math.abs(k), lx + 4 - Math.abs(k), ly, k < 0 ? C.leafLit : C.leaf);
      }
    }
  }

  /* ---------------------------------------------------------- per frame */

  function frame(now) {
    ctx.drawImage(buffer, 0, 0);
    if (!dyn) return;
    const t = now / 1000;
    const live = ambient;
    const dt = live ? Math.min(0.25, Math.max(0, t - lastT)) : 0;
    lastT = t;
    const dot = (x, y, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    };
    const { win } = L;
    const vw = win.x1 - win.x0;
    const vh = win.y1 - win.y0;
    const inWin = (x, y) => x >= win.x0 && x < win.x1 && y >= win.y0 && y < win.y1;

    // Blinds move toward where they were asked to go.
    if (blindPos !== blindTarget) {
      const d = blindTarget - blindPos;
      blindPos = live ? blindPos + Math.sign(d) * Math.min(Math.abs(d), dt * 0.9) : blindTarget;
    }

    /* ---- outside */
    for (const s of dyn.twinkle) {
      const on = !live || Math.sin(t * s.rate * 6 + s.p) > -0.6;
      if (!on && s.off) dot(s.x, s.y, s.off);
      else if (on && !s.off) dot(s.x, s.y, s.c);
    }
    if (live) {
      ctx.fillStyle = C.sea;
      for (const g of dyn.glints) if (Math.sin(t * 2.3 + g.p * 2.1) < -0.2) ctx.fillRect(g.x, g.y, g.w + 1, 1);
    }
    for (const b of dyn.beacons) if (!live || (t + b.p) % b.period < b.period * b.on) dot(b.x, b.y, b.c);
    if (dyn.strips) {
      const { x, top, base } = dyn.strips;
      const span = base - top;
      for (let k = 0; k < 2; k++) {
        const y = live ? base - Math.round((t * 9 + k * span * 0.5) % span) : top + Math.round(span * (0.3 + k * 0.4));
        ctx.fillStyle = k ? C.neonPink : C.neonCyan;
        ctx.fillRect(x - 1, y, 1, 3);
        ctx.fillRect(x + 1, y + 1, 1, 2);
      }
    }
    for (const n of dyn.neon) {
      if (n.room) continue;
      let on = true;
      if (live && n.flicker === 0) on = t % 7 > 0.18 || t % 0.2 > 0.1;
      if (live && n.flicker === 1) on = !(Math.sin(t * 9.1) > 0.92 && Math.sin(t * 0.7) > 0);
      if (!on) {
        ctx.fillStyle = "#3A1A2E";
        for (const [x, y] of n.pix) ctx.fillRect(x, y, 1, 1);
      }
    }
    if (dyn.billboard) {
      const { x, y, w, h } = dyn.billboard;
      const shift = live ? Math.floor(t * 4) : 0;
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          const v = ((i + shift) * 7 + j * 13 + ((i + shift) >> 2) * 5) % 11;
          ctx.fillStyle = v < 3 ? C.neonCyan : v < 4 ? C.neonPink : v < 7 ? "#14404A" : "#0E2A33";
          ctx.fillRect(x + i, y + j, 1, 1);
        }
      }
      if (live && Math.sin(t * 3) > 0.96) {
        ctx.fillStyle = "#CFFBFF";
        ctx.fillRect(x, y + (((t * 20) | 0) % h), w, 1);
      }
    }
    if (live) {
      for (const g of dyn.gulls) {
        const x = Math.round(win.x0 + ((g.x - win.x0 + t * g.v * 2) % (vw + 20)) - 10);
        const y = Math.round(g.y + Math.sin(t * 0.8 + g.p) * 2);
        const flap = Math.sin(t * 5 + g.p) > 0;
        const pts = [[x, y], [x - 1, y - (flap ? 1 : 0)], [x + 1, y - (flap ? 1 : 0)]];
        if (flap) pts.push([x - 2, y], [x + 2, y]);
        for (const [px, py] of pts) if (inWin(px, py)) dot(px, py, "#E8DDF0");
      }
      if (dyn.drone) {
        const k = ((t + dyn.drone.t) % 60) / 30;
        if (k <= 1) {
          const x = Math.round(win.x1 - k * vw);
          const y = dyn.drone.y + Math.round(Math.sin(t * 1.5) * 1.5);
          if (inWin(x - 1, y) && inWin(x + 1, y)) {
            ctx.fillStyle = C.cable;
            ctx.fillRect(x - 1, y, 3, 1);
            if (t % 0.8 < 0.4) dot(x, y + 1, C.neonCyan);
          }
        }
      }
      for (const b of dyn.bulbs) if (Math.sin(t * 1.3 + b.p) < -0.85) dot(b.x, b.y, "#5A4030");
    }

    /* ---- the glass: rain, then the blinds, masked to where glass shows */
    gctx.clearRect(0, 0, W, H);
    if (rainOn) {
      gctx.fillStyle = "rgba(34, 26, 70, 0.2)";
      gctx.fillRect(win.x0, win.y0, vw, vh);
      gctx.globalAlpha = 0.38;
      gctx.fillStyle = "#B4A6E6";
      for (const d of drops) {
        if (live) {
          d.y += d.v * dt;
          d.x -= d.v * dt * 0.22;
          if (d.y > win.y1) {
            d.y = win.y0 - Math.random() * 20;
            d.x = win.x0 + Math.random() * (vw + 30);
          }
        }
        for (let i = 0; i < d.len; i++) gctx.fillRect(Math.round(d.x - i * 0.22), Math.round(d.y + i), 1, 1);
      }
      gctx.globalAlpha = 1;
      for (const b of beads) {
        if (live) {
          if (!b.slide && Math.random() < dt * 0.05) b.slide = true;
          if (b.slide) {
            b.y += b.v * dt;
            if (b.y > win.y1 - 1) {
              b.y = win.y0 + 8 + Math.random() * vh * 0.5;
              b.x = win.x0 + Math.floor(Math.random() * vw);
              b.slide = false;
            }
          }
        }
        const by = Math.round(b.y);
        gctx.fillStyle = "#D6CAF5";
        gctx.fillRect(b.x, by, 1, 1);
        gctx.fillStyle = "rgba(20, 14, 40, 0.7)";
        gctx.fillRect(b.x, by + 1, 1, 1);
        if (b.slide) {
          gctx.fillStyle = "rgba(200, 185, 240, 0.25)";
          gctx.fillRect(b.x, by - 4, 1, 4);
        }
      }
    }
    if (blindPos > 0.002 && dyn.blind) {
      const top = dyn.blind.y;
      const bh = Math.round((win.y1 - top) * blindPos);
      for (let y = top; y < top + bh; y++) {
        const r = (y - top) % 4;
        gctx.fillStyle = r === 3 ? "rgba(8, 6, 18, 0.62)" : r === 0 ? C.blindLit : C.blind;
        gctx.fillRect(win.x0 - 2, y, vw + 4, 1);
      }
      gctx.fillStyle = C.outline;
      gctx.fillRect(win.x0 - 2, top + bh, vw + 4, 2);
      gctx.fillStyle = C.frameLit;
      gctx.fillRect(win.x0 - 2, top + bh, vw + 4, 1);
    }
    gctx.globalCompositeOperation = "destination-in";
    gctx.drawImage(maskCanvas, 0, 0);
    gctx.globalCompositeOperation = "source-over";
    ctx.drawImage(glass, 0, 0);
    // The blind cord, in front.
    if (dyn.blind) {
      const top = dyn.blind.y;
      const end = top + Math.round((win.y1 - top) * blindPos) + 6;
      ctx.fillStyle = "#4A3D66";
      ctx.fillRect(dyn.blind.cordX, top, 1, Math.min(end, win.y1 + 2) - top);
      ctx.fillStyle = "#8A7AA8";
      ctx.fillRect(dyn.blind.cordX - 1, Math.min(end, win.y1 + 2), 3, 2);
    }

    /* ---- the room */
    // Hanging plant, swaying a little.
    if (dyn.hang) {
      const { x, y, vines } = dyn.hang;
      vines.forEach((v, n) => {
        for (let k = 0; k < v.len; k++) {
          const sway = live ? Math.sin(t * 0.8 + v.p + k * 0.14) * (k / v.len) * 1.6 : 0;
          const vx = x + v.dx + Math.round(sway);
          const vy = y + k;
          dot(vx, vy, C.leafDark);
          if (k % 3 === 1) dot(vx + (k % 2 ? 1 : -1), vy, (k + n) % 2 ? C.leafLit : C.leaf);
          if (k % 3 === 2) dot(vx + (k % 2 ? -1 : 1), vy, C.leaf);
        }
      });
    }
    // Fans (colour can be changed by clicking the PC).
    if (dyn.fans.length) {
      const fc = FAN_COLORS[fanIdx];
      for (const f of dyn.fans) {
        if (fanIdx) {
          ctx.fillStyle = fc;
          for (let a = 0; a < 24; a++) {
            const ang = (a / 24) * Math.PI * 2;
            ctx.fillRect(Math.round(f.cx + Math.cos(ang) * 4.5), Math.round(f.cy + Math.sin(ang) * 4.5), 1, 1);
          }
        }
        if (live) {
          const a = t * 3 + f.cy;
          dot(Math.round(f.cx + Math.cos(a) * 2), Math.round(f.cy + Math.sin(a) * 2), "#FFE6F2");
        }
      }
    }
    // Coffee: full, sipped, or empty.
    if (dyn.mug) {
      const { x, y } = dyn.mug;
      if (coffee === 0) {
        ctx.fillStyle = "#2A2436";
        ctx.fillRect(x, y, 5, 1);
      }
      if (live && coffee > 0) {
        dyn.steam.slice(0, coffee >= 3 ? 2 : 1).forEach((s, i) => {
          const k = (t * 0.6 + i * 0.5) % 1;
          if (k < 0.85) dot(Math.round(s.x + Math.sin(t * 2 + i) * 1.2), Math.round(s.y - k * 8), C.steam);
        });
      }
    }
    // The record player.
    if (dyn.turntable) {
      const { cx, cy, rx, ry, ax, ay, led } = dyn.turntable;
      dot(led[0], led[1], musicOn ? "#FF4F7A" : "#5A2030");
      if (musicOn) {
        const a = live ? t * 4.2 : 0;
        dot(Math.round(cx + Math.cos(a) * rx * 0.62), Math.round(cy + Math.sin(a) * ry * 0.62), "#6A6088");
        dot(Math.round(cx + Math.cos(a + Math.PI) * rx * 0.42), Math.round(cy + Math.sin(a + Math.PI) * ry * 0.42), "#4A4466");
      }
      const tipX = musicOn ? cx + Math.round(rx * 0.5) : ax + 1;
      const tipY = musicOn ? cy - 1 : ay + 4;
      ctx.fillStyle = "#C9C9D8";
      const steps = Math.max(Math.abs(tipX - ax), Math.abs(tipY - ay));
      for (let i = 0; i <= steps; i++) ctx.fillRect(Math.round(ax + ((tipX - ax) * i) / steps), Math.round(ay + ((tipY - ay) * i) / steps), 1, 1);
      ctx.fillStyle = "#8A8AA0";
      ctx.fillRect(tipX - 1, tipY, 2, 1);
      if (musicOn && live && t - lastNote > 1.1) {
        lastNote = t;
        notes.push({ x: cx - 2 + Math.round(Math.random() * 6), y: cy - 6, born: t, c: Math.random() > 0.5 ? C.neonPink : C.neonCyan, drift: Math.random() * 6 });
      }
      if (dyn.speaker && musicOn && live) {
        const pulse = Math.sin(t * Math.PI * 2 * (74 / 60)) > 0.3;
        ctx.fillStyle = pulse ? "#6A6088" : "#3A3550";
        ctx.fillRect(dyn.speaker.x - (pulse ? 1 : 0), dyn.speaker.y - (pulse ? 1 : 0), pulse ? 6 : 4, pulse ? 6 : 4);
      }
    }
    // The cat: tail (faster with music), and a heart when petted.
    if (dyn.cat) {
      const speed = musicOn ? 2.6 : 0.9;
      const up = live && Math.sin(t * speed) > 0.55;
      const { x, y, hx, hy } = dyn.cat;
      ctx.fillStyle = C.catBody;
      ctx.fillRect(x + 1, y, 3, 1);
      ctx.fillRect(x + 4, up ? y - 2 : y, 1, up ? 3 : 1);
      ctx.fillRect(x + 5, up ? y - 3 : y, 1, 1);
      const since = now / 1000 - catPokeAt;
      if (since >= 0 && since < 1.8) {
        if (since < 0.5 && Math.floor(since * 10) % 2 === 0) {
          ctx.fillStyle = "#3A2A55";
          ctx.fillRect(hx - 2, hy, 1, 1);
          ctx.fillRect(hx + 3, hy, 1, 1);
        }
        const k = since / 1.8;
        const heart = [".#.#.", "#####", ".###.", "..#.."];
        ctx.globalAlpha = 1 - k * 0.8;
        ctx.fillStyle = C.neonPink;
        heart.forEach((row, j) => [...row].forEach((ch, i) => ch === "#" && ctx.fillRect(hx - 1 + i, hy - 7 - Math.round(k * 8) + j, 1, 1)));
        ctx.globalAlpha = 1;
      }
    }
    // Water drops on the plants.
    dyn.waters = dyn.waters.filter((w) => now / 1000 - w.t < 1.6);
    for (const w of dyn.waters) {
      const k = (now / 1000 - w.t) / 1.6;
      if (k < 0.55) {
        for (let i = 0; i < 4; i++) dot(w.x - 2 + i * 1.5, Math.round(w.y - 10 + (k / 0.55) * 10 + (i % 2) * 2), "#7FC8F0");
      } else {
        for (let i = 0; i < 5; i++) {
          const a = i * 1.26 + k * 3;
          dot(Math.round(w.x + Math.cos(a) * 4), Math.round(w.y - 2 + Math.sin(a) * 3), i % 2 ? "#B9F0D0" : "#7FC8F0");
        }
      }
    }

    /* ---- blinds down: the room goes dark, the fireflies come out */
    if (blindPos > 0.002) {
      ctx.fillStyle = `rgba(5, 4, 15, ${0.5 * blindPos})`;
      ctx.fillRect(0, 0, W, H);
    }
    // Light sources stay bright through the dark.
    const kanji = dyn.neon.find((n) => n.room);
    if (kanji) {
      const off = live && Math.sin(t * 13) > 0.97 && Math.sin(t * 0.31) > 0.6;
      ctx.fillStyle = off ? "#4A1A38" : "#FF7FBE";
      for (const [x, y] of kanji.pix) ctx.fillRect(x, y, 1, 1);
    }
    for (const b of dyn.fairy) dot(b.x, b.y, live && Math.sin(t * 1.3 + b.p) < -0.85 ? "#5A4030" : C.bulb);
    if (dyn.lampBulb && blindPos > 0.002) {
      ctx.fillStyle = C.bulbHot;
      ctx.fillRect(dyn.lampBulb.x, dyn.lampBulb.y, dyn.lampBulb.w, 1);
    }
    if (dyn.screen && (!live || t % 1.1 < 0.6)) {
      ctx.fillStyle = C.screenHi;
      ctx.fillRect(dyn.screen.x, dyn.screen.y, 1, 2);
    }
    if (dyn.clock) {
      const d = new Date();
      const s = String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0");
      let x = dyn.clock.x;
      for (let i = 0; i < 4; i++) {
        DIGITS[s[i]].forEach((row, j) => [...row].forEach((ch, k) => ch === "#" && dot(x + k, dyn.clock.y + j + 1, C.led)));
        x += i === 1 ? 5 : 4;
        if (i === 1 && (!live || d.getSeconds() % 2 === 0)) {
          dot(x - 2, dyn.clock.y + 2, C.led);
          dot(x - 2, dyn.clock.y + 4, C.led);
        }
      }
    }
    // Music notes rising from the record.
    notes = notes.filter((n) => t - n.born < 3);
    for (const n of notes) {
      const k = (t - n.born) / 3;
      const x = Math.round(n.x + Math.sin(k * 6 + n.drift) * 2 + k * 4);
      const y = Math.round(n.y - k * 22);
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = n.c;
      ctx.fillRect(x + 1, y, 2, 1);
      ctx.fillRect(x + 1, y + 1, 1, 2);
      ctx.fillRect(x, y + 3, 2, 1);
      ctx.globalAlpha = 1;
    }
    // Fireflies.
    const ff = Math.max(0, (blindPos - 0.25) / 0.75);
    if (ff > 0) {
      for (const f of fireflies) {
        if (live) {
          f.a += (Math.random() - 0.5) * dt * 4;
          f.x += Math.cos(f.a) * f.s * dt;
          f.y += Math.sin(f.a) * f.s * 0.7 * dt;
          if (f.x < 2 || f.x > W - 2) f.a = Math.PI - f.a;
          if (f.y < 6 || f.y > H * 0.82) f.a = -f.a;
          f.x = Math.max(2, Math.min(W - 2, f.x));
          f.y = Math.max(6, Math.min(H * 0.82, f.y));
        }
        const glow = (0.55 + 0.45 * Math.sin(t * 1.7 + f.p)) * ff;
        const x = Math.round(f.x);
        const y = Math.round(f.y);
        ctx.globalAlpha = glow * 0.18;
        ctx.fillStyle = "#3FB8D8";
        ctx.fillRect(x - 2, y - 1, 5, 3);
        ctx.fillRect(x - 1, y - 2, 3, 5);
        ctx.globalAlpha = glow * 0.55;
        ctx.fillStyle = "#5FD8F0";
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
        ctx.globalAlpha = Math.min(1, glow * 1.3);
        ctx.fillStyle = "#E0FDFF";
        ctx.fillRect(x, y, 1, 1);
        ctx.globalAlpha = 1;
      }
    }
  }

  /* ----------------------------------------------------------- the loop */

  const running = () => ambient && !paused && !document.hidden;

  function loop(now) {
    raf = 0;
    if (!running()) return;
    if (now - lastFrame >= 1000 / 12) {
      frame(now);
      lastFrame = now;
    }
    raf = requestAnimationFrame(loop);
  }

  function kick() {
    if (running()) {
      if (!raf) {
        lastFrame = 0;
        raf = requestAnimationFrame(loop);
      }
    } else {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      frame(performance.now());
    }
  }

  // Keep the shelf clock right while the scene is still.
  setInterval(() => {
    if (!running() && !document.hidden) frame(performance.now());
  }, 20000);

  function refresh() {
    if (!running()) frame(performance.now());
  }

  function rebuild() {
    measure();
    paint();
    frame(performance.now());
    kick();
  }

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, 120);
  });
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
      paint();
      frame(performance.now());
    },
    setRain(on) {
      rainOn = Boolean(on);
      refresh();
    },
    setBlinds(down) {
      blindTarget = down ? 1 : 0;
      refresh();
    },
    setMusic(on) {
      musicOn = Boolean(on);
      if (!on) notes = [];
      refresh();
    },
    /** One sip. Returns how many are left (0 = empty), or -1 if already empty. */
    sip() {
      if (coffee === 0) return -1;
      coffee -= 1;
      refresh();
      return coffee;
    },
    refill() {
      coffee = 3;
      refresh();
    },
    pokeCat() {
      catPokeAt = performance.now() / 1000;
    },
    cycleFans() {
      fanIdx = (fanIdx + 1) % FAN_COLORS.length;
      refresh();
      return fanIdx;
    },
    water(clientX, clientY) {
      if (dyn) dyn.waters.push({ x: Math.floor(clientX / PX), y: Math.floor(clientY / PX), t: performance.now() / 1000 });
    },
    /** What is under this point of the viewport, if anything. */
    hitTest(clientX, clientY) {
      if (!L) return null;
      const x = Math.floor(clientX / PX);
      const y = Math.floor(clientY / PX);
      for (let i = hits.length - 1; i >= 0; i--) {
        const h = hits[i];
        if (x >= h.x0 && x < h.x1 && y >= h.y0 && y < h.y1) return h.id === "window" && blindPos > 0.5 ? "blinds" : h.id;
      }
      return null;
    },
    hitsLamp(clientX, clientY) {
      return this.hitTest(clientX, clientY) === "lamp";
    },
    /** Viewport centre of a hit zone (used by tests and keyboard helpers). */
    locate(id) {
      const h = [...hits].reverse().find((z) => z.id === id);
      return h ? { x: ((h.x0 + h.x1) / 2) * PX, y: ((h.y0 + h.y1) / 2) * PX } : null;
    },
    state() {
      return { rain: rainOn, blinds: blindPos, music: musicOn, coffee, fan: fanIdx, fireflies: fireflies.length };
    },
  };
}
