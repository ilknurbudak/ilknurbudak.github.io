// Vektör geçişleri. Yol sabittir, zamana bağlı olan yalnızca ne kadarının çizildiği.
// Sıçrama ve savrulma burada çizgiyle kurulur; nokta sprite yok.
// "develop" araçları (karalama, mürekkep akması, yeniden çizim) kaynağın kendi
// malzemesinden beslenir: boşlukta rastgele değil, çizginin ve kütlenin üstünde çalışır.

const easeIn = (u) => u * u;
const taper = (s, k) => Math.pow(Math.sin(Math.PI * clamp(s, 0, 1)), lerp(0.35, 3, k));

function boilPoint(x, y, t, seed, amt) {
  if (!amt) return [x, y];
  return [
    x + periodicNoise(x * 0.06, y * 0.06, t, seed + 41) * amt,
    y + periodicNoise(x * 0.06 + 55, y * 0.06 + 21, t, seed + 42) * amt,
  ];
}

function buildPath(seed, i, W, H, len, kaos, straight) {
  const r = mulberry32(seed + i * 7919);
  const N = 56;
  const D = (len * Math.max(W, H)) / N;
  let x = r() * W, y = r() * H;
  let ang = r() * Math.PI * 2;
  const pts = [];
  for (let k = 0; k < N; k++) {
    const s = k / (N - 1);
    const turn = (valueNoise(k * 0.18, i * 3.7, seed) - 0.5) * kaos * (straight ? 0.35 : 3.2);
    ang += turn;
    const step = D * (straight ? lerp(0.6, 1.6, s) : 1);
    x += Math.cos(ang) * step;
    y += Math.sin(ang) * step;
    pts.push([x, y, s]);
  }
  return pts;
}

function strokePath(ctx, pts, prog, t, seed, o) {
  const N = pts.length;
  const upto = Math.max(2, Math.floor(easeIn(clamp(prog, 0, 1)) * N));
  const tel = Math.max(1, Math.round(o.tel || 1));
  for (let s = 0; s < tel; s++) {
    const off = tel === 1 ? 0 : (s - (tel - 1) / 2) * (o.telAralik || 0);
    ctx.beginPath();
    for (let k = 0; k < upto; k++) {
      let [x, y] = pts[k];
      if (off) {
        const [px, py] = pts[Math.min(k + 1, N - 1)];
        const dx = px - x, dy = py - y;
        const L = Math.hypot(dx, dy) || 1;
        x += (-dy / L) * off; y += (dx / L) * off;
      }
      const [bx, by] = boilPoint(x, y, t, seed + s, o.boil);
      k === 0 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
    }
    ctx.lineWidth = o.w;
    ctx.stroke();
  }
}

