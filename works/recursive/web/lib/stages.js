// Single source of truth for the whole project.
// Add a stage or an experiment here and every page picks it up. This is what keeps
// the architecture continuable: data here, behaviour in engine.js, pages stay thin.

export const STAGES = [
  {
    n: "01", id: "01_raw_noise", title: "Raw Noise",
    role: "Raw input — chance and noise",
    note: "The viewer's face is dissolved into yellow lines. Chance and noise as raw input.",
    camera: "edges",
    ink: [{ colour: "yellow", rgb: [245, 214, 70], width: 2.2, alpha: 0.55 }],
    audio: [0.05, 0.10, 0.32, 0.18],
  },
  {
    n: "02", id: "02_structural_recognition", title: "Structural Recognition",
    role: "Processing — a face is read out of the chaos",
    note: "Bone-white machine strokes write a face over the noise. Recognition as projection.",
    camera: "none",
    ink: [{ colour: "black", rgb: [228, 224, 214], width: 2.0, alpha: 0.85 }],
    audio: [0.10, 0.30, 0.12, 0.10],
  },
  {
    n: "03", id: "03_palimpsest_layer", title: "Palimpsest Layer",
    role: "Layering — new paint deforms the old face",
    note: "Erasure as a generative act. The layer warps and overwrites the face.",
    camera: "warp",
    ink: [
      { colour: "black", rgb: [228, 224, 214], width: 2.0, alpha: 0.7 },
      { colour: "green", rgb: [150, 200, 90], width: 3.0, alpha: 0.8 },
    ],
    audio: [0.22, 0.22, 0.06, 0.14],
  },
  {
    n: "04", id: "04_recursive_human", title: "Recursive Human",
    role: "Output — order within chaos; the eyes look back",
    note: "A black flood; only the eyes look out. Self-monitoring inside the noise.",
    camera: "eyes",
    ink: [{ colour: "black", rgb: [206, 204, 198], width: 1.8, alpha: 0.9 }],
    audio: [0.40, 0.10, 0.03, 0.26],
  },
];

export const STAGE_SECONDS = 11;

export function byId(id) { return STAGES.find(s => s.id === id); }
export function byN(n) { return STAGES.find(s => s.n === n); }

// The book: every navigable page in the experience, in order.
export const PAGES = [
  { href: "index.html", label: "Cover" },
  { href: "dataset.html", label: "Dataset" },
  { href: "stage.html?s=01", label: "1 · Raw Noise" },
  { href: "stage.html?s=02", label: "2 · Recognition" },
  { href: "stage.html?s=03", label: "3 · Palimpsest" },
  { href: "stage.html?s=04", label: "4 · Recursive Human" },
  { href: "loop.html", label: "The Loop" },
  { href: "edit.html", label: "The Edit" },
];
