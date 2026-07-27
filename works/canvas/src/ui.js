const $ = (s) => document.querySelector(s);

// Ekranda görünen adlar. Anahtarlar dokunulmadı: motor kendi adlarıyla çalışıyor.
const PARAM_EN = {
  miktar:'AMOUNT', adim:'STEP', kaydir:'SHIFT', yaklas:'ZOOM', yaricap:'RADIUS',
  duzensiz:'IRREGULAR', tuylenme:'FEATHER', nefes:'BREATH', yogunluk:'DENSITY',
  uzunluk:'LENGTH', kalinlik:'WEIGHT', hiz:'SPEED', birikme:'POOLING', sik:'FREQUENCY',
  yon:'ANGLE', kir:'DIRT', tane:'GRAIN', tur:'PASSES', aci:'ANGLE', sertlik:'HARDNESS',
  ters:'INVERT', tarama:'HATCH', hucre:'CELL', boy:'SIZE', iz:'TRACE', oz:'FOLLOW',
  tekrar:'REPEAT', kaos:'CHAOS', tasma:'OVERSHOOT', sayi:'COUNT', sivrilik:'TAPER',
  yayilim:'SPREAD', yercekimi:'GRAVITY', omur:'LIFE', satir:'LINES', yazi:'TEXT',
  dagilim:'SCATTER', donme:'ROTATION', mod:'MODE', harfler:'LETTERS', kaplama:'COVERAGE',
};

const OPT_EN = {
  yok:'NONE', koyu:'DARK', 'açık':'LIGHT', kenar:'EDGE', 'fırça':'BRUSH',
  dolu:'FILL', maske:'MASK', 'ters maske':'INVERTED MASK',
  'ÇİZİM':'SOURCE', 'TAM':'FULL',
};

const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };

let state = defaultState();
let playing = false, t = 0, rafId = 0, lastTs = 0, cancelJob = false;
let textLines = [], lineIdx = 0;
let brushMode = false, brushErase = false, brushSize = 60, brushing = false;

const view = $('#view');
const vctx = view.getContext('2d', { willReadFrequently: true });

const totalFrames = () => state.seconds * state.fps;

// Önizleme, tuvalin ekranda gerçekten kapladığı piksel sayısında çizilir (Retina dahil).
function fitInfo() {
  const [FW, FH] = canvasSize(state, 1);
  const box = $('#stage').getBoundingClientRect();
  const k = Math.min((box.width - 48) / FW, (box.height - 48) / FH);
  const cssW = Math.max(64, FW * k), cssH = Math.max(64, FH * k);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let s = Math.min(1, (cssW * dpr) / FW);
  if (playing) s *= 0.55;
  return { cssW, cssH, s, FW, FH };
}

function draw() {
  const { cssW, cssH, s, FW, FH } = fitInfo();
  ensureBrush(FW, FH);
  const [W, H] = canvasSize(state, s);
  if (view.width !== W || view.height !== H) { view.width = W; view.height = H; }
  view.style.width = `${Math.round(cssW)}px`;
  view.style.height = `${Math.round(cssH)}px`;

  render(vctx, W, H, state, t);

  // Boyama modunda fırça maskesini yarı saydam göster.
  if (brushMode && brush.canvas) {
    vctx.save();
    vctx.globalAlpha = 0.4;
    vctx.globalCompositeOperation = 'screen';
    vctx.drawImage(brush.canvas, 0, 0, W, H);
    vctx.restore();
  }

  $('#scrubfill').style.width = `${t * 100}%`;
  const f = Math.floor(t * totalFrames());
  $('#frameno').textContent = `${String(f).padStart(3, '0')}/${totalFrames()}`;
  $('#outsize').textContent = `${FW}×${FH}`;
}

const resize = draw;

