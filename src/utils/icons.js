/**
 * Pixel icons, drawn by hand on a 16 × 16 grid.
 * Each character is one pixel; "." is transparent.
 * renderIcon() merges horizontal runs into <rect>s and returns an SVG string.
 */

const PALETTE = {
  k: "#0E1014", // outline
  d: "#252B34",
  m: "#3A434F",
  l: "#A8B4B9",
  w: "#E1E4E5",
  t: "#78949A",
  T: "#4E6267",
  a: "#C49B70",
  A: "#8A6A4B",
  g: "#8FA68E",
  G: "#5C7260",
  s: "#94A08C",
  r: "#B8958A",
  R: "#7E625A",
};

const MAPS = {
  // BAM — a bound notebook with a ribbon
  bam: [
    "................",
    "...kkkkkkkkkk...",
    "...kAaaaaaaaak..",
    "...kAaaaaaaaakl.",
    "...kAawwwwwwakl.",
    "...kAaaaaaaaakl.",
    "...kAawwwwaaakl.",
    "...kAaaaaaaaakl.",
    "...kAaaaaaaaakl.",
    "...kAaaaaaaaakl.",
    "...kAaaaarraakl.",
    "...kAaaaarraakl.",
    "...kAaaaarraakl.",
    "...kkkkkkrkkkkl.",
    "....llllllllll..",
    "................",
  ],
  // TRAD/LAB — an Erlenmeyer flask
  tradlab: [
    "................",
    ".........w......",
    ".......t........",
    ".....kkkkkk.....",
    "......kllk......",
    "......kllk......",
    "......kllk......",
    ".....kwlllk.....",
    "....kwlllllk....",
    "...kwlllllllk...",
    "..kttwtttttttk..",
    ".kttttttwtttttk.",
    ".kTttttttttttTk.",
    ".kkkkkkkkkkkkkk.",
    "..mmmmmmmmmmmm..",
    "................",
  ],
  // AGORA — a small temple of columns
  agora: [
    "................",
    ".......kk.......",
    ".....kksskk.....",
    "...kksssssskk...",
    ".kllllllllllllk.",
    ".kkkkkkkkkkkkkk.",
    "..kl.kl..kl.kl..",
    "..kl.kl..kl.kl..",
    "..kl.kl..kl.kl..",
    "..kl.kl..kl.kl..",
    "..kl.kl..kl.kl..",
    "..kl.kl..kl.kl..",
    ".kkkkkkkkkkkkkk.",
    "kmmmmmmmmmmmmmmk",
    "kkkkkkkkkkkkkkkk",
    "................",
  ],
  // KOTONOHA — a leaf (言の葉, "leaves of words")
  kotonoha: [
    "................",
    "............kkk.",
    "..........kkggk.",
    "........kkggggk.",
    "......kkggggglk.",
    ".....kggggggglk.",
    "....kgggggglggk.",
    "....kggggglgggk.",
    "...kggggGlgggGk.",
    "...kgggGlggggk..",
    "...kggGlggggk...",
    "...kgGlgggkk....",
    "...kGlgkkk......",
    "..klkkk.........",
    ".kl.............",
    "kk..............",
  ],
  // TITI'S ROOM — a closed door, light under it
  room: [
    "................",
    "..kkkkkkkkkkk...",
    "..kRRRRRRRRRk...",
    "..kRrrrrrraRk...",
    "..kRrRRRRraRk...",
    "..kRrRrrRraRk...",
    "..kRrRRRRraRk...",
    "..kRrrrrrraRk...",
    "..kRrrrrkraRk...",
    "..kRrrrrrraRk...",
    "..kRrRRRRraRk...",
    "..kRrRrrRraRk...",
    "..kRrRRRRraRk...",
    "..kkkkkkkkkkk...",
    "...aaaaaaaaa....",
    "................",
  ],
  // ABOUT — a readme sheet with a folded corner
  about: [
    "................",
    "...kkkkkkkk.....",
    "...kwwwwwwkk....",
    "...kwwwwwwklk...",
    "...kwwwwwwkkkk..",
    "...kwwwwwwwwwk..",
    "...kwmmmmmmwwk..",
    "...kwwwwwwwwwk..",
    "...kwmmmmmmmwk..",
    "...kwwwwwwwwwk..",
    "...kwmmmmwwwwk..",
    "...kwwwwwwwwwk..",
    "...kwwwwwwtttk..",
    "...kkkkkkkkkkk..",
    "....mmmmmmmmmmm.",
    "................",
  ],
  // KO-FI — a cup of coffee
  kofi: [
    "................",
    ".....l...l......",
    "......l...l.....",
    ".....l...l......",
    "................",
    "..kkkkkkkkkk....",
    "..kAAAAAAAAk....",
    "..klllllllmkkk..",
    "..klllllllmk.k..",
    "..klllllllmk.k..",
    "..klllllllmkkk..",
    "...kllllllk.....",
    "....kkkkkk......",
    ".kkkkkkkkkkkk...",
    "..mmmmmmmmmm....",
    "................",
  ],
  // FILES — a folder
  files: [
    "................",
    "................",
    ".kkkkk..........",
    "kaaaaak.........",
    "kaaaaaakkkkkkkk.",
    "kAAAAAAAAAAAAAAk",
    "kaaaaaaaaaaaaaak",
    "kaaaaaaaaaaaaaak",
    "kaaaaaaaaaaaaaak",
    "kaaaaaaaaaaaaaak",
    "kaaaaaaaaaaaaaak",
    "kaaaaaaaaaaaaaak",
    "kAAAAAAAAAAAAAAk",
    "kkkkkkkkkkkkkkkk",
    ".mmmmmmmmmmmmmm.",
    "................",
  ],
  // SETTINGS — a cog
  settings: [
    "................",
    "......kkkk......",
    "...kk.kllk.kk...",
    "..kllkkllkkllk..",
    "..kllllllllllk..",
    "...kllkkkkllk...",
    ".kkllk....kllkk.",
    ".klllk....klllk.",
    ".klllk....klllk.",
    ".kkllk....kllkk.",
    "...kllkkkkllk...",
    "..kllllllllllk..",
    "..kllkkllkkllk..",
    "...kk.kllk.kk...",
    "......kkkk......",
    "................",
  ],
  // TITI OS — a small monitor with a "t" on it
  logo: [
    "................",
    ".kkkkkkkkkkkkkk.",
    ".kmmmmmmmmmmmmk.",
    ".kmkkkkkkkkkkmk.",
    ".kmkTTTTTTTTkmk.",
    ".kmkTTaTTTTTkmk.",
    ".kmkTaaaTTTTkmk.",
    ".kmkTTaTTTTTkmk.",
    ".kmkTTaTTTTTkmk.",
    ".kmkTTTaaTTTkmk.",
    ".kmkkkkkkkkkkmk.",
    ".kmmmmmmmmmmmmk.",
    ".kkkkkkkkkkkkkk.",
    "......kmmk......",
    "....kkkkkkkk....",
    "................",
  ],
  // A text file
  text: [
    "................",
    "...kkkkkkkk.....",
    "...kllllllkk....",
    "...kllllllkmk...",
    "...kllllllkkkk..",
    "...kllllllllk...",
    "...klmmmmmmlk...",
    "...kllllllllk...",
    "...klmmmmmllk...",
    "...kllllllllk...",
    "...klmmmmmmlk...",
    "...kllllllllk...",
    "...klmmmllllk...",
    "...kkkkkkkkkk...",
    "................",
    "................",
  ],
  // A link / shortcut
  link: [
    "................",
    "................",
    "..kkkkkkkkkkkk..",
    "..kddddddddddk..",
    "..kddddddddddk..",
    "..kdddddkkkkdk..",
    "..kddddddkttdk..",
    "..kdddddktktdk..",
    "..kddddktkdkdk..",
    "..kdddktkddddk..",
    "..kddktkdddddk..",
    "..kdddkddddddk..",
    "..kddddddddddk..",
    "..kkkkkkkkkkkk..",
    "................",
    "................",
  ],
};

