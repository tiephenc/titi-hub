/**
 * Pre-deployment checks, run by GitHub Actions before every publish
 * (and locally with `node scripts/check.mjs`). No dependencies.
 *
 * - every JavaScript file parses
 * - every relative import, stylesheet, script and asset exists
 * - the project registry is consistent (ids, statuses, URLs, icons)
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// 1. JavaScript syntax and relative imports.
const jsFiles = [...walk(join(root, "src")), ...walk(join(root, "config"))].filter((f) => f.endsWith(".js"));
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (e) {
    fail(`${relative(root, file)} does not parse:\n${e.stderr}`);
  }
  const src = readFileSync(file, "utf8");
  for (const [, spec] of src.matchAll(/(?:import|from)\s*["'](\.[^"']+)["']/g)) {
    if (!existsSync(resolve(dirname(file), spec))) fail(`${relative(root, file)} imports missing ${spec}`);
  }
}

// 2. Files referenced from the HTML pages.
for (const page of ["index.html", "404.html"]) {
  const html = readFileSync(join(root, page), "utf8");
  for (const [, ref] of html.matchAll(/(?:href|src)="([^"#:]+)"/g)) {
    if (ref.startsWith("/") || ref.startsWith("//")) continue;
    if (!existsSync(join(root, ref))) fail(`${page} references missing file ${ref}`);
  }
}
for (const asset of ["assets/og.png", "assets/favicon.svg", "assets/favicon-32.png", "assets/apple-touch-icon.png"]) {
  if (!existsSync(join(root, asset))) fail(`missing ${asset}`);
}

// 3. Project registry.
const { PROJECTS, STATUS_LABELS } = await import(pathToFileURL(join(root, "config/projects.js")));
const { SITE } = await import(pathToFileURL(join(root, "config/settings.js")));
const iconsSrc = readFileSync(join(root, "src/utils/icons.js"), "utf8");
const ids = new Set();
for (const p of PROJECTS) {
  const where = `project "${p.id}"`;
  for (const key of ["id", "name", "file", "description", "status", "icon", "accent"]) {
    if (!p[key]) fail(`${where} is missing "${key}"`);
  }
  if (ids.has(p.id)) fail(`${where} is defined twice`);
  ids.add(p.id);
  if (!/^[a-z0-9-]+$/.test(p.id)) fail(`${where}: id must be lowercase letters, digits or dashes`);
  if (!(p.status in STATUS_LABELS)) fail(`${where}: unknown status "${p.status}"`);
  if (p.status === "online" && !/^https:\/\/\S+$/.test(p.url)) fail(`${where} is "online" but has no https URL`);
  if (p.status !== "online" && p.url) warnings.push(`${where} has a URL but status "${p.status}" — it will not be launchable until set to "online"`);
  if (!/^#[0-9a-f]{6}$/i.test(p.accent)) fail(`${where}: accent must be a #RRGGBB colour`);
  if (!new RegExp(`^\\s*${p.icon}:\\s*\\[`, "m").test(iconsSrc)) fail(`${where}: icon "${p.icon}" does not exist in src/utils/icons.js`);
  if (!Array.isArray(p.contents)) fail(`${where}: contents must be a list`);
}
if (SITE.kofiUrl && !/^https:\/\//.test(SITE.kofiUrl)) fail("SITE.kofiUrl must start with https://");
if (!SITE.kofiUrl) warnings.push("SITE.kofiUrl is empty: the Ko-fi button is disabled");
for (const p of PROJECTS.filter((x) => x.status === "link-pending")) warnings.push(`${p.name} has no public URL yet`);

for (const w of warnings) console.log("warning:", w);
if (errors.length) {
  for (const e of errors) console.error("error:", e);
  console.error(`\n${errors.length} problem(s). Nothing was deployed.`);
  process.exit(1);
}
console.log(`ok — ${jsFiles.length} scripts, ${PROJECTS.length} projects checked.`);
