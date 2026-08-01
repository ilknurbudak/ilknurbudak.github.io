// Shared rendering + sound engine for The Recursive Human.
// Used by both the full loop (loop.html) and the single-stage pages (stage.html).
// Plain tools only: pixel edges, vector polylines, a fading buffer, oscillators.

import { STAGES, STAGE_SECONDS, byN } from "./stages.js";

const VEC = "../assets/vector/";   // pages live in web/, assets one level up

async function loadPolylines(stages) {
  const out = {};
  for (const s of stages) {
    out[s.id] = {};
    for (const layer of s.ink) {
      try {
        const j = await fetch(VEC + `${s.id}_${layer.colour}.json`).then(r => r.json());
        out[s.id][layer.colour] = j.polylines;
      } catch (e) { out[s.id][layer.colour] = []; }
    }
  }
  return out;
}

export async function boot(opts) {
  // opts: { canvas, mode:"loop"|"single", stageN?, camera:bool, audio:bool }
  const active = opts.mode === "single" ? [byN(opts.stageN)] : STAGES;
  const polys = await loadPolylines(active);

  const canvas = opts.canvas;
  const ctx = canvas.getContext("2d", { alpha: false });
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let W = 0, H = 0;
  const buf = document.createElement("canvas");
  const bx = buf.getContext("2d");

  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buf.width = W; buf.height = H;
    bx.fillStyle = "#000"; bx.fillRect(0, 0, W, H);
  }
  window.addEventListener("resize", resize);

  // ---- camera ----
  const video = document.createElement("video");
  video.muted = true; video.playsInline = true;
  const CAMW = 160, CAMH = 120;
  const cam = document.createElement("canvas"); cam.width = CAMW; cam.height = CAMH;
  const cx = cam.getContext("2d", { willReadFrequently: true });
  let haveCam = false, prevLum = null, faceCx = 0.5, faceCy = 0.42;

  async function initCam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      video.srcObject = stream; await video.play(); haveCam = true;
    } catch (e) { haveCam = false; }
  }

  function grab() { cx.save(); cx.scale(-1, 1); cx.drawImage(video, -CAMW, 0, CAMW, CAMH); cx.restore(); }
  function lumOf(d) {
    const l = new Float32Array(CAMW * CAMH);
    for (let i = 0; i < l.length; i++) l[i] = 0.3 * d[i*4] + 0.59 * d[i*4+1] + 0.11 * d[i*4+2];
    return l;
  }
  function faceEdges() {
    grab();
    const lum = lumOf(cx.getImageData(0, 0, CAMW, CAMH).data);
    const e = [];
    for (let y = 1; y < CAMH - 1; y += 2)
      for (let x = 1; x < CAMW - 1; x += 2) {
        const gx = lum[y*CAMW+x+1] - lum[y*CAMW+x-1];
        const gy = lum[(y+1)*CAMW+x] - lum[(y-1)*CAMW+x];
        if (Math.hypot(gx, gy) > 36) e.push([x / CAMW, y / CAMH, Math.atan2(gy, gx)]);
      }
    return e;
  }
  function trackFace() {
    grab();
    const cur = lumOf(cx.getImageData(0, 0, CAMW, CAMH).data);
    let sx = 0, sy = 0, sw = 0;
    if (prevLum)
      for (let y = 0; y < CAMH; y++)
        for (let x = 0; x < CAMW; x++)
          if (Math.abs(cur[y*CAMW+x] - prevLum[y*CAMW+x]) > 12) { sx += x; sy += y; sw++; }
    prevLum = cur;
    if (sw > 40) { faceCx += (sx/sw/CAMW - faceCx) * 0.05; faceCy += (sy/sw/CAMH - faceCy) * 0.05; }
  }

  // ---- drawing ----
  function strokePolys(list, count, rgb, width, alpha) {
    bx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
    bx.lineWidth = width; bx.lineCap = "round"; bx.lineJoin = "round";
    const n = Math.min(list.length, Math.floor(count));
    for (let i = 0; i < n; i++) {
      const pl = list[i];
      bx.beginPath();
      for (let k = 0; k < pl.length; k++) {
        const X = pl[k][0] * W, Y = pl[k][1] * H;
        k ? bx.lineTo(X, Y) : bx.moveTo(X, Y);
      }
      bx.stroke();
    }
  }
  function warp(amt) {
    for (let y = 0; y < H; y += 4) {
      const dx = Math.sin(y * 0.03 + amt * 6) * 6 * amt;
      bx.drawImage(buf, 0, y, W, 4, dx, y, W, 4);
    }
  }
  function eyes(open) {
    const ex = faceCx * W, ey = faceCy * H, dx = W * 0.07;
    const ry = H * 0.03 + H * 0.02 * open, rx = ry * 1.6;
    for (const sgn of [-1, 1]) {
      bx.save();
      bx.beginPath(); bx.ellipse(ex + sgn * dx, ey, rx, ry, 0, 0, Math.PI * 2); bx.clip();
      bx.scale(-1, 1); bx.drawImage(video, -(ex + sgn * dx) - rx, ey - ry, rx * 2, ry * 2);
      bx.restore();
    }
  }

  function renderStage(s, p) {
    const fade = s.camera === "warp" ? 0.015 : 0.035;
    bx.fillStyle = `rgba(0,0,0,${fade})`; bx.fillRect(0, 0, W, H);

    if (s.camera === "edges" && haveCam) {
      const e = faceEdges();
      bx.strokeStyle = "rgba(245,214,70,0.5)"; bx.lineWidth = 1.4; bx.lineCap = "round";
      for (const [x, y, a] of e) {
        const X = x * W, Y = y * H, L = 7;
        bx.beginPath();
        bx.moveTo(X - Math.cos(a)*L, Y - Math.sin(a)*L);
        bx.lineTo(X + Math.cos(a)*L, Y + Math.sin(a)*L);
        bx.stroke();
      }
    }
    if (s.camera === "warp") {
      bx.fillStyle = `rgba(150,165,70,${0.04 + 0.05 * p})`; bx.fillRect(0, 0, W, H);
    }
    for (const layer of s.ink) {
      const list = (polys[s.id] && polys[s.id][layer.colour]) || [];
      strokePolys(list, list.length * p, layer.rgb, layer.width, layer.alpha);
    }
    if (s.camera === "warp") warp(p);
    if (s.camera === "eyes" && haveCam && p > 0.45) eyes((p - 0.45) / 0.55);
  }

  // ---- audio ----
  let actx, master, voices = [], noiseFilter;
  function audioInit() {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = 0; master.connect(actx.destination);
    master.gain.linearRampToValueAtTime(0.5, actx.currentTime + 3);
    for (const sp of [["sawtooth", 55], ["triangle", 138], ["sine", 414]]) {
      const o = actx.createOscillator(); o.type = sp[0]; o.frequency.value = sp[1];
      const g = actx.createGain(); g.gain.value = 0; o.connect(g); g.connect(master); o.start();
      voices.push(g);
    }
    const nb = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
    const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ns = actx.createBufferSource(); ns.buffer = nb; ns.loop = true;
    noiseFilter = actx.createBiquadFilter(); noiseFilter.type = "bandpass"; noiseFilter.frequency.value = 700; noiseFilter.Q.value = 0.7;
    const ng = actx.createGain(); ng.gain.value = 0;
    ns.connect(noiseFilter); noiseFilter.connect(ng); ng.connect(master); ns.start();
    voices.push(ng);
    return master;
  }
  function audioUpdate(s, nextS, p) {
    if (!actx) return;
    const k = nextS ? Math.max(0, (p - 0.6) / 0.4) : 0;
    for (let i = 0; i < 4; i++) {
      const target = s.audio[i] * (1 - k) + (nextS ? nextS.audio[i] : s.audio[i]) * k;
      voices[i].gain.setTargetAtTime(target, actx.currentTime, 0.2);
    }
    noiseFilter.frequency.setTargetAtTime(400 + parseInt(s.n) * 250, actx.currentTime, 0.3);
  }

  // ---- loop ----
  let t0 = 0;
  function frame(now) {
    const t = (now - t0) / 1000;
    let s, nextS, p;
    if (opts.mode === "single") {
      s = active[0]; nextS = null; p = (t % STAGE_SECONDS) / STAGE_SECONDS;
    } else {
      const c = (t % (active.length * STAGE_SECONDS)) / STAGE_SECONDS;
      const i = Math.floor(c) % active.length;
      s = active[i]; nextS = active[(i + 1) % active.length]; p = c - Math.floor(c);
    }
    if (haveCam && video.readyState >= 2) trackFace();
    renderStage(s, p);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(buf, 0, 0);
    audioUpdate(s, nextS, p);
    requestAnimationFrame(frame);
  }

  // ---- recording (export to device) ----
  function recorder() {
    const vs = canvas.captureStream(30);
    if (actx) {
      const dst = actx.createMediaStreamDestination(); master.connect(dst);
      dst.stream.getAudioTracks().forEach(tr => vs.addTrack(tr));
    }
    const mime = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
    let rec = null, chunks = [];
    return {
      toggle(label) {
        if (rec && rec.state === "recording") { rec.stop(); return false; }
        rec = new MediaRecorder(vs, { mimeType: mime, videoBitsPerSecond: 8e6 });
        chunks = []; rec.ondataavailable = e => chunks.push(e.data);
        rec.onstop = () => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob(chunks, { type: mime }));
          a.download = (label || "recursive_human") + "." + (mime.includes("mp4") ? "mp4" : "webm");
          a.click();
        };
        rec.start(); return true;
      }
    };
  }

  resize();
  const api = { recorder: null };
  return {
    async start() {
      if (opts.camera) await initCam();
      if (opts.audio) audioInit();
      api.recorder = recorder();
      t0 = performance.now();
      requestAnimationFrame(frame);
      return api;
    }
  };
}