const cache = new Map();

/** Pad or cut every row to 16 pixels so a typo can never break the grid. */
function normalise(rows) {
  return rows.map((row) => row.replace(/ /g, ".").padEnd(16, ".").slice(0, 16));
}

export function renderIcon(name, { label = "" } = {}) {
  const key = name + "|" + label;
  if (cache.has(key)) return cache.get(key);
  const rows = normalise(MAPS[name] || MAPS.text);
  let rects = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < 16) {
      const ch = row[x];
      if (ch === "." || !PALETTE[ch]) {
        x += 1;
        continue;
      }
      let run = 1;
      while (x + run < 16 && row[x + run] === ch) run += 1;
      rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${PALETTE[ch]}"/>`;
      x += run;
    }
  });
  const a11y = label ? `role="img" aria-label="${label}"` : `aria-hidden="true" focusable="false"`;
  const svg = `<svg class="px-icon" viewBox="0 0 16 16" ${a11y} xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
  cache.set(key, svg);
  return svg;
}

export function hasIcon(name) {
  return Boolean(MAPS[name]);
}

/** Small line glyphs for chrome (not pixel-art icons). */
export const GLYPHS = {
  minimize: `<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><rect x="1" y="9" width="10" height="2" fill="currentColor"/></svg>`,
  close: `<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><path fill="currentColor" d="M1 1h2v1h1v1h1v1h2V3h1V2h1V1h2v2h-1v1h-1v1H8v2h1v1h1v1h1v2H9v-1H8v-1H7V8H5v1H4v1H3v1H1V9h1V8h1V7h1V5H3V4H2V3H1z"/></svg>`,
  external: `<svg class="ext" viewBox="0 0 12 12" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><path fill="currentColor" d="M5 1h6v6H9V4.4L4.4 9 3 7.6 7.6 3H5zM1 3h2v6h6v2H1z"/></svg>`,
  soundOn: `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><path fill="currentColor" d="M2 6h3l3-3h1v10H8l-3-3H2zM11 5h1v1h1v4h-1v1h-1v-1h1V6h-1zM13 3h1v1h1v8h-1v1h-1v-1h1V4h-1z"/></svg>`,
  soundOff: `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><path fill="currentColor" d="M2 6h3l3-3h1v10H8l-3-3H2zM11 6h1v1h1V6h1v1h-1v2h1v1h-1V9h-1v1h-1V9h1V7h-1z"/></svg>`,
  windows: `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><path fill="currentColor" d="M4 2h10v8h-2V4H4zM2 6h8v8H2zm2 2v4h4V8z"/></svg>`,
};
