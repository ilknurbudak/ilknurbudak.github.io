// Harf geçişleri. Altındakini okur, yerine harf koyar. Bu yüzden yığında en üstte durmayı sever.

const SANS = 'Helvetica, Helvetica Neue, Arial, sans-serif';
const MONO = 'ui-monospace, Menlo, Monaco, monospace'; // yalnızca harf dokusunda: burada harf tipografi değil, doku.

const GLYPH_OPS = {
  ascii(ctx, W, H, t, p, seed, ink, bg, U) {
    const c = Math.max(4, Math.round(p.hucre * U));
    const cols = Math.floor(W / c), rows = Math.floor(H / c);
    if (cols < 1 || rows < 1) return;

    const small = document.createElement('canvas');
    small.width = cols; small.height = rows;
    const sctx = small.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(ctx.canvas, 0, 0, cols, rows);
    const d = sctx.getImageData(0, 0, cols, rows).data;

    const ramp = p.harfler.length ? p.harfler : ' .oO@';
    if (p.kaplama > 0) {
      // saydam zeminde kaplama "sil" demektir, boya değil
      ctx.save();
      ctx.globalAlpha = p.kaplama;
      if (bg === 'transparent') ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = bg === 'transparent' ? '#000' : bg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    ctx.fillStyle = ink;
    ctx.font = `${c}px ${MONO}`;
    ctx.textBaseline = 'top';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        let v = lumAt(d, i);
        if (bg === '#000') v = 1 - v;
        const ch = ramp[clamp(Math.floor((1 - v) * (ramp.length - 1)), 0, ramp.length - 1)];
        if (ch !== ' ') ctx.fillText(ch, x * c, y * c);
      }
    }
  },

  // Toplan ve dağıl. Loop dikişsiz: dağılım (1-cos)/2 ile 0'dan 1'e ve geri döner.
  text(ctx, W, H, t, p, seed, ink, bg, U) {
    const s = (1 - Math.cos(2 * Math.PI * t)) / 2;
    const txt = (p.yazi || '').toUpperCase();
    if (!txt) return;

    const layer = document.createElement('canvas');
    layer.width = W; layer.height = H;
    const lc = layer.getContext('2d');
    lc.font = `bold ${p.boy * U}px ${SANS}`;
    lc.textAlign = 'center'; lc.textBaseline = 'middle';
    lc.fillStyle = '#fff';

    const total = lc.measureText(txt).width;
    let x = W / 2 - total / 2;
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      const w = lc.measureText(ch).width;
      const dx = periodicWave(i * 3 + 1, t, seed) * p.dagilim * W * 0.45 * s;
      const dy = periodicWave(i * 3 + 2, t, seed) * p.dagilim * H * 0.45 * s;
      const rot = periodicWave(i * 3 + 3, t, seed) * p.donme * Math.PI * s;
      lc.save();
      lc.translate(x + w / 2 + dx, H / 2 + dy);
      lc.rotate(rot);
      lc.fillText(ch, 0, 0);
      lc.restore();
      x += w;
    }

    if (p.mod === 'dolu') {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = ink;
      ctx.globalAlpha = 1;
      const tmp = lc.getImageData(0, 0, W, H);
      // beyaz metni mürekkep rengine boya
      lc.globalCompositeOperation = 'source-in';
      lc.fillStyle = ink; lc.fillRect(0, 0, W, H);
      ctx.drawImage(layer, 0, 0);
      ctx.restore();
      void tmp;
    } else {
      ctx.save();
      ctx.globalCompositeOperation = p.mod === 'maske' ? 'destination-in' : 'destination-out';
      ctx.drawImage(layer, 0, 0);
      ctx.restore();
    }
  },

  // Yazı gibi duran, hiçbir dile ait olmayan çizgi. Kelime değil, yazma jesti.
  asemic(ctx, W, H, t, p, seed, ink, bg, U) {
    ctx.strokeStyle = ink;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = p.kalinlik * U;
    const lines = Math.round(p.satir);
    const margin = W * 0.08;
    const lh = H / (lines + 1);

    for (let L = 0; L < lines; L++) {
      const baseY = lh * (L + 1);
      const per = Math.round(p.yogunluk);
      const cw = (W - margin * 2) / per;
      for (let g = 0; g < per; g++) {
        const gs = seed + L * 977 + g * 31;
        const r = mulberry32(gs);
        const birth = (L * per + g) / (lines * per);
        const age = cyclicAge(t, birth * 0.9, 0.5);
        if (age > 1) continue;
        ctx.globalAlpha = age < 0.9 ? 1 : (1 - age) * 10;

        const x0 = margin + g * cw;
        const strokes = 1 + Math.floor(r() * 3);
        for (let s = 0; s < strokes; s++) {
          ctx.beginPath();
          const N = 10;
          for (let k = 0; k <= N; k++) {
            const u = k / N;
            const x = x0 + u * cw * 0.8 + (r() - 0.5) * cw * 0.1;
            const y = baseY + Math.sin(u * Math.PI * (1 + r() * 3) + s) * lh * 0.3 * p.boy;
            const bx = x + periodicNoise(x * 0.05, y * 0.05, t, gs) * 1.5 * U;
            k === 0 ? ctx.moveTo(bx, y) : ctx.lineTo(bx, y);
          }
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  },
};
