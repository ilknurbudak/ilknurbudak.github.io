// Tek gerçek: aşağıdaki nesne. Başka hiçbir yerde saklı bilgi yok.
// Bu nesne + aynı çizim = her zaman aynı video.

const R = (min, max, step, def) => ({ t: 'range', min, max, step, def });
const B = (def) => ({ t: 'bool', def });
const T = (def) => ({ t: 'text', def });
const S = (opts, def) => ({ t: 'select', opts, def });

// kind: pixel  -> ImageData üzerinde çalışır
//       vector -> yol çizer, pikselden sonra biner
//       glyph  -> altındakini okur, yerine harf koyar
//       frame  -> kadrajın kendisini oynatır
// develop: bu araç kaynağın kendi malzemesini işler, üstüne yeni şey eklemez.
const LAYERS = [
  {
    id: 'jitter', name: 'PAPER JITTER', kind: 'frame',
    p: { miktar: R(0, 30, 0.5, 8), adim: R(2, 24, 1, 8) },
  },
  {
    id: 'drift', name: 'FRAME DRIFT', kind: 'frame',
    p: { kaydir: R(0, 240, 1, 50), yaklas: R(0, 0.4, 0.01, 0.1) },
  },

  // --- MÜREKKEP: üç ayrı araç ---
  {
    id: 'wet', name: 'WET BLEED', kind: 'pixel', develop: true,
    p: { yaricap: R(1, 20, 0.5, 5), duzensiz: R(0, 1, 0.01, 0.6), tuylenme: R(0, 1, 0.01, 0.45), nefes: R(0, 1, 0.01, 0.4) },
  },
  {
    id: 'inkflow', name: 'INK FLOW', kind: 'vector', develop: true,
    p: { yogunluk: R(0, 1, 0.01, 0.5), uzunluk: R(0.05, 1, 0.01, 0.4), kalinlik: R(0.3, 8, 0.1, 2), hiz: R(0, 1, 0.01, 0.5), birikme: R(0, 1, 0.01, 0.4) },
  },
  {
    id: 'drybrush', name: 'DRY BRUSH', kind: 'pixel', develop: true,
    p: { miktar: R(0, 1, 0.01, 0.5), sik: R(1, 40, 0.5, 10), yon: R(0, 180, 1, 0), kir: R(0, 1, 0.01, 0.3) },
  },

  {
    id: 'erode', name: 'EROSION', kind: 'pixel', develop: true,
    p: { miktar: R(0, 1, 0.01, 0.55), sik: R(2, 40, 1, 14) },
  },
  {
    id: 'grunge', name: 'GRIME', kind: 'pixel',
    p: { miktar: R(0, 1, 0.01, 0.5), sik: R(1, 40, 0.5, 8), tane: R(0, 1, 0.01, 0.35) },
  },
  {
    id: 'copygen', name: 'PHOTOCOPY DECAY', kind: 'pixel', develop: true,
    p: { tur: R(1, 8, 1, 4), kir: R(0, 1, 0.01, 0.45) },
  },
  {
    id: 'halftone', name: 'HALFTONE', kind: 'pixel', develop: true,
    p: { sik: R(2, 24, 1, 6), aci: R(0, 90, 1, 45), sertlik: R(0, 1, 0.01, 0.85) },
  },
  {
    id: 'cut', name: 'HARD CUT', kind: 'pixel',
    p: { adim: R(2, 48, 1, 12), kaydir: R(0, 0.5, 0.005, 0.14), ters: R(0, 1, 0.01, 0.2), tarama: R(0, 32, 1, 0) },
  },
  {
    id: 'shatter', name: 'SHATTER', kind: 'pixel',
    p: { hucre: R(8, 200, 1, 48), kaydir: R(0, 1, 0.01, 0.4), adim: R(1, 24, 1, 6) },
  },
  {
    id: 'sabotage', name: 'SABOTAGE', kind: 'pixel',
    p: { yogunluk: R(0, 1, 0.01, 0.25), boy: R(4, 200, 1, 50), adim: R(1, 24, 1, 8) },
  },

  {
    id: 'redraw', name: 'REDRAWN LINE', kind: 'vector', develop: true,
    p: { yogunluk: R(0.02, 1, 0.01, 0.45), uzunluk: R(2, 40, 1, 12), kalinlik: R(0.5, 8, 0.1, 1.8), iz: R(0, 1, 0.01, 0.4) },
  },

  // KARALAMA — "develop": kaynağın kendi çizgilerini/kütlesini karalar.
  // oz=1: çizgiyi takip edip üstünden geçer. oz=0: kütleyi doldurur.
  {
    id: 'scribble', name: 'SCRIBBLE', kind: 'vector', develop: true,
    p: {
      oz: R(0, 1, 0.01, 0.7), yogunluk: R(0, 1, 0.01, 0.5),
      uzunluk: R(0.2, 4, 0.05, 1.4), kalinlik: R(0.3, 10, 0.1, 1.8),
      tekrar: R(1, 8, 1, 3), kaos: R(0, 1, 0.01, 0.55), tasma: R(0, 1, 0.01, 0.3),
      iz: R(0, 1, 0.01, 0.35),
    },
  },
  {
    id: 'splash', name: 'SPLASH', kind: 'vector',
    p: { sayi: R(1, 120, 1, 28), uzunluk: R(0.1, 2.5, 0.01, 1), kalinlik: R(0.3, 40, 0.1, 9), sivrilik: R(0, 1, 0.01, 0.85), yayilim: R(0, 1, 0.01, 0.6) },
  },
  {
    id: 'drip', name: 'DRIP', kind: 'vector',
    p: { sayi: R(1, 80, 1, 18), uzunluk: R(0.02, 0.9, 0.01, 0.4), kalinlik: R(0.3, 12, 0.1, 2), hiz: R(0, 1, 0.01, 0.5) },
  },
  {
    id: 'particles', name: 'PARTICLE', kind: 'vector',
    p: { sayi: R(10, 900, 10, 220), boy: R(1, 14, 0.5, 2.5), yercekimi: R(-1, 1, 0.01, 0.35), omur: R(0.05, 1, 0.01, 0.4), yayilim: R(0, 1, 0.01, 0.6) },
    off: true, // kural gereği varsayılan kapalı
  },
  {
    id: 'asemic', name: 'ASEMIC WRITING', kind: 'glyph',
    p: { satir: R(1, 24, 1, 6), yogunluk: R(2, 40, 1, 14), kalinlik: R(0.3, 8, 0.1, 1.6), boy: R(0.2, 3, 0.05, 1) },
  },
  {
    id: 'text', name: 'TEXT', kind: 'glyph',
    p: {
      yazi: T('SCRIBBLE'), boy: R(8, 300, 1, 80), dagilim: R(0, 1, 0.01, 0.5),
      donme: R(0, 1, 0.01, 0.3), mod: S(['dolu', 'maske', 'ters maske'], 'dolu'),
    },
  },
  {
    id: 'ascii', name: 'LETTER TEXTURE', kind: 'glyph',
    p: { hucre: R(4, 40, 1, 10), harfler: T(' ilcvxzsyoahkbdpqwmMWB'), kaplama: R(0, 1, 0.01, 1) },
  },
];