function loop(ts) {
  if (playing) {
    if (lastTs) t = (t + (ts - lastTs) / 1000 / state.seconds) % 1;
    lastTs = ts;
    draw();
  }
  rafId = requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// --- panel yardımcıları ---
function buildSeg(node, values, get, set) {
  node.innerHTML = '';
  for (const v of values) {
    const b = el('button', get() === v ? 'on' : '', OPT_EN[v] || String(v));
    b.onclick = () => { set(v); commit(); buildAll(); draw(); };
    node.appendChild(b);
  }
}

function slider(label, spec, get, set) {
  const row = el('div', 'row');
  const head = el('div', 'row-h');
  head.appendChild(el('span', 'row-l', label));
  const val = el('span', 'row-v', String(get()));
  head.appendChild(val);
  row.appendChild(head);
  const inp = el('input');
  inp.type = 'range'; inp.min = spec.min; inp.max = spec.max; inp.step = spec.step; inp.value = get();
  inp.oninput = () => { set(parseFloat(inp.value)); val.textContent = inp.value; draw(); };
  inp.onchange = commit;
  row.appendChild(inp);
  return row;
}

function buildSources() {
  const box = $('#sources');
  box.innerHTML = '';
  if (!sources.length) { box.appendChild(el('div', 'empty', 'NO DRAWING')); return; }
  for (const s of sources) {
    const card = el('div', 'card');
    const h = el('div', 'card-h');
    const on = el('input'); on.type = 'checkbox'; on.checked = s.on;
    on.onchange = () => { s.on = on.checked; invalidateEdges(); draw(); };
    h.appendChild(on);
    h.appendChild(el('span', 'card-n', s.name.slice(0, 18)));
    const del = el('button', 'x', '×');
    del.onclick = () => { sources.splice(sources.indexOf(s), 1); invalidateEdges(); buildSources(); draw(); };
    h.appendChild(del);
    card.appendChild(h);

    const m = el('label', 'mini');
    const mc = el('input'); mc.type = 'checkbox'; mc.checked = s.matte;
    mc.onchange = () => { s.matte = mc.checked; invalidateEdges(); draw(); };
    m.appendChild(mc); m.appendChild(el('span', null, 'KÂĞIDI AYIKLA'));
    card.appendChild(m);

    const iv = el('label', 'mini');
    const ic = el('input'); ic.type = 'checkbox'; ic.checked = s.ters;
    ic.onchange = () => { s.ters = ic.checked; invalidateEdges(); draw(); };
    iv.appendChild(ic); iv.appendChild(el('span', null, 'TERS'));
    card.appendChild(iv);

    card.appendChild(slider('THRESHOLD', { min: 0.05, max: 0.98, step: 0.01 }, () => s.esik, (v) => { s.esik = v; invalidateEdges(); }));
    card.appendChild(slider('OPACITY', { min: 0, max: 1, step: 0.01 }, () => s.opaklik, (v) => (s.opaklik = v)));

    const bl = el('select');
    for (const b of BLENDS) { const o = el('option', null, b); o.value = b; if (b === s.karisim) o.selected = true; bl.appendChild(o); }
    bl.onchange = () => { s.karisim = bl.value; draw(); };
    card.appendChild(bl);
    box.appendChild(card);
  }
}

// Katman kartındaki maske satırı: kaynak seçici + ters + yumuşaklık.
function maskRow(L) {
  const wrap = el('div', 'maskrow');
  const head = el('div', 'maskrow-h');
  head.appendChild(el('span', 'row-l', 'MASK'));
  const sel = el('select', 'msel');
  for (const o of MASK_SRC) { const n = el('option', null, o); n.value = o; if (L.mask.kaynak === o) n.selected = true; sel.appendChild(n); }
  sel.onchange = () => { L.mask.kaynak = sel.value; commit(); buildLayers(); draw(); };
  head.appendChild(sel);
  wrap.appendChild(head);

  if (maskActive(L.mask)) {
    const ters = el('label', 'mini');
    const tc = el('input'); tc.type = 'checkbox'; tc.checked = L.mask.ters;
    tc.onchange = () => { L.mask.ters = tc.checked; commit(); draw(); };
    ters.append(tc, el('span', null, 'TERS'));
    wrap.appendChild(ters);
    wrap.appendChild(slider('SOFTNESS', { min: 0, max: 1, step: 0.01 }, () => L.mask.yumusak, (v) => (L.mask.yumusak = v)));
    if (L.mask.kaynak === 'fırça') wrap.appendChild(el('div', 'hint', 'TURN ON "PAINT" ABOVE, THEN DRAW ON THE CANVAS'));
  }
  return wrap;
}

function buildLayers() {
  const box = $('#layers');
  box.innerHTML = '';
  for (const id of state.order) {
    const def = layerDef(id);
    const L = state.layers[id];
    const solo = state.solo === id;
    const card = el('div', `card k-${def.kind}${L.on ? ' on' : ''}${L.lock ? ' lock' : ''}${solo ? ' solo' : ''}`);
    card.draggable = !L.lock;
    card.dataset.id = id;

    const h = el('div', 'card-h');
    const on = el('input'); on.type = 'checkbox'; on.checked = L.on;
    on.onchange = () => { L.on = on.checked; commit(); buildLayers(); draw(); };
    h.appendChild(on);
    h.appendChild(el('span', 'card-n', def.name));
    if (def.develop) h.appendChild(el('span', 'tag', '◆')); // kaynaktan besleniyor

    const soloBtn = el('button', `micro${solo ? ' act' : ''}`, 'S');
    soloBtn.title = 'Solo this layer';
    soloBtn.onclick = (e) => { e.stopPropagation(); state.solo = solo ? null : id; buildLayers(); draw(); };
    h.appendChild(soloBtn);

    const lockBtn = el('button', `micro${L.lock ? ' act' : ''}`, L.lock ? '■' : '□');
    lockBtn.title = 'Lock: WILD and randomising leave it alone';
    lockBtn.onclick = (e) => { e.stopPropagation(); L.lock = !L.lock; commit(); buildLayers(); };
    h.appendChild(lockBtn);
    card.appendChild(h);

    if (L.on) {
      for (const k in def.p) {
        const spec = def.p[k];
        if (spec.t === 'range') {
          card.appendChild(slider((PARAM_EN[k] || k).toUpperCase(), spec, () => L.params[k], (v) => (L.params[k] = v)));
        } else if (spec.t === 'text') {
          const inp = el('input', 'txt'); inp.type = 'text'; inp.value = L.params[k];
          inp.oninput = () => { L.params[k] = inp.value; draw(); };
          inp.onchange = commit;
          card.appendChild(inp);
          if (id === 'text' && textLines.length) {
            const nav = el('div', 'linenav');
            const prev = el('button', null, '‹'), next = el('button', null, '›');
            const lab = el('span', null, `${lineIdx + 1}/${textLines.length}`);
            prev.onclick = () => { lineIdx = (lineIdx - 1 + textLines.length) % textLines.length; L.params.yazi = textLines[lineIdx]; buildLayers(); draw(); };
            next.onclick = () => { lineIdx = (lineIdx + 1) % textLines.length; L.params.yazi = textLines[lineIdx]; buildLayers(); draw(); };
            nav.append(prev, lab, next);
            card.appendChild(nav);
          }
        } else if (spec.t === 'select') {
          const sel = el('select');
          for (const o of spec.opts) { const n = el('option', null, OPT_EN[o] || o); n.value = o; if (L.params[k] === o) n.selected = true; sel.appendChild(n); }
          sel.onchange = () => { L.params[k] = sel.value; commit(); draw(); };
          card.appendChild(sel);
        }
      }
      if (def.kind !== 'frame') card.appendChild(maskRow(L));
    }
    box.appendChild(card);
  }
  enableDrag(box);
}

function enableDrag(box) {
  let dragId = null;
  box.ondragstart = (e) => { dragId = e.target.dataset.id; e.target.classList.add('drag'); };
  box.ondragend = (e) => e.target.classList.remove('drag');
  box.ondragover = (e) => e.preventDefault();
  box.ondrop = (e) => {
    e.preventDefault();
    const card = e.target.closest('.card');
    if (!card || !dragId || card.dataset.id === dragId) return;
    const from = state.order.indexOf(dragId), to = state.order.indexOf(card.dataset.id);
    state.order.splice(to, 0, state.order.splice(from, 1)[0]);
    commit(); buildLayers(); draw();
  };
}

function buildShelf() {
  const box = $('#shelf');
  box.innerHTML = '';
  snapshots.forEach((s, i) => {
    const b = el('button', `slot${s ? ' full' : ''}`, String(i + 1));
    b.title = s ? 'Click: recall · Shift+click: overwrite' : 'Click: store this state';
    b.onclick = (e) => {
      if (!s || e.shiftKey) { snapshots[i] = snap(state); }
      else { state = migrate(JSON.parse(s)); commit(); buildAll(); draw(); }
      buildShelf();
    };
    box.appendChild(b);
  });
}

function buildAll() {
  buildSeg($('#aspect'), Object.keys(ASPECTS), () => state.aspect, (v) => (state.aspect = v));
  buildSeg($('#res'), RESOS, () => state.res, (v) => { state.res = v; invalidateEdges(); });
  buildSeg($('#bg'), ['ak', 'kara', 'saydam'], () => state.bg, (v) => (state.bg = v));
  buildSeg($('#durations'), [6, 12, 18, 24], () => state.seconds, (v) => (state.seconds = v));
  buildSeg($('#fpsseg'), [12, 24], () => state.fps, (v) => (state.fps = v));
  $('#boilon').checked = state.boil.on;
  buildSources();
  buildLayers();
  buildShelf();
}

const commit = () => pushHistory(state);

// --- girdi ---
$('#boilon').onchange = (e) => { state.boil.on = e.target.checked; commit(); draw(); };
$('#seedbtn').onclick = () => { state.seed = Math.floor(Math.random() * 1e6); invalidateEdges(); commit(); $('#status').textContent = `SEED ${state.seed}`; kunyeYaz(); draw(); };

$('#wild').onclick = () => {
  const r = Math.random;
  state.seed = Math.floor(r() * 1e6);
  for (const L of LAYERS) {
    const s = state.layers[L.id];
    if (s.lock) continue; // kilitli katmana dokunma
    s.on = L.off ? false : r() < 0.45;
    for (const k in L.p) {
      const spec = L.p[k];
      if (spec.t === 'range') s.params[k] = spec.min + r() * (spec.max - spec.min);
      else if (spec.t === 'select') s.params[k] = spec.opts[Math.floor(r() * spec.opts.length)];
    }
  }
  invalidateEdges(); commit(); buildAll(); draw();
  $('#status').textContent = 'WILD · CMD+Z TO UNDO';
};

$('#play').onclick = () => {
  playing = !playing; lastTs = 0;
  $('#play').textContent = playing ? 'STOP' : 'PLAY';
  $('#play').classList.toggle('solid', playing);
  draw();
};

// --- fırça boyama ---
$('#brushmode').onchange = (e) => {
  brushMode = e.target.checked;
  $('#stage').classList.toggle('brush', brushMode);
  if (brushMode) { playing = false; $('#play').textContent = 'PLAY'; }
  draw();
};
$('#brushclear').onclick = () => { clearBrush(); draw(); };
$('#brushinv').onclick = () => {
  if (!brush.ctx) return;
  const img = brush.ctx.getImageData(0, 0, brush.W, brush.H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = 255 - d[i]; d[i] = d[i + 1] = d[i + 2] = v; }
  brush.ctx.putImageData(img, 0, 0); draw();
};

function brushAt(e) {
  const r = view.getBoundingClientRect();
  const u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
  ensureBrush(...canvasSize(state, 1));
  const x = u * brush.W, y = v * brush.H;
  const rad = (brushSize / 1080) * Math.max(brush.W, brush.H);
  brush.ctx.fillStyle = brushErase ? '#000' : '#fff';
  brush.ctx.beginPath(); brush.ctx.arc(x, y, rad, 0, Math.PI * 2); brush.ctx.fill();
  draw();
}

// --- transport ---
const scrub = $('#scrub');
let scrubbing = false;
const setT = (e) => {
  const r = scrub.getBoundingClientRect();
  t = clamp((e.clientX - r.left) / r.width, 0, 0.9999);
  draw();
};
scrub.onmousedown = (e) => { scrubbing = true; playing = false; $('#play').textContent = 'PLAY'; setT(e); };

view.addEventListener('mousedown', (e) => { if (brushMode) { brushErase = e.shiftKey || e.button === 2; brushing = true; brushAt(e); } });
view.addEventListener('contextmenu', (e) => brushMode && e.preventDefault());
view.addEventListener('wheel', (e) => { if (!brushMode) return; e.preventDefault(); brushSize = clamp(brushSize * (e.deltaY < 0 ? 1.12 : 0.89), 6, 400); draw(); }, { passive: false });

window.addEventListener('mousemove', (e) => {
  if (scrubbing) setT(e);
  else if (brushing) brushAt(e);
});
window.addEventListener('mouseup', () => { scrubbing = false; brushing = false; });

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' && e.target.type === 'text') return;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    const s = e.shiftKey ? redo() : undo(state);
    if (s) { state = migrate(s); buildAll(); draw(); }
    return;
  }
  if (e.code === 'Space') { e.preventDefault(); $('#play').click(); }
  if (e.key === 'Escape' && state.solo) { state.solo = null; buildLayers(); draw(); }
  if (e.key >= '1' && e.key <= '6') $('#shelf').children[+e.key - 1]?.click();
});

