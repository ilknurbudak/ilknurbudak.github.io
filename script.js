// Tarayıcı eski kopyayı göstermesin diye her yayında değişen damga.
const SURUM = '1785170239';

const ISLER = {
  'grid': {
    ad: 'Generative Grid',
    yol: 'works/grid/index.html',
    metin: 'A grid of blue tones dissolving and reforming in bilateral symmetry. Each colour triggers its own note.'
  },
  'echo-masks': {
    ad: 'Echo Masks',
    yol: 'works/echo-masks/index.html',
    metin: 'Brush strokes accumulating along flow fields in bilateral symmetry. The brain reads them as faces.'
  },
  'kolaj': {
    ad: 'Collage Workbench',
    yol: 'works/kolaj/index.html',
    metin: 'A seeded gestural collage generator. Builds abstract prints from source images or procedural gesture layers and lays them out as collage pages.'
  },
  'canvas': {
    ad: 'CANVAS',
    yol: 'works/canvas/index.html',
    metin: 'A workbench for hand drawings. Drop a drawing in and layers turn over it — every frame is a function of time, so the loop closes seamlessly. Drop a PNG or JPG on the stage to begin.'
  },
  'paintsound': {
    ad: 'paintsound',
    yol: 'works/paintsound/index.html',
    metin: 'Draw a line, hear it. The horizontal axis is time, the vertical axis is pitch. A playhead sweeps the loop and sounds every line it crosses.'
  },
  'ink': {
    ad: 'ink',
    yol: 'works/ink/index.html',
    metin: 'A wet-ink silhouette. A drawing is read as a mask, and its interior and rim fill with blue-black ink that keeps flowing — a warped distance field running per pixel on the GPU.'
  },
  'recursive': {
    ad: 'The Recursive Human',
    yol: 'works/recursive/web/index.html',
    metin: 'A digital palimpsest installation. Four hand drawings are read as a dataset and replayed as an endless loop of coding and erasure — the viewer\'s face enters, dissolves into noise, is recognised, is overwritten, and begins again. An experience book: move through it page by page.'
  },
  'nnc': {
    ad: 'no noob color',
    yol: 'works/nnc/index.html',
    metin: 'A persona-aware colour palette tool. Extract from photographs, build and organise palettes, backed by real colour science — CIELAB, OKLab, ACES, Material 3 HCT, CIEDE2000 — behind a black and white interface.'
  }
};

const cerceve = document.getElementById('sahne-cerceve');
const dugmeler = document.querySelectorAll('.is');
const perde = document.getElementById('perde');
const perdeBaslik = document.querySelector('.perde-baslik');
const perdeMetin = document.querySelector('.perde-metin');

let acikIs = null;

function ac(anahtar) {
  const is = ISLER[anahtar];
  if (!is) return;

  acikIs = anahtar;
  cerceve.src = is.yol + '?v=' + SURUM;
  cerceve.title = is.ad;

  dugmeler.forEach(d => d.classList.toggle('acik', d.dataset.is === anahtar));
  document.getElementById('hakkinda').classList.remove('acik');
  if (typeof seritYaz === 'function') seritYaz();

  perdeBaslik.textContent = is.ad;
  perdeMetin.textContent = is.metin;

  if (location.hash.slice(1) !== anahtar) {
    history.replaceState(null, '', '#' + anahtar);
  }
}

dugmeler.forEach(d => {
  d.addEventListener('click', () => ac(d.dataset.is));
});

// perde
document.querySelector('.yardim').addEventListener('click', () => {
  const is = ISLER[acikIs];
  if (is) { perdeBaslik.textContent = is.ad; perdeMetin.textContent = is.metin; }
  perde.setAttribute('aria-hidden', 'false');
});

// about: işlerle aynı sahnede açılır, katalogda numaralanmaz
document.getElementById('hakkinda').addEventListener('click', () => {
  acikIs = null;
  cerceve.src = 'works/about/index.html?v=' + SURUM;
  cerceve.title = 'about';
  dugmeler.forEach(d => d.classList.remove('acik'));
  document.getElementById('hakkinda').classList.add('acik');
  history.replaceState(null, '', '#about');
  if (typeof seritYaz === 'function') seritYaz();
});

function perdeKapat() {
  perde.setAttribute('aria-hidden', 'true');
}

document.querySelector('.kapat').addEventListener('click', perdeKapat);
perde.addEventListener('click', e => { if (e.target === perde) perdeKapat(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') perdeKapat(); });




/* --- tablet ve telefon: kaydırmalı gezinme ------------------------------
   Masaüstünde bu öğeler gizli. Sıra: sekiz iş, sonra about. */

const SIRA = Object.keys(ISLER).concat('about');

const seritAd = document.getElementById('serit-ad');
const noktaKutu = document.getElementById('noktalar');

SIRA.forEach(() => {
  const n = document.createElement('span');
  n.className = 'nokta';
  noktaKutu.appendChild(n);
});

function seritYaz() {
  const i = suankiSira();
  const anahtar = SIRA[i];
  const ad = anahtar === 'about' ? 'about' : ISLER[anahtar].ad;
  const no = anahtar === 'about' ? '' : '<span class="no">' + String(i + 1).padStart(2, '0') + '</span>';
  seritAd.innerHTML = no + ad;
  noktaKutu.querySelectorAll('.nokta').forEach((n, j) => n.classList.toggle('acik', j === i));
}

function suankiSira() {
  const i = SIRA.indexOf(acikIs === null ? 'about' : acikIs);
  return i < 0 ? 0 : i;
}

function gecis(yon) {
  const i = (suankiSira() + yon + SIRA.length) % SIRA.length;
  const anahtar = SIRA[i];
  if (anahtar === 'about') document.getElementById('hakkinda').click();
  else ac(anahtar);
  seritYaz();
}

document.getElementById('onceki').addEventListener('click', () => gecis(-1));
document.getElementById('sonraki').addEventListener('click', () => gecis(1));

// Parmakla yana kaydırma: şerit ve ad alanı üzerinde.
// Sahnenin kendisi dinlenmiyor — orada iş çiziliyor, kaydırma onu bozardı.
const serit = document.getElementById('serit');
let basX = null, basY = null;

serit.addEventListener('touchstart', e => {
  basX = e.touches[0].clientX;
  basY = e.touches[0].clientY;
}, { passive: true });

serit.addEventListener('touchend', e => {
  if (basX === null) return;
  const dx = e.changedTouches[0].clientX - basX;
  const dy = e.changedTouches[0].clientY - basY;
  if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) gecis(dx < 0 ? 1 : -1);
  basX = basY = null;
}, { passive: true });

// Klavye okları da çalışsın.
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowLeft') gecis(-1);
  if (e.key === 'ArrowRight') gecis(1);
});

// açılış
if (location.hash.slice(1) === 'about') {
  document.getElementById('hakkinda').click();
} else {
  ac(ISLER[location.hash.slice(1)] ? location.hash.slice(1) : 'grid');
}

seritYaz();
