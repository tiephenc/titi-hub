/**
 * TITI OS — site configuration.
 *
 * Personal links and the text of the About window live here.
 * Leave a URL as "" to disable the matching button: the interface
 * then shows that the link is not configured instead of a dead button.
 */
export const SITE = {
  title: "TITI'S HUB.exe",
  os: "TITI OS",
  edition: "Digital Environment 01",
  version: "1.0.0",

  // Support page. Taken from the Kotonoha README; replace if it changes.
  kofiUrl: "https://ko-fi.com/tiephenchauvin",

  githubUrl: "https://github.com/tiephenc",
};

/**
 * About window. Only facts the owner has published elsewhere.
 * Edit freely — every field is optional except `name`.
 */
export const ABOUT = {
  name: "Titi",
  fullName: "Tiéphen Chauvin",
  intro:
    "Hi, I'm Titi. I study in the LCSA programme (Asian languages, cultures and societies) at Aix-Marseille Université, and I build the things on this desktop in my spare hours.",
  body:
    "Most of them circle around Japanese: learning it, translating it, writing about it. Each one is designed, written and maintained by one person, which is why some windows still say “coming soon”.",
  interests: [
    "Japanese language and translation",
    "Academic writing",
    "Photography, film and music",
    "Building small, careful websites",
  ],
  languages: [
    { label: "Français", note: "the language most of these sites speak" },
    { label: "日本語", note: "what most of them are about" },
    { label: "English", note: "this desktop" },
  ],
};

/** Default user preferences. Sound is always off until the visitor turns it on. */
export const DEFAULT_PREFS = {
  sound: false,
  ambient: true,
  reducedMotion: null, // null = follow the system setting
  scale: 1,
  lamp: true,
  rain: true,
  blinds: false,
  musicVolume: 0.6,
};

export const SCALE_STEPS = [0.9, 1, 1.15, 1.3];
