// Tarayıcı eski kopyayı göstermesin diye her yayında değişen damga.
const SURUM = '1785560457';

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
  'paintsound': {
    ad: 'paintsound',
    yol: 'works/paintsound/index.html',
    metin: 'Draw a line, hear it. The horizontal axis is time, the vertical axis is pitch. A playhead sweeps the loop and sounds every line it crosses.'
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
   Masaüstünde bu öğeler gizli. Sıra: katalogdaki işler, sonra about. */

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
