// Boru hattı. Önizleme ve çıktı aynı koddan geçer; tek fark ölçek.
// 47. kareyi görmek için 46 kareyi çizmek gerekmez: her kare doğrudan hesaplanır.

// Kaynak analizini (kenarlar + koyu noktalar) kaynak/boyut değişene dek saklar.
// "develop" araçları buradan beslenir: karalama, mürekkep akması, yeniden çizim.
let srcCache = { key: '', edges: null, sites: null };
const invalidateEdges = () => { srcCache.key = ''; };

function baseLength(state) {
  if (state.res !== 'TAM') return parseInt(state.res, 10);
  const src = sources.find((s) => s.on);
  if (!src) return 1080;
  return clamp(Math.max(src.img.width, src.img.height), 256, RES_CAP);
}

function canvasSize(state, scale) {
  const BASE = baseLength(state);
  let ratio = ASPECTS[state.aspect];
  if (ratio === null) {
    const src = sources.find((s) => s.on);
    ratio = src ? src.img.width / src.img.height : 1;
  }
  let w, h;
  if (ratio >= 1) { w = BASE; h = Math.round(BASE / ratio); }
  else { h = BASE; w = Math.round(BASE * ratio); }
  w = Math.max(2, Math.round(w * scale)); h = Math.max(2, Math.round(h * scale));
  return [w - (w % 2), h - (h % 2)];
}

const palette = (state) =>
  state.bg === 'kara' ? { bg: '#000', ink: '#fff' }
    : state.bg === 'saydam' ? { bg: 'transparent', ink: '#000' }
      : { bg: '#fff', ink: '#000' };

function drawSources(ctx, W, H, state, t, U) {
  const J = state.layers.jitter, D = state.layers.drift;
  ctx.save();
  if (D.on) {
    const a = 2 * Math.PI * t;
    const z = 1 + D.params.yaklas * (1 - Math.cos(a)) / 2;
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    ctx.translate(Math.cos(a) * D.params.kaydir * U, Math.sin(a) * D.params.kaydir * U);
  }
  if (J.on) {
    const step = Math.floor(t * J.params.adim) % Math.round(J.params.adim);
    ctx.translate(
      (hash2(step, 1, state.seed) - 0.5) * 2 * J.params.miktar * U,
      (hash2(step, 2, state.seed) - 0.5) * 2 * J.params.miktar * U,
    );
  }
  for (const s of sources) {
    if (!s.on) continue;
    const iw = s.img.width, ih = s.img.height;
    const k = Math.min(W / iw, H / ih);
    const dw = iw * k, dh = ih * k;
    const dx = (W - dw) / 2, dy = (H - dh) / 2;
    if (s.matte) {
      const off = document.createElement('canvas');
      off.width = Math.max(1, Math.round(dw)); off.height = Math.max(1, Math.round(dh));
      const oc = off.getContext('2d', { willReadFrequently: true });
      oc.drawImage(s.img, 0, 0, off.width, off.height);
      matteSource(oc, off.width, off.height, s.esik, s.ters);
      ctx.globalAlpha = s.opaklik; ctx.globalCompositeOperation = s.karisim;
      ctx.drawImage(off, dx, dy);
    } else {
      ctx.globalAlpha = s.opaklik; ctx.globalCompositeOperation = s.karisim;
      if (s.ters) ctx.filter = 'invert(1)';
      ctx.drawImage(s.img, dx, dy, dw, dh);
      ctx.filter = 'none';
    }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function render(ctx, W, H, state, t) {
  const { bg, ink } = palette(state);
  const U = Math.max(W, H) / 1080;
  const boil = state.boil.on ? state.boil.miktar * U : 0;
  const clear = bg === 'transparent';

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (!clear) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); }

  drawSources(ctx, W, H, state, t, U);

  // Kaynak görüntüsü (piksel katmanlarından önce): maske + develop araçları buradan besleniyor.
  const srcImg = ctx.getImageData(0, 0, W, H);

  const activeIds = state.solo ? [state.solo] : state.order;
  const isOn = (id) => state.layers[id].on && (!state.solo || id === state.solo);

  const needSrc = activeIds.some((id) => isOn(id) && ['redraw', 'scribble', 'inkflow'].includes(id));
  if (needSrc) {
    const key = sources.map((s) => `${s.id}${s.on}${s.matte}${s.esik}${s.ters}`).join('|') + `${W}x${H}${state.aspect}${state.seed}`;
    if (srcCache.key !== key) {
      srcCache = { key, edges: extractEdgesFrom(srcImg.data, W, H), sites: darkSitesFrom(srcImg.data, W, H) };
    }
  }
  const src = { edges: srcCache.edges, sites: srcCache.sites };

  ctx.strokeStyle = ink; ctx.fillStyle = ink;

  // Bir ya da birden çok piksel katmanını, saydam-zemin sarmalıyla data üstünde çalıştırır.
  const runPixels = (data, ids) => {
    if (clear) for (let i = 0; i < data.length; i += 4) { setGray(data, i, 1 - data[i + 3] / 255); data[i + 3] = 255; }
    for (const id of ids) PIXEL_OPS[id](data, W, H, t, state.layers[id].params, state.seed, U);
    if (clear) for (let i = 0; i < data.length; i += 4) { const a = 1 - lumAt(data, i); setGray(data, i, 0); data[i + 3] = a * 255; }
  };

  const run = [];
  const flush = () => {
    if (!run.length) return;
    const img = ctx.getImageData(0, 0, W, H);
    runPixels(img.data, run);
    ctx.putImageData(img, 0, 0);
    run.length = 0;
  };

  const maskFor = (L) => buildMask(L.mask, srcImg, W, H, U);

  const drawVectorGlyph = (id, def, target) => {
    target.strokeStyle = ink; target.fillStyle = ink;
    if (def.kind === 'vector') VECTOR_OPS[id](target, W, H, t, state.layers[id].params, state.seed, boil, U, src);
    else GLYPH_OPS[id](target, W, H, t, state.layers[id].params, state.seed, ink, bg, U);
  };

  for (const id of activeIds) {
    if (!isOn(id)) continue;
    const def = layerDef(id);
    if (def.kind === 'frame') continue; // kaynak çizilirken uygulandı
    const L = state.layers[id];
    const hasMask = maskActive(L.mask);

    if (def.kind === 'pixel') {
      if (!hasMask) { run.push(id); continue; }
      flush();
      const img = ctx.getImageData(0, 0, W, H);
      const before = new Uint8ClampedArray(img.data);
      runPixels(img.data, [id]);
      applyPixelMask(img, before, maskFor(L), W, H);
      ctx.putImageData(img, 0, 0);
      continue;
    }

    flush();
    if (!hasMask) {
      drawVectorGlyph(id, def, ctx);
    } else {
      const buf = document.createElement('canvas');
      buf.width = W; buf.height = H;
      const bx = buf.getContext('2d', { willReadFrequently: true });
      drawVectorGlyph(id, def, bx);
      applyLayerMask(bx, maskFor(L), W, H);
      ctx.drawImage(buf, 0, 0);
    }
  }
  flush();
}

function renderFrame(state, t) {
  const [W, H] = canvasSize(state, 1);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  render(ctx, W, H, state, t);
  return c;
}
