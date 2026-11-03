/**
 * User preferences: a tiny observable store persisted to localStorage.
 * Sound always starts off; reducedMotion = null means "follow the system".
 */
import { DEFAULT_PREFS, SCALE_STEPS } from "../../config/settings.js";
import { load, save, remove } from "./storage.js";

const systemReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

function sanitise(raw) {
  const p = { ...DEFAULT_PREFS, ...(raw && typeof raw === "object" ? raw : {}) };
  p.sound = p.sound === true;
  p.ambient = p.ambient !== false;
  p.lamp = p.lamp !== false;
  p.reducedMotion = typeof p.reducedMotion === "boolean" ? p.reducedMotion : null;
  p.scale = SCALE_STEPS.includes(p.scale) ? p.scale : 1;
  return p;
}

export function createPrefs() {
  let state = sanitise(load("prefs", null));
  const listeners = new Set();

  const api = {
    get: () => ({ ...state }),
    set(patch) {
      state = sanitise({ ...state, ...patch });
      save("prefs", state);
      listeners.forEach((fn) => fn(api.get()));
    },
    reset() {
      remove("prefs");
      state = sanitise(null);
      listeners.forEach((fn) => fn(api.get()));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /** The motion setting actually in effect. */
    reduced: () => (state.reducedMotion === null ? systemReduced.matches : state.reducedMotion),
    systemReduced: () => systemReduced.matches,
  };

  systemReduced.addEventListener?.("change", () => listeners.forEach((fn) => fn(api.get())));
  return api;
}
