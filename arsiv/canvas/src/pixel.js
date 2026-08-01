// Piksel geçişleri. Hepsi ImageData üstünde, hepsi t'nin fonksiyonu.
// Görüntü bu noktada gri kabul edilir; alfa kanalı korunur (saydam çıktı için).

const GRAIN_STEPS = 24; // tane kaç adımda bir yenilenir; loop'un tam bölenidir
const lumAt = (d, i) => (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
const setGray = (d, i, v) => { d[i] = d[i + 1] = d[i + 2] = v * 255; };

// Karanlığı büyütür (r>0) ya da küçültür (r<0). Ayrılabilir min/max filtresi.
function morph(d, W, H, r, dilate) {
  if (r < 1) return;
  const pick = dilate ? Math.min : Math.max;
  const tmp = new Uint8ClampedArray(d.length);
  for (let pass = 0; pass < 2; pass++) {
    const src = pass === 0 ? d : tmp;
    const dst = pass === 0 ? tmp : d;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let best = dilate ? 255 : 0;
        for (let k = -r; k <= r; k++) {
          const xx = pass === 0 ? clamp(x + k, 0, W - 1) : x;
          const yy = pass === 0 ? y : clamp(y + k, 0, H - 1);
          best = pick(best, src[(yy * W + xx) * 4]);
        }
        const i = (y * W + x) * 4;
        dst[i] = dst[i + 1] = dst[i + 2] = best;
        dst[i + 3] = src[i + 3];
      }
    }
  }
}

