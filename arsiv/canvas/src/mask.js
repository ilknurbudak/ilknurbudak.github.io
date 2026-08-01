// Maske: bir efektin nereye uygulanacağını söyleyen 0..1 alanı.
// Kaynaktan türer (koyu/açık/kenar) ya da elle boyanır (fırça).
// Determinizmi bozmaz: fırça dışındaki her şey kaynağın fonksiyonu.

// srcGray: kaynak çizildikten sonraki gri görüntünün ImageData'sı (piksel katmanlarından önce).
function buildMask(mask, srcGray, W, H, U) {
  const out = new Float32Array(W * H);
  const d = srcGray.data;
  const mode = mask.kaynak;

  if (mode === 'fırça') {
    if (brush.canvas) {
      const bc = document.createElement('canvas');
      bc.width = W; bc.height = H;
      const g = bc.getContext('2d', { willReadFrequently: true });
      g.drawImage(brush.canvas, 0, 0, W, H);
      const bd = g.getImageData(0, 0, W, H).data;
      for (let i = 0, p = 0; i < d.length; i += 4, p++) out[p] = bd[i] / 255;
    }
  } else if (mode === 'koyu' || mode === 'açık') {
    const dark = mode === 'koyu';
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const v = lumAt(d, i);
      out[p] = dark ? 1 - v : v;
    }
  } else if (mode === 'kenar') {
    const r = Math.max(1, Math.round(U));
    const L = (x, y) => lumAt(d, (clamp(y, 0, H - 1) * W + clamp(x, 0, W - 1)) * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const gx = L(x + r, y) - L(x - r, y);
        const gy = L(x, y + r) - L(x, y - r);
        out[y * W + x] = clamp(Math.hypot(gx, gy) * 2.2, 0, 1);
      }
    }
  }

  // yumuşak: eşiği sertleştirir (0) ya da geçişi genişletir (1)
  const soft = mask.yumusak;
  const gamma = soft < 0.5 ? lerp(4, 1, soft * 2) : 1;
  const spread = soft >= 0.5 ? lerp(1, 3, (soft - 0.5) * 2) : 1;
  for (let p = 0; p < out.length; p++) {
    let m = Math.pow(clamp(out[p] * spread, 0, 1), gamma);
    if (mask.ters) m = 1 - m;
    out[p] = m;
  }
  return out;
}

const maskActive = (mask) => mask && mask.kaynak !== 'yok';

// Piksel katmanı: efekt öncesi (before) ile sonrası (after ImageData) maskeye göre karışır.
function applyPixelMask(after, before, m, W, H) {
  const d = after.data;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const k = m[p];
    if (k >= 0.999) continue;
    d[i] = before[i] * (1 - k) + d[i] * k;
    d[i + 1] = before[i + 1] * (1 - k) + d[i + 1] * k;
    d[i + 2] = before[i + 2] * (1 - k) + d[i + 2] * k;
    d[i + 3] = before[i + 3] * (1 - k) + d[i + 3] * k;
  }
}

// Vektör/glyph katmanı ayrı bir saydam buffer'a çizilir; alfa maske ile çarpılır.
function applyLayerMask(buf, m, W, H) {
  const img = buf.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 3, p = 0; i < d.length; i += 4, p++) d[i] *= m[p];
  buf.putImageData(img, 0, 0);
}