// --- dosya bırakma ---
const stage = $('#stage');
['dragenter', 'dragover'].forEach((ev) => stage.addEventListener(ev, (e) => { e.preventDefault(); if (!brushMode) stage.classList.add('hot'); }));
['dragleave', 'drop'].forEach((ev) => stage.addEventListener(ev, () => stage.classList.remove('hot')));
stage.addEventListener('drop', async (e) => {
  e.preventDefault();
  if (brushMode) return;
  for (const f of e.dataTransfer.files) {
    if (f.type.startsWith('image/')) {
      const img = new Image();
      img.src = URL.createObjectURL(f);
      await img.decode();
      // İzleyici kendi çizimini bıraktığında açılıştaki örnek kapanır.
      for (const o of sources) if (o.name === 'ornek.png') o.on = false;
      addSource(img, f.name);
      $('#drop').hidden = true;
      $('#status').textContent = `${sources.length} DRAWING(S)`;
    } else if (f.name.endsWith('.txt')) {
      textLines = (await f.text()).split('\n').map((l) => l.trim()).filter(Boolean);
      lineIdx = 0;
      if (textLines.length) { state.layers.text.params.yazi = textLines[0]; state.layers.text.on = true; }
      $('#status').textContent = `${textLines.length} TEXT LINES`;
    }
  }
  invalidateEdges(); buildAll(); resize(); draw();
});