const ASPECTS = { 'ÇİZİM': null, '1:1': 1, '9:16': 9 / 16, '16:9': 16 / 9 };
const RESOS = ['1080', '1440', '2160', 'TAM'];
const RES_CAP = 6000; // h264/ProRes ve tarayıcı tuvali için üst sınır
const BLENDS = ['source-over', 'multiply', 'screen', 'difference', 'lighten', 'darken'];

// Maske kaynağı: efektin nereye uygulanacağını sınırlar.
const MASK_SRC = ['yok', 'koyu', 'açık', 'kenar', 'fırça'];

function defaultMask() {
  return { kaynak: 'yok', ters: false, yumusak: 0.3 };
}

function defaultState() {
  const layers = {};
  for (const L of LAYERS) {
    const params = {};
    for (const k in L.p) params[k] = L.p[k].def;
    layers[L.id] = { on: false, lock: false, params, mask: defaultMask() };
  }
  return {
    seed: 1337,
    seconds: 12,
    fps: 24,
    aspect: 'ÇİZİM',
    res: 'TAM', // TAM = çizimin kendi çözünürlüğü
    bg: 'ak', // ak | kara | saydam
    boil: { on: false, miktar: 3 },
    solo: null, // tek başına izlenen katman id'si
    order: LAYERS.map((L) => L.id),
    layers,
  };
}

const layerDef = (id) => LAYERS.find((L) => L.id === id);

// Kaynak görselleri state'in dışında tutuyoruz: seri hale gelmiyorlar.
const sources = []; // {id, name, img, on, matte, esik, ters, opaklik, karisim}

function addSource(img, name) {
  sources.push({
    id: Math.random().toString(36).slice(2, 8),
    name, img, on: true,
    matte: true, esik: 0.62, ters: false, opaklik: 1, karisim: 'source-over',
  });
}

// Fırça maskesi: elle boyanan alan. State dışı (el girdisi), 1080 referans ölçeğinde tutulur.
const brush = { canvas: null, ctx: null, W: 0, H: 0 };
function ensureBrush(W, H) {
  if (brush.W === W && brush.H === H && brush.canvas) return;
  const old = brush.canvas;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); // siyah = maske dışı
  if (old) ctx.drawImage(old, 0, 0, W, H); // yeniden ölçekle
  brush.canvas = c; brush.ctx = ctx; brush.W = W; brush.H = H;
}
function clearBrush() {
  if (!brush.ctx) return;
  brush.ctx.fillStyle = '#000';
  brush.ctx.fillRect(0, 0, brush.W, brush.H);
}

// --- geçmiş ---
const history = { past: [], future: [], limit: 60 };
const snapshots = [null, null, null, null, null, null];

const snap = (s) => JSON.stringify(s);

function pushHistory(s) {
  const j = snap(s);
  if (history.past[history.past.length - 1] === j) return;
  history.past.push(j);
  if (history.past.length > history.limit) history.past.shift();
  history.future.length = 0;
}

function undo(s) {
  if (history.past.length < 2) return null;
  history.future.push(history.past.pop());
  return JSON.parse(history.past[history.past.length - 1]);
}

function redo() {
  if (!history.future.length) return null;
  const j = history.future.pop();
  history.past.push(j);
  return JSON.parse(j);
}

// Eski snapshot'larda yeni alanlar eksik olabilir: doldur.
function migrate(s) {
  if (!s.layers) return s;
  if (!('solo' in s)) s.solo = null;
  for (const id in s.layers) {
    const L = s.layers[id];
    if (!('lock' in L)) L.lock = false;
    if (!L.mask) L.mask = defaultMask();
    const def = layerDef(id);
    if (def) for (const k in def.p) if (!(k in L.params)) L.params[k] = def.p[k].def;
  }
  return s;
}
