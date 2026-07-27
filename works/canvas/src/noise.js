// Deterministik, döngüye kapanan gürültü.
// Kural: her şey t'nin fonksiyonu, t 0..1 arasında döner, t=1 ile t=0 aynı sonucu verir.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x, y, seed) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (u) => u * u * (3 - 2 * u);

function valueNoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = smooth(x - xi), yf = smooth(y - yi);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return (a * (1 - xf) + b * xf) * (1 - yf) + (c * (1 - xf) + d * xf) * yf;
}

// Zamanı bir çember üzerinde döndürür: iki sabit alanı sin/cos ile karıştırır.
// Böylece loop dikişsiz kapanır, ayrı bir "başa sar" hilesi gerekmez.
function periodicNoise(x, y, t, seed) {
  const ang = 2 * Math.PI * t;
  const a = valueNoise(x, y, seed) - 0.5;
  const b = valueNoise(x + 137.13, y + 91.77, seed + 1) - 0.5;
  return (a * Math.cos(ang) + b * Math.sin(ang)) * 1.4142;
}

// Aynı fikrin ucuz, tek boyutlu hali.
function periodicWave(i, t, seed) {
  const ang = 2 * Math.PI * t;
  const a = hash2(i, 0, seed) - 0.5;
  const b = hash2(i, 1, seed) - 0.5;
  return (a * Math.cos(ang) + b * Math.sin(ang)) * 1.4142;
}

// Çemberde yaş: doğuş anından bu yana geçen oran. Başı sonuna bağlar.
function cyclicAge(t, birth, life) {
  let a = (t - birth) % 1;
  if (a < 0) a += 1;
  return a / life;
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, u) => a + (b - a) * u;