// --- kayıt ---
const overlay = $('#overlay');
function progress(pct, label) {
  $('#ovsub').textContent = `${Math.round(pct * 100)}%`;
  if (label) $('#ovtitle').textContent = label;
  const cells = 24, full = Math.round(pct * cells);
  $('#pac').innerHTML = '';
  for (let i = 0; i < cells; i++) $('#pac').appendChild(el('i', i < full ? 'f' : ''));
}
$('#ovcancel').onclick = () => (cancelJob = true);

const blobOf = (canvas) => new Promise((res) => canvas.toBlob(res, 'image/png'));

async function saveStill() {
  const c = renderFrame(state, t);
  const blob = await blobOf(c);
  const r = await fetch(`/api/still`, { method: 'POST', body: blob });
  const j = await r.json();
  $('#status').textContent = `SAVED · ${j.name}`;
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

async function saveSequence(fmt) {
  cancelJob = false;
  overlay.hidden = false;
  const total = totalFrames();
  const [FW, FH] = canvasSize(state, 1);
  const job = (await (await fetch('/api/begin', { method: 'POST' })).json()).job;
  const t0 = performance.now();
  for (let i = 0; i < total; i++) {
    if (cancelJob) { overlay.hidden = true; $('#status').textContent = 'CANCELLED'; return; }
    const c = renderFrame(state, i / total);
    const blob = await blobOf(c);
    await fetch(`/api/frame?job=${job}&i=${i}`, { method: 'POST', body: blob });
    const done = i + 1;
    const kalan = ((performance.now() - t0) / done) * (total - done) / 1000;
    progress(i / total, `${FW}×${FH}  ·  ${done}/${total}  ·  ${mmss(kalan)}`);
    await new Promise((r) => setTimeout(r, 0));
  }
  progress(1, fmt === 'png' ? 'FOLDERING' : 'ENCODING');
  const r = await fetch(`/api/finalize?job=${job}&fps=${state.fps}&fmt=${fmt}`, { method: 'POST' });
  const j = await r.json();
  overlay.hidden = true;
  if (!r.ok) { $('#status').textContent = `ERROR: ${j.error || '?'}`; return; }
  $('#status').textContent = `WRITTEN TO DESKTOP · ${j.name}`;
  if (fmt === 'mp4') { const a = el('a'); a.href = j.url; a.download = j.name; a.click(); }
}

$('#savepng').onclick = saveStill;
$('#savemp4').onclick = () => saveSequence('mp4');
$('#saveprores').onclick = () => saveSequence('prores');
$('#saveseq').onclick = () => saveSequence('png');

window.addEventListener('resize', () => { resize(); draw(); });

// --- açılış ---
state.layers.scribble.on = true;
state.layers.wet.on = true;
commit();
buildAll();
resize();
draw();


/* --- künye --- */
function kunyeYaz() {
  const k = document.getElementById('kunye');
  if (!k) return;
  const acik = state.order.filter((id) => state.layers[id].on).length;
  k.querySelector('.model').textContent = acik + ' LAYERS';
  k.querySelector('.seed').textContent = 'SEED ' + state.seed;
}
kunyeYaz();


/* --- açılış çizimi ---
   Site kopyası boş açılmasın: örnek bir çizim yüklü gelir.
   İzleyici üstüne kendi görselini bıraktığında bu kaynak kapanır. */
(async () => {
  try {
    const img = new Image();
    img.src = 'assets/ornek.png';
    await img.decode();
    addSource(img, 'ornek.png');
    document.querySelector('#drop').hidden = true;
    document.querySelector('#status').textContent = '1 DRAWING(S)';
    invalidateEdges(); buildAll(); resize(); draw(); kunyeYaz();
  } catch (e) {
    /* görsel yoksa tezgâh boş açılır, sürükleme yine çalışır */
  }
})();