const PIXEL_OPS = {
  // ISLAK YAYILMA — siyah, ıslak kâğıtta yayılır: düzensiz taşar, kenarda tüylenir.
  // Yarıçap piksel-başına gürültüyle değişir, o yüzden düz bir kalınlaşma değil,
  // ıslak bir sızma gibi görünür.
  wet(d, W, H, t, p, seed, U) {
    const R = Math.max(1, Math.round(p.yaricap * U * (1 - p.nefes * 0.4 + p.nefes * 0.4 * Math.sin(2 * Math.PI * t))));
    const f = 6 / Math.max(W, H);
    const g = Math.floor(t * GRAIN_STEPS) % GRAIN_STEPS;
    const src = new Uint8ClampedArray(d);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const n = periodicNoise(x * f, y * f, t, seed + 17) * 0.5 + 0.5;
        const rr = Math.max(0, Math.round(R * (1 - p.duzensiz + p.duzensiz * n)));
        if (rr < 1) continue;
        let best = 255;
        for (let k = -rr; k <= rr; k++) {
          best = Math.min(best, src[(y * W + clamp(x + k, 0, W - 1)) * 4]);
          best = Math.min(best, src[(clamp(y + k, 0, H - 1) * W + x) * 4]);
        }
        let v = best / 255;
        if (p.tuylenme > 0 && best < src[i]) {
          const fuzz = (hash2(x + g * 131, y, seed + 5) - 0.5) * 2 * p.tuylenme;
          v = clamp(v + fuzz, 0, 1); // ıslak saçak: kenarda düzensiz kes
        }
        setGray(d, i, v);
      }
    }
  },

  // KURU BASKI — eksik mürekkep: koyu alanı yönlü, tırtıklı bir dokuyla kırar.
  drybrush(d, W, H, t, p, seed, U) {
    const a = (p.yon * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const M = Math.max(W, H);
    const g = Math.floor(t * GRAIN_STEPS) % GRAIN_STEPS;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const v = lumAt(d, i);
        if (v > 0.85) continue; // sadece mürekkebin olduğu yer
        const along = (x * ca + y * sa) / M;
        const across = (-x * sa + y * ca) / M;
        const streak = valueNoise(along * p.sik * 2, across * p.sik * 60, seed + 31);
        const noise = streak + (hash2(x, y, seed + g) - 0.5) * p.kir;
        const lift = clamp((p.miktar - noise) * 1.6, 0, 1);
        setGray(d, i, clamp(v + lift * (1 - v), 0, 1));
      }
    }
  },

  erode(d, W, H, t, p, seed, U) {
    const f = p.sik / Math.max(W, H);
    const src = new Uint8ClampedArray(d);
    morph(d, W, H, Math.max(1, Math.round(U)), false);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const n = periodicNoise(x * f, y * f, t, seed + 11) * 0.5 + 0.5;
        const k = n < p.miktar ? 1 : 0; // seçici: sadece gürültünün açtığı yerde ye
        d[i] = d[i + 1] = d[i + 2] = lerp(src[i], d[i], k);
      }
    }
  },

  grunge(d, W, H, t, p, seed, U) {
    const f = p.sik / Math.max(W, H);
    // Tane her karede yeniden atılır ama adım sayısı loop'a bölündüğü için
    // t=1 ile t=0 aynı deseni verir. Yoksa loop kapanışında tane sıçrar.
    const g = Math.floor(t * GRAIN_STEPS) % GRAIN_STEPS;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const lo = periodicNoise(x * f, y * f, t, seed + 3);
        const hi = p.tane ? (hash2(x + g * 977, y, seed + 5) - 0.5) * 2 : 0;
        const off = lo * p.miktar * 0.6 + hi * p.tane * 0.35;
        setGray(d, i, clamp(lumAt(d, i) + off, 0, 1));
      }
    }
  },

  copygen(d, W, H, t, p, seed, U) {
    for (let n = 0; n < p.tur; n++) {
      const thr = 0.5 + (n - p.tur / 2) * 0.02 + 0.03 * Math.sin(2 * Math.PI * t);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const dirt = (hash2(x, y, seed + n * 31) - 0.5) * p.kir * 0.5;
          setGray(d, i, lumAt(d, i) + dirt > thr ? 1 : 0);
        }
      }
      if (n < p.tur - 1) morph(d, W, H, Math.max(1, Math.round(U)), true);
    }
  },

  halftone(d, W, H, t, p, seed, U) {
    const a = (p.aci * Math.PI) / 180;
    const ca = Math.cos(a), sa = Math.sin(a);
    const k = (2 * Math.PI) / (p.sik * U);
    const drift = 2 * Math.PI * t;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const u = x * ca - y * sa;
        const wave = (Math.sin(u * k + drift) + 1) / 2;
        const v = lumAt(d, i);
        setGray(d, i, v > wave ? 1 : lerp(v, 0, p.sertlik));
      }
    }
  },

  // Yatay dilimler kayar, kareler aniden ters döner, tarama çizgileri geçer.
  cut(d, W, H, t, p, seed, U) {
    const step = Math.floor(t * p.adim) % Math.round(p.adim); // t=1 -> t=0: dikiş yok
    const src = new Uint8ClampedArray(d);
    const bands = 24;
    for (let y = 0; y < H; y++) {
      const band = Math.floor((y / H) * bands);
      const sh = Math.round((hash2(band, step, seed + 7) - 0.5) * 2 * p.kaydir * W);
      const inv = hash2(band, step, seed + 8) < p.ters;
      for (let x = 0; x < W; x++) {
        const sx = ((x - sh) % W + W) % W;
        const i = (y * W + x) * 4, j = (y * W + sx) * 4;
        let v = src[j] / 255;
        if (inv) v = 1 - v;
        if (p.tarama >= 1 && y % Math.max(1, Math.round(p.tarama * U)) === 0) v = 1 - v;
        setGray(d, i, v);
        d[i + 3] = src[j + 3];
      }
    }
  },

  shatter(d, W, H, t, p, seed, U) {
    const step = Math.floor(t * p.adim) % Math.round(p.adim);
    const c = Math.max(2, Math.round(p.hucre * U));
    const src = new Uint8ClampedArray(d);
    const cols = Math.ceil(W / c), rows = Math.ceil(H / c);
    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        const ox = Math.round((hash2(rx, ry * 31 + step, seed + 13) - 0.5) * 2 * p.kaydir * c);
        const oy = Math.round((hash2(rx * 17 + step, ry, seed + 14) - 0.5) * 2 * p.kaydir * c);
        for (let y = ry * c; y < Math.min((ry + 1) * c, H); y++) {
          for (let x = rx * c; x < Math.min((rx + 1) * c, W); x++) {
            const sx = clamp(x + ox, 0, W - 1), sy = clamp(y + oy, 0, H - 1);
            const i = (y * W + x) * 4, j = (sy * W + sx) * 4;
            d[i] = d[i + 1] = d[i + 2] = src[j];
            d[i + 3] = src[j + 3];
          }
        }
      }
    }
  },

  // Bilerek bozmak: bloklar ters döner, silinir, ya da başka yerden kopyalanır.
  sabotage(d, W, H, t, p, seed, U) {
    const step = Math.floor(t * p.adim) % Math.round(p.adim);
    const src = new Uint8ClampedArray(d);
    const n = Math.round(p.yogunluk * 60);
    for (let k = 0; k < n; k++) {
      const r = mulberry32(seed + step * 7919 + k * 131);
      const bw = Math.round(p.boy * U * (0.4 + r())), bh = Math.round(p.boy * U * (0.2 + r() * 0.8));
      const bx = Math.floor(r() * W), by = Math.floor(r() * H);
      const mode = Math.floor(r() * 3);
      const sx0 = Math.floor(r() * W), sy0 = Math.floor(r() * H);
      for (let y = by; y < Math.min(by + bh, H); y++) {
        for (let x = bx; x < Math.min(bx + bw, W); x++) {
          const i = (y * W + x) * 4;
          if (mode === 0) setGray(d, i, 1 - src[i] / 255);
          else if (mode === 1) setGray(d, i, 1);
          else {
            const j = (clamp(sy0 + y - by, 0, H - 1) * W + clamp(sx0 + x - bx, 0, W - 1)) * 4;
            d[i] = d[i + 1] = d[i + 2] = src[j];
          }
        }
      }
    }
  },
};

// Kâğıdı ayıkla: çizgiyi tut, kâğıdı saydam yap.
function matteSource(ctx, W, H, esik, ters) {
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    let v = lumAt(d, i);
    if (ters) v = 1 - v;
    const alpha = clamp((esik - v) / Math.max(0.001, esik * 0.55), 0, 1);
    setGray(d, i, 0);
    d[i + 3] = alpha * 255;
  }
  ctx.putImageData(img, 0, 0);
}
