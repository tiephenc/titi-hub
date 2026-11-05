/**
 * TITI OS — application registry.
 *
 * This is the ONLY place where project data and project URLs live.
 * Add, edit or remove an entry here and the desktop, the start menu,
 * the file explorer and the taskbar all follow automatically.
 *
 * status:
 *   "online"            → the URL is public and verified. Shows OPEN APPLICATION.
 *   "link-pending"      → the project exists but its public address is not set yet.
 *                         No launch button is shown until `url` is filled in
 *                         and the status is switched to "online".
 *   "under-development" → not published. Shows the UNDER DEVELOPMENT screen.
 *   "coming-soon"       → not published. Shows the COMING SOON screen.
 *
 * icon:     key of a pixel icon in src/utils/icons.js
 * accent:   project colour, used for its window chrome and splash
 * splash:   which small visual identity to draw in the preview window
 *           (see src/components/apps.js → SPLASHES)
 */
export const PROJECTS = [
  {
    id: "bam",
    name: "BAM",
    file: "bam.app",
    tagline: "Personal academic publication space",
    description:
      "A quiet place to publish academic work: seminar notes, reports, reflections and everything in between.",
    contents: [
      "Séminaires / ゼミ",
      "Comptes rendus / 報告",
      "Réflexions / 考察",
      "Divers / その他",
    ],
    url: "https://tiephen.neocities.org/BAM/",
    status: "online",
    icon: "bam",
    accent: "#C49B70",
    splash: "editorial",
  },
  {
    id: "tradlab",
    name: "TRAD/LAB",
    file: "tradlab.app",
    tagline: "Japanese translation & linguistics lab",
    description:
      "A collaborative platform for translating Japanese together and doing linguistic research out loud.",
    contents: [
      "Collective translation projects",
      "Annotations",
      "Vocabulary",
      "Educational resources",
      "Collaborative workshops",
    ],
    url: "https://trad-lab.pages.dev/",
    status: "online",
    icon: "tradlab",
    accent: "#78949A",
    splash: "lab",
  },
  {
    id: "agora",
    name: "AGORA",
    file: "agora.app",
    tagline: "For students of the LCSA Master's programme",
    description:
      "A shared space for LCSA Master's students to exchange feedback, review courses and help each other out.",
    contents: [
      "Student feedback",
      "Course reviews",
      "Information sharing",
      "Student collaboration",
    ],
    url: "",
    status: "under-development",
    icon: "agora",
    accent: "#94A08C",
    splash: "columns",
  },
  {
    id: "kotonoha",
    name: "KOTONOHA",
    file: "kotonoha.app",
    tagline: "言の葉 — learn Japanese from N4 to N2",
    description:
      "An immersive Japanese-learning platform that walks learners from JLPT N4 to N2, in French. Installable, and it works offline.",
    contents: [
      "Grammar lessons",
      "Vocabulary",
      "Kanji",
      "Reading comprehension",
      "Listening comprehension",
      "Exercises",
      "Spaced repetition",
      "JLPT mock examinations",
      "Learning progress",
    ],
    url: "https://tiephenc.github.io/kotonoha/",
    status: "online",
    icon: "kotonoha",
    accent: "#8FA68E",
    splash: "genko",
  },
  {
    id: "malssi",
    name: "MALSSI",
    file: "malssi.app",
    tagline: "말씨 — learn Korean from hangeul to TOPIK II",
    description:
      "KOTONOHA's sister site, for Korean: a path of units from hangeul to TOPIK II, in French, with spaced repetition and vocabulary checked against the Korean basic dictionary. Installable, and it works offline.",
    contents: [
      "Hangeul",
      "Units from 1급 to 6급",
      "Spaced repetition (FSRS)",
      "Verified vocabulary",
      "Anki deck import",
      "Focus timer",
      "Works offline",
    ],
    url: "https://tiephenc.github.io/MALSSI/",
    status: "online",
    icon: "malssi",
    accent: "#2F5D8A",
    splash: "magpie",
  },
  {
    id: "room",
    name: "TITI'S ROOM",
    file: "titis_room.app",
    tagline: "A personal website and creative space",
    description:
      "The room where the personal things will live: photographs, writing, films, music and experiments.",
    contents: [
      "Photography",
      "Personal writing",
      "Film",
      "Music",
      "Creative experiments",
      "Personal projects",
      "Discoveries and interests",
    ],
    url: "",
    status: "coming-soon",
    icon: "room",
    accent: "#B8958A",
    splash: "door",
    personal: true,
  },
];

/** Human labels for each status, used in chips, the explorer and the start menu. */
export const STATUS_LABELS = {
  online: "Online",
  "link-pending": "Link pending",
  "under-development": "Under development",
  "coming-soon": "Coming soon",
};

/** A project can be launched only when it is online AND has an https URL. */
export function isLaunchable(project) {
  return project.status === "online" && /^https:\/\//.test(project.url || "");
}