function taperedPath(ctx, pts, prog, t, seed, o) {
  const N = pts.length;
  const upto = Math.max(2, Math.floor(easeIn(clamp(prog, 0, 1)) * N));
  for (let k = 1; k < upto; k++) {
    const [x0, y0, s0] = pts[k - 1];
    const [x1, y1] = pts[k];
    const [ax, ay] = boilPoint(x0, y0, t, seed, o.boil);
    const [bx, by] = boilPoint(x1, y1, t, seed, o.boil);
    ctx.lineWidth = Math.max(0.05, o.w * taper(s0, o.sivrilik));
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
}

const VECTOR_OPS = {
  // KARALAMA — kaynağın kendi çizgisini/kütlesini karalar.
  // oz=1: kenarları (çizgiyi) takip edip teğet boyunca üstünden geçer.
  // oz=0: koyu bölgeleri (kütleyi) rastgele yönde doldurur.
  scribble(ctx, W, H, t, p, seed, boil, U, src) {
    const edges = (src && src.edges) || [];
    const sites = (src && src.sites) || [];
    if (!edges.length && !sites.length) return;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    const N = Math.round(lerp(15, 700, p.yogunluk));
    for (let i = 0; i < N; i++) {
      const r = mulberry32(seed + i * 104729);
      const useEdge = r() < p.oz && edges.length;
      let cx, cy, ang;
      if (useEdge) {
        const e = edges[Math.floor(r() * edges.length)];
        cx = e.x; cy = e.y; ang = Math.atan2(e.dy, e.dx); // çizgi teğeti
      } else if (sites.length) {
        const s = sites[Math.floor(r() * sites.length)];
        cx = s.x; cy = s.y; ang = r() * Math.PI * 2;
      } else continue;

      const birth = r(), life = lerp(0.3, 1, r());
      const age = cyclicAge(t, birth, life);
      if (age > 1 + p.iz) continue;
      const alpha = age <= 1 ? 1 : Math.max(0, 1 - (age - 1) / Math.max(0.001, p.iz));
      ctx.globalAlpha = alpha;

      const len = p.uzunluk * 34 * U * lerp(0.5, 1.5, r());
      const reps = Math.round(p.tekrar);
      const ca = Math.cos(ang), sa = Math.sin(ang);
      ctx.lineWidth = p.kalinlik * U * lerp(0.6, 1.4, r());

      // Çizilme oranı: age boyunca karalama açılır.
      const grow = clamp(age / 0.6, 0, 1);
      for (let rp = 0; rp < reps; rp++) {
        ctx.beginPath();
        const segs = 9;
        const upto = Math.max(2, Math.floor(grow * segs));
        for (let k = 0; k <= upto; k++) {
          const u = k / segs;
          const along = (u - 0.5) * len;
          // teğete dik salınım = karalama sıkışması; kaos + taşma dağıtır
          const perp = Math.sin(u * Math.PI * (2 + rp)) * len * 0.16 * lerp(0.5, 1.5, p.kaos)
            + periodicNoise(cx * 0.03 + i, cy * 0.03 + rp, t, seed + rp) * p.tasma * 26 * U;
          const jx = (r() - 0.5) * p.kaos * len * 0.25;
          const jy = (r() - 0.5) * p.kaos * len * 0.25;
          const x = cx + ca * along - sa * perp + jx;
          const y = cy + sa * along + ca * perp + jy;
          const [bx, by] = boilPoint(x, y, t, seed + i + rp * 13, boil);
          k === 0 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  },

  // MÜREKKEP AKMASI — kaynağın koyu noktalarından aşağı akar, uçta birikir.
  inkflow(ctx, W, H, t, p, seed, boil, U, src) {
    const sites = (src && src.sites) || [];
    if (!sites.length) return;
    ctx.lineCap = 'round';
    const N = Math.round(lerp(0, Math.min(sites.length, 400), p.yogunluk));
    for (let i = 0; i < N; i++) {
      const s = sites[(i * 97) % sites.length];
      const r = mulberry32(seed + 321 + i * 7919);
      const birth = r(), life = lerp(0.4, 1, r()) * lerp(1.2, 0.5, p.hiz);
      const age = cyclicAge(t, birth, life);
      if (age > 1) continue;
      const L = p.uzunluk * H * lerp(0.3, 1.2, r());
      const yEnd = s.y + L * easeIn(age);
      ctx.globalAlpha = 1 - age * 0.2;
      ctx.beginPath();
      const steps = 20;
      for (let k = 0; k <= steps; k++) {
        const u = k / steps;
        const yy = lerp(s.y, yEnd, u);
        const xx = s.x + periodicNoise(s.x * 0.01, yy * 0.02, t, seed + 71) * 3 * U;
        const [bx, by] = boilPoint(xx, yy, t, seed + i, boil);
        k === 0 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
      }
      ctx.lineWidth = p.kalinlik * U * (1 - age * 0.4);
      ctx.stroke();
      if (p.birikme > 0.02) {
        ctx.globalAlpha = (1 - age * 0.2) * p.birikme;
        const rr = p.kalinlik * U * (0.8 + p.birikme * 2.5);
        ctx.beginPath(); ctx.arc(s.x, yEnd, rr, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  },

  splash(ctx, W, H, t, p, seed, boil, U) {
    ctx.lineCap = 'butt';
    for (let i = 0; i < p.sayi; i++) {
      const r = mulberry32(seed + 555 + i * 31337);
      const birth = r(), life = lerp(0.18, 0.6, r());
      const age = cyclicAge(t, birth, life);
      if (age > 1) continue;
      const pts = buildPath(seed + 555, i, W, H, p.uzunluk * lerp(0.4, 1.6, r()), p.yayilim, true);
      ctx.globalAlpha = 1 - easeIn(age) * 0.15;
      taperedPath(ctx, pts, age, t, seed + i, { w: p.kalinlik * lerp(0.5, 1.5, r()) * U, sivrilik: p.sivrilik, boil });
    }
    ctx.globalAlpha = 1;
  },

  drip(ctx, W, H, t, p, seed, boil, U) {
    ctx.lineCap = 'round';
    for (let i = 0; i < p.sayi; i++) {
      const r = mulberry32(seed + 909 + i * 6151);
      const birth = r(), life = lerp(0.45, 1, r()) * lerp(1.2, 0.5, p.hiz);
      const age = cyclicAge(t, birth, life);
      if (age > 1) continue;
      const x = r() * W, y0 = r() * H * 0.7;
      const L = p.uzunluk * H * lerp(0.4, 1.5, r());
      const yEnd = y0 + L * easeIn(age);
      ctx.globalAlpha = 1 - age * 0.25;
      ctx.beginPath();
      const steps = 24;
      for (let k = 0; k <= steps; k++) {
        const s = k / steps;
        const yy = lerp(y0, yEnd, s);
        const xx = x + periodicNoise(x * 0.01, yy * 0.02, t, seed + 71) * 2.5 * U;
        const [bx, by] = boilPoint(xx, yy, t, seed + i, boil);
        k === 0 ? ctx.moveTo(bx, by) : ctx.lineTo(bx, by);
      }
      ctx.lineWidth = p.kalinlik * U * (1 - age * 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },

  // Kenarlar vektöre çevrilir, sonra baştan yeniden çizilir.
  redraw(ctx, W, H, t, p, seed, boil, U, src) {
    const edges = (src && src.edges) || [];
    if (!edges.length) return;
    ctx.lineCap = 'round';
    const N = edges.length;
    const take = Math.floor(N * p.yogunluk);
    for (let k = 0; k < take; k++) {
      const e = edges[k];
      const birth = k / take;
      const age = cyclicAge(t, birth, Math.max(0.02, p.iz || 1));
      if (age > 1) continue;
      ctx.globalAlpha = p.iz >= 1 ? 1 : 1 - age * 0.6;
      const L = p.uzunluk * U * (0.5 + e.m);
      const [ax, ay] = boilPoint(e.x - e.dx * L, e.y - e.dy * L, t, seed + k, boil);
      const [bx, by] = boilPoint(e.x + e.dx * L, e.y + e.dy * L, t, seed + k, boil);
      ctx.lineWidth = p.kalinlik * U;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },

  // Kural gereği varsayılan kapalı. Fizik simülasyonu yok: konum analitik hesaplanır.
  particles(ctx, W, H, t, p, seed, boil, U) {
    for (let i = 0; i < p.sayi; i++) {
      const r = mulberry32(seed + 7 + i * 2654435761);
      const birth = r();
      const age = cyclicAge(t, birth, p.omur);
      if (age > 1) continue;
      const x0 = r() * W, y0 = r() * H;
      const a = r() * Math.PI * 2, sp = lerp(0.05, 0.5, r()) * p.yayilim * Math.max(W, H) * 0.4;
      const x = x0 + Math.cos(a) * sp * age;
      const y = y0 + Math.sin(a) * sp * age + p.yercekimi * H * 0.5 * age * age;
      const s = p.boy * U * (1 - age * 0.4);
      ctx.globalAlpha = 1 - age;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  },
};

// Sobel: kenar noktaları + teğet yönü. srcGray ImageData'sının .data'sından okur.
function extractEdgesFrom(d, W, H, maxN = 7000) {
  const out = [];
  const step = Math.max(1, Math.floor(Math.sqrt((W * H) / (maxN * 4))));
  const L = (x, y) => lumAt(d, (clamp(y, 0, H - 1) * W + clamp(x, 0, W - 1)) * 4);
  for (let y = 1; y < H - 1; y += step) {
    for (let x = 1; x < W - 1; x += step) {
      const gx = L(x + 1, y - 1) + 2 * L(x + 1, y) + L(x + 1, y + 1) - L(x - 1, y - 1) - 2 * L(x - 1, y) - L(x - 1, y + 1);
      const gy = L(x - 1, y + 1) + 2 * L(x, y + 1) + L(x + 1, y + 1) - L(x - 1, y - 1) - 2 * L(x, y - 1) - L(x + 1, y - 1);
      const m = Math.hypot(gx, gy);
      if (m < 0.35) continue;
      out.push({ x, y, dx: -gy / m, dy: gx / m, m: Math.min(1, m / 2) });
    }
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(hash2(i, 0, 1234) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Kaynağın koyu bölgelerinden örneklenmiş noktalar (kütle). Koyuluk arttıkça yoğunlaşır.
function darkSitesFrom(d, W, H, maxN = 3000) {
  const out = [];
  const step = Math.max(1, Math.floor(Math.sqrt((W * H) / (maxN * 3))));
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const v = lumAt(d, (y * W + x) * 4);
      if (v < 0.55 && hash2(x, y, 99) < (0.55 - v) * 2.2) out.push({ x, y, v });
    }
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(hash2(i, 7, 55) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
