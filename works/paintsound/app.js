// app.js — draw lines, hear them.
// Horizontal axis is time. Vertical axis is pitch. A playhead sweeps left to
// right; wherever it crosses a line, that line sounds — in its own voice and
// colour. Work is split into pages, like animation frames: playback runs the
// whole piece, page after page, then loops.

(function () {
  "use strict";

  const VOICES = [
    { name: "sine",     type: "sine",     color: "#141414" }, // ink
    { name: "triangle", type: "triangle", color: "#2b4b8c" }, // indigo
    { name: "saw",      type: "saw",      color: "#b23a2e" }, // vermilion
    { name: "square",   type: "square",   color: "#c98a1a" }, // amber
    { name: "fm",       type: "fm",       color: "#2f8079" }, // teal
    { name: "pluck",    type: "pluck",    color: "#6b4a9c" }, // violet
    { name: "pad",      type: "pad",      color: "#5b7a3a" }, // olive
    { name: "reed",     type: "reed",     color: "#a83e6a" }, // rose
    { name: "bowed",    type: "bowed",    color: "#7a5230" }, // sienna
    { name: "glass",    type: "glass",    color: "#2f8ca8" }, // cerulean
    { name: "bell",     type: "bell",     color: "#b5651d" }, // gold
    { name: "organ",    type: "organ",    color: "#3f6b4a" }, // pine
    { name: "brass",    type: "brass",    color: "#9c4f2e" }, // rust
    { name: "clarinet", type: "clarinet", color: "#3a6ea5" }, // cobalt
    { name: "marimba",  type: "marimba",  color: "#7a8a3a" }, // moss
    { name: "harp",     type: "harp",     color: "#8e3d7a" }, // magenta
    { name: "air",      type: "air",      color: "#55607a" }, // slate
    { name: "perc",     type: "perc",     color: "#3a3a3a" }, // graphite
    { name: "drone",    type: "drone",    color: "#9c2f44" }, // crimson
  ];

  // ---- state ----------------------------------------------------------------
  const state = {
    pages: [{ strokes: [] }],  // each page: { strokes:[ {voice, pts:[{x,y,v}]} ] }
    pageIndex: 0,              // page being edited / viewed
    current: null,             // stroke in progress (on pageIndex)
    drawing: false,
    follow: true,              // view follows the playhead across pages
    onion: true,               // faint ghost of the previous page while editing

    playing: false,
    startTime: 0,
    nextStep: 0,

    loopLen: 3.0,              // seconds per page
    steps: 16,                 // time columns per page
    scale: "minor pentatonic",
    root: "A",
    voice: 0,
    echo: 0.2,

    lowMidi: 45,
    highMidi: 84,
    showGuides: true,

    midiEnabled: false,
    midiOut: null,
  };

  let ctx = null, graph = null, allowed = [];
  const canvas = document.getElementById("stage");
  const g = canvas.getContext("2d");

  function rebuildAllowed() {
    allowed = PSScales.buildAllowedNotes(state.root, state.scale, state.lowMidi, state.highMidi);
  }
  rebuildAllowed();

  function page() { return state.pages[state.pageIndex]; }
  function pieceLen() { return state.pages.length * state.loopLen; }
  function totalSteps() { return state.pages.length * state.steps; }

  // ---- sizing ---------------------------------------------------------------
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);

  // ---- audio ----------------------------------------------------------------
  function ensureAudio() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    graph = PSSynth.buildGraph(ctx, state.echo);
    graph.master.gain.value = sesAcik ? 0.9 : 0;
  }

  // iOS: ses bağlamı yalnızca bir jest içinde ve bir ses çalınarak açılıyor.
  // Bu yüzden kararı düğmeye bağladık: "sound: on" demeden ses çıkmıyor.
  let sesAcik = false;

  function unlockAudio() {
    ensureAudio();
    if (ctx.state === "suspended") ctx.resume();
    const b = ctx.createBuffer(1, 1, ctx.sampleRate);
    const k = ctx.createBufferSource();
    k.buffer = b; k.connect(ctx.destination); k.start(0);
  }

  function sesYaz() {
    const b = document.getElementById("sound");
    if (b) {
      b.textContent = "sound: " + (sesAcik ? "on" : "off");
      b.classList.toggle("on", sesAcik);
    }
    if (graph) graph.master.gain.value = sesAcik ? 0.9 : 0;
  }

  function sesDegistir() {
    sesAcik = !sesAcik;
    if (sesAcik) unlockAudio();
    sesYaz();
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && ctx && ctx.state === "suspended") ctx.resume();
  });
  function startPlayback() {
    ensureAudio();
    if (ctx.state === "suspended") ctx.resume();
    if (state.playing) return;
    state.playing = true;
    state.startTime = ctx.currentTime + 0.08;
    state.nextStep = 0;
  }
  function stopPlayback() { state.playing = false; allNotesOff(); }
  function resetClock() {
    if (!ctx) return;
    state.startTime = ctx.currentTime + 0.05;
    state.nextStep = 0;
  }

  // ---- pitch / note extraction ---------------------------------------------
  function yToMidi(y) {
    if (allowed.length === 0) return null;
    const frac = clamp(1 - y / H, 0, 1);
    return allowed[Math.round(frac * (allowed.length - 1))];
  }
  function speedToVelocity(v) { return 0.32 + 0.68 * clamp(v / 3.0, 0, 1); }

  // Notes where the strokes of a given page cross a time column.
  function notesForStep(pageIdx, localStep) {
    const pg = state.pages[pageIdx];
    if (!pg) return [];
    const xc = ((localStep + 0.5) / state.steps) * W;
    const out = [];
    for (const stroke of pg.strokes) {
      const pts = stroke.pts;
      const seen = new Set();
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1], p1 = pts[i];
        if (p0.x === p1.x) continue;
        if ((p0.x - xc) * (p1.x - xc) > 0) continue;
        const t = (xc - p0.x) / (p1.x - p0.x);
        if (t < 0 || t > 1) continue;
        const y = p0.y + t * (p1.y - p0.y);
        const v = p0.v + t * (p1.v - p0.v);
        const midi = yToMidi(y);
        if (midi == null || seen.has(midi)) continue;
        seen.add(midi);
        out.push({ midi: midi, freq: PSScales.midiToFreq(midi), velocity: speedToVelocity(v), voice: stroke.voice });
        if (out.length >= 8) return out;
      }
    }
    return out;
  }

  // ---- scheduler ------------------------------------------------------------
  const LOOKAHEAD = 0.12;
  function stepTime(n) { return state.startTime + n * (state.loopLen / state.steps); }

  function scheduler() {
    if (!state.playing || !ctx) return;
    const now = ctx.currentTime;
    const TS = totalSteps();
    while (stepTime(state.nextStep) < now + LOOKAHEAD) {
      const n = state.nextStep;
      const when = stepTime(n);
      const s = ((n % TS) + TS) % TS;
      const pageIdx = Math.floor(s / state.steps);
      const local = s % state.steps;
      const notes = notesForStep(pageIdx, local);
      const dur = Math.min(0.36, (state.loopLen / state.steps) * 1.35);

      for (const note of notes) {
        const voice = VOICES[note.voice] || VOICES[0];
        PSSynth.playNote(ctx, graph.input, {
          freq: note.freq, velocity: note.velocity, start: when, duration: dur, type: voice.type,
        });
        if (state.midiEnabled && state.midiOut) sendMidi(note.midi, note.velocity, when, dur, note.voice);
      }
      state.nextStep++;
    }
  }
  setInterval(scheduler, 25);

  // ---- MIDI out — one channel per voice -------------------------------------
  function sendMidi(midi, velocity, when, dur, voice) {
    const channel = voice & 0x0f;
    const vel = Math.max(1, Math.round(velocity * 127));
    const tOn = performance.now() + Math.max(0, (when - ctx.currentTime) * 1000);
    state.midiOut.send([0x90 | channel, midi, vel], tOn);
    state.midiOut.send([0x80 | channel, midi, 0], tOn + dur * 1000);
  }
  function allNotesOff() {
    if (state.midiOut) for (let ch = 0; ch < 16; ch++) state.midiOut.send([0xb0 | ch, 123, 0]);
  }
  async function enableMidi() {
    if (!navigator.requestMIDIAccess) { setStatus("this browser has no Web MIDI"); return false; }
    try {
      const access = await navigator.requestMIDIAccess();
      const outs = Array.from(access.outputs.values());
      if (outs.length === 0) { setStatus("no MIDI output found"); return false; }
      state.midiOut = outs[0];
      setStatus("MIDI to: " + state.midiOut.name);
      return true;
    } catch (e) { setStatus("MIDI access denied"); return false; }
  }

  // ---- playback position (for the view + playhead) --------------------------
  function playPos() {
    if (!state.playing || !ctx) return null;
    let elapsed = ctx.currentTime - state.startTime;
    if (elapsed < 0) elapsed = 0;
    const t = elapsed % pieceLen();
    const pageIdx = Math.min(state.pages.length - 1, Math.floor(t / state.loopLen));
    const within = (t - pageIdx * state.loopLen) / state.loopLen;
    return { pageIdx: pageIdx, x: within * W };
  }

  // ---- drawing --------------------------------------------------------------
  function pointFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  let lastT = 0;
  function onDown(e) {
    e.preventDefault();
    startPlayback();
    state.drawing = true;
    const p = pointFromEvent(e);
    lastT = performance.now();
    state.current = { voice: state.voice, pts: [{ x: p.x, y: p.y, v: 0 }] };
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
  }
  function onMove(e) {
    if (!state.current) return;
    const p = pointFromEvent(e);
    const now = performance.now();
    const pts = state.current.pts;
    const prev = pts[pts.length - 1];
    const dt = Math.max(1, now - lastT);
    const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
    if (dist < 1.2) return;
    pts.push({ x: p.x, y: p.y, v: dist / dt });
    lastT = now;
  }
  function onUp() {
    state.drawing = false;
    if (!state.current) return;
    if (state.current.pts.length > 1) page().strokes.push(state.current);
    state.current = null;
  }
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  // ---- render loop ----------------------------------------------------------
  const PAPER = "#f5f5f3";

  function drawStroke(stroke, color, alpha) {
    const pts = stroke.pts;
    if (pts.length < 2) return;
    g.globalAlpha = alpha == null ? 1 : alpha;
    g.strokeStyle = color;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i];
      g.lineWidth = clamp(2.6 - p1.v * 0.25, 1.1, 2.8);
      g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.stroke();
    }
    g.globalAlpha = 1;
  }

  function draw() {
    g.fillStyle = PAPER;
    g.fillRect(0, 0, W, H);

    const pp = playPos();
    // which page is on screen: follow the playhead unless you're drawing on yours
    let displayPage = state.pageIndex;
    if (state.playing && state.follow && !state.drawing && pp) displayPage = pp.pageIdx;

    if (state.showGuides && allowed.length > 1) {
      g.strokeStyle = "rgba(0,0,0,0.05)"; g.lineWidth = 1;
      for (let i = 0; i < allowed.length; i++) {
        const y = H * (1 - i / (allowed.length - 1));
        g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      }
      g.strokeStyle = "rgba(0,0,0,0.035)";
      for (let s = 0; s <= state.steps; s++) {
        const x = (s / state.steps) * W;
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
      }
    }

    g.lineJoin = "round"; g.lineCap = "round";

    // onion skin: faint previous page while editing
    if (state.onion && !state.playing && displayPage > 0) {
      for (const stroke of state.pages[displayPage - 1].strokes) {
        drawStroke(stroke, (VOICES[stroke.voice] || VOICES[0]).color, 0.12);
      }
    }

    for (const stroke of state.pages[displayPage].strokes) {
      drawStroke(stroke, (VOICES[stroke.voice] || VOICES[0]).color);
    }
    if (state.current && displayPage === state.pageIndex) {
      drawStroke(state.current, VOICES[state.current.voice].color);
    }

    // playhead only when the sweep is on the page we're seeing
    if (state.playing && pp && displayPage === pp.pageIdx) {
      g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(pp.x, 0); g.lineTo(pp.x, H); g.stroke();
    }

    // keep the page readout honest while following
    updatePageInd(displayPage);

    requestAnimationFrame(draw);
  }

  // ---- helpers --------------------------------------------------------------
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function setStatus(msg) { const el = document.getElementById("status"); if (el) el.textContent = msg || ""; }
  let pageIndEl = null;
  function updatePageInd(shown) {
    if (!pageIndEl) pageIndEl = document.getElementById("pageInd");
    if (pageIndEl) pageIndEl.textContent = (shown + 1) + "/" + state.pages.length;
  }

  // ---- pages ----------------------------------------------------------------
  function gotoPage(i) {
    state.pageIndex = clamp(i, 0, state.pages.length - 1);
  }
  function addPage() {
    state.pages.splice(state.pageIndex + 1, 0, { strokes: [] });
    state.pageIndex += 1;
    resetClock();
  }
  function duplicatePage() {
    const copy = { strokes: page().strokes.map((s) => ({ voice: s.voice, pts: s.pts.map((p) => ({ x: p.x, y: p.y, v: p.v })) })) };
    state.pages.splice(state.pageIndex + 1, 0, copy);
    state.pageIndex += 1;
    resetClock();
  }
  function deletePage() {
    if (state.pages.length === 1) { state.pages[0].strokes = []; return; }
    state.pages.splice(state.pageIndex, 1);
    if (state.pageIndex >= state.pages.length) state.pageIndex = state.pages.length - 1;
    resetClock();
  }

  // ---- WAV export — the whole piece, page after page ------------------------
  async function exportWav() {
    const sr = 44100;
    const length = Math.ceil((pieceLen() + 1.0) * sr);
    const off = new OfflineAudioContext(2, length, sr);
    const og = PSSynth.buildGraph(off, state.echo);
    const dur = Math.min(0.36, (state.loopLen / state.steps) * 1.35);

    for (let p = 0; p < state.pages.length; p++) {
      for (let step = 0; step < state.steps; step++) {
        const when = p * state.loopLen + (step / state.steps) * state.loopLen;
        const notes = notesForStep(p, step);
        for (const note of notes) {
          const voice = VOICES[note.voice] || VOICES[0];
          PSSynth.playNote(off, og.input, { freq: note.freq, velocity: note.velocity, start: when, duration: dur, type: voice.type });
        }
      }
    }

    const buffer = await off.startRendering();
    const wav = encodeWav(buffer);
    const url = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
    const a = document.createElement("a");
    a.href = url; a.download = "paintsound-piece.wav"; a.click();
    URL.revokeObjectURL(url);
  }

  function encodeWav(buffer) {
    const numCh = buffer.numberOfChannels, sr = buffer.sampleRate, frames = buffer.length;
    const bytes = 44 + frames * numCh * 2;
    const view = new DataView(new ArrayBuffer(bytes));
    function wstr(off, s) { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); }
    wstr(0, "RIFF"); view.setUint32(4, bytes - 8, true); wstr(8, "WAVE");
    wstr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, numCh, true); view.setUint32(24, sr, true);
    view.setUint32(28, sr * numCh * 2, true); view.setUint16(32, numCh * 2, true);
    view.setUint16(34, 16, true); wstr(36, "data"); view.setUint32(40, frames * numCh * 2, true);
    const chans = [];
    for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c));
    let off = 44;
    for (let i = 0; i < frames; i++) {
      for (let c = 0; c < numCh; c++) {
        const s = clamp(chans[c][i], -1, 1);
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2;
      }
    }
    return view.buffer;
  }

  // ---- UI wiring ------------------------------------------------------------
  function bind() {
    const $ = (id) => document.getElementById(id);

    $("play").addEventListener("click", () => {
      if (state.playing) { stopPlayback(); $("play").textContent = "play"; }
      else { startPlayback(); $("play").textContent = "stop"; }
    });
    $("clear").addEventListener("click", () => { page().strokes = []; allNotesOff(); });
    $("undo").addEventListener("click", () => { page().strokes.pop(); });
    $("export").addEventListener("click", () => { ensureAudio(); exportWav(); });
    $("sound").addEventListener("click", sesDegistir);
    sesYaz();

    $("pagePrev").addEventListener("click", () => gotoPage(state.pageIndex - 1));
    $("pageNext").addEventListener("click", () => gotoPage(state.pageIndex + 1));
    $("pageAdd").addEventListener("click", addPage);
    $("pageDup").addEventListener("click", duplicatePage);
    $("pageDel").addEventListener("click", deletePage);

    const scaleSel = $("scale");
    Object.keys(PSScales.SCALES).forEach((name) => { const o = document.createElement("option"); o.value = name; o.textContent = name; scaleSel.appendChild(o); });
    scaleSel.value = state.scale;
    scaleSel.addEventListener("change", () => { state.scale = scaleSel.value; rebuildAllowed(); });

    const rootSel = $("root");
    PSScales.ROOTS.forEach((name) => { const o = document.createElement("option"); o.value = name; o.textContent = name; rootSel.appendChild(o); });
    rootSel.value = state.root;
    rootSel.addEventListener("change", () => { state.root = rootSel.value; rebuildAllowed(); });

    const voiceSel = $("voice"), swatch = $("voiceSwatch");
    VOICES.forEach((v, i) => { const o = document.createElement("option"); o.value = String(i); o.textContent = v.name; voiceSel.appendChild(o); });
    function applyVoice() { state.voice = parseInt(voiceSel.value, 10); if (swatch) swatch.style.background = VOICES[state.voice].color; }
    voiceSel.value = String(state.voice); applyVoice();
    voiceSel.addEventListener("change", applyVoice);

    const loopR = $("loop"), loopV = $("loopVal");
    loopR.value = state.loopLen; loopV.textContent = state.loopLen.toFixed(1) + "s";
    loopR.addEventListener("input", () => { state.loopLen = parseFloat(loopR.value); loopV.textContent = state.loopLen.toFixed(1) + "s"; resetClock(); });

    const stepR = $("steps"), stepV = $("stepsVal");
    stepR.value = state.steps; stepV.textContent = state.steps;
    stepR.addEventListener("input", () => { state.steps = parseInt(stepR.value, 10); stepV.textContent = state.steps; resetClock(); });

    const echoR = $("echoR"), echoV = $("echoVal");
    echoR.value = state.echo; echoV.textContent = Math.round(state.echo * 100) + "%";
    echoR.addEventListener("input", () => { state.echo = parseFloat(echoR.value); echoV.textContent = Math.round(state.echo * 100) + "%"; if (graph) graph.setEcho(state.echo); });

    const midiBtn = $("midi");
    midiBtn.addEventListener("click", async () => {
      if (state.midiEnabled) { state.midiEnabled = false; allNotesOff(); midiBtn.classList.remove("on"); midiBtn.textContent = "midi off"; setStatus(""); return; }
      const ok = await enableMidi();
      if (ok) { state.midiEnabled = true; midiBtn.classList.add("on"); midiBtn.textContent = "midi on"; }
    });

    window.addEventListener("keydown", (e) => {
      if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.code === "Space") { e.preventDefault(); $("play").click(); }
      else if (e.key === "c") { page().strokes = []; allNotesOff(); }
      else if (e.key === "z") { page().strokes.pop(); }
      else if (e.key === "g") { state.showGuides = !state.showGuides; }
      else if (e.key === "o") { state.onion = !state.onion; }
      else if (e.key === "f") { state.follow = !state.follow; }
      else if (e.key === "[") { gotoPage(state.pageIndex - 1); }
      else if (e.key === "]") { gotoPage(state.pageIndex + 1); }
      else if (e.key === "+" || e.key === "=") { addPage(); }
      else if (e.key >= "1" && e.key <= "9") { const i = parseInt(e.key, 10) - 1; if (i < VOICES.length) { voiceSel.value = String(i); applyVoice(); } }
    });
  }

  // ---- go -------------------------------------------------------------------
  resize();
  bind();
  updatePageInd(0);
  requestAnimationFrame(draw);
})();
