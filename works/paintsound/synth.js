// synth.js — the sound. Plain oscillators shaped into a few characters.
// Every voice is named for what it is or does: sine, triangle, saw, square,
// fm, pluck, pad, reed, bowed. No sampled instruments, no hidden model.

(function (global) {
  // Build the output chain for a context (realtime or offline).
  // Returns { input, master, setEcho } — connect notes to `input`.
  function buildGraph(ctx, echoAmount) {
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    const input = ctx.createGain();
    input.gain.value = 1.0;
    input.connect(master);

    const delay = ctx.createDelay(1.5);
    delay.delayTime.value = 0.28;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.34;
    const wet = ctx.createGain();
    wet.gain.value = echoAmount != null ? echoAmount : 0.2;

    input.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(master);

    return {
      input,
      master,
      setEcho(v) { wet.gain.value = v; },
    };
  }

  // A shared noise source for breathy / percussive voices.
  function noiseBuffer(ctx) {
    if (!ctx.__noiseBuf) {
      const len = Math.floor(ctx.sampleRate * 1.5);
      const b = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      ctx.__noiseBuf = b;
    }
    return ctx.__noiseBuf;
  }

  // Schedule one note. Works in realtime and offline contexts.
  // opts: { freq, velocity, start, duration, type }
  function playNote(ctx, dest, opts) {
    const freq = opts.freq;
    const velocity = opts.velocity != null ? opts.velocity : 0.8;
    const start = opts.start;
    const baseDur = opts.duration != null ? opts.duration : 0.28;
    const type = opts.type || "sine";

    const g = ctx.createGain();
    g.connect(dest);

    let atk = 0.008;
    let dur = baseDur;
    let peak = 0.26 * velocity;

    function osc(t, f) {
      const o = ctx.createOscillator();
      o.type = t;
      o.frequency.value = f;
      return o;
    }
    function stopAll(nodes, when) { nodes.forEach((n) => n.stop(when)); }

    const stopPad = 0.06;

    switch (type) {
      case "sine":
      case "triangle":
      case "square": {
        const o = osc(type, freq);
        o.connect(g);
        o.start(start); o.stop(start + dur + stopPad);
        break;
      }
      case "saw": {
        const o = osc("sawtooth", freq);
        o.connect(g);
        o.start(start); o.stop(start + dur + stopPad);
        break;
      }
      case "fm": {
        const carrier = osc("sine", freq);
        const mod = osc("sine", freq * 2); // ratio 2:1
        const modGain = ctx.createGain();
        modGain.gain.value = freq * (1.2 + 1.8 * velocity);
        mod.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(g);
        mod.start(start); carrier.start(start);
        stopAll([mod, carrier], start + dur + stopPad);
        break;
      }
      case "pluck": {
        atk = 0.003;
        dur = Math.max(0.12, baseDur * 0.6);
        const o = osc("sawtooth", freq);
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.setValueAtTime(Math.min(9000, freq * 8), start);
        f.frequency.exponentialRampToValueAtTime(Math.max(220, freq * 1.2), start + dur);
        o.connect(f); f.connect(g);
        o.start(start); o.stop(start + dur + stopPad);
        break;
      }
      case "pad": {
        atk = Math.min(0.2, baseDur * 0.6);
        dur = baseDur * 1.9;
        peak = 0.2 * velocity;
        const o1 = osc("sawtooth", freq * 0.996);
        const o2 = osc("sawtooth", freq * 1.004);
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = Math.min(6000, freq * 5);
        o1.connect(f); o2.connect(f); f.connect(g);
        o1.start(start); o2.start(start);
        stopAll([o1, o2], start + dur + stopPad);
        break;
      }
      case "reed": {
        peak = 0.34 * velocity; // bandpass sheds energy — make it up
        const o = osc("square", freq);
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = freq * 2.0;
        f.Q.value = 1.4;
        o.connect(f); f.connect(g);
        o.start(start); o.stop(start + dur + stopPad);
        break;
      }
      case "bowed": {
        atk = Math.min(0.1, baseDur * 0.45);
        dur = baseDur * 1.5;
        peak = 0.22 * velocity;
        const o = osc("sawtooth", freq);
        const lfo = osc("sine", 5.2);       // vibrato
        const lg = ctx.createGain();
        lg.gain.value = freq * 0.006;
        lfo.connect(lg); lg.connect(o.frequency);
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = Math.min(5500, freq * 6);
        o.connect(f); f.connect(g);
        o.start(start); lfo.start(start);
        stopAll([o, lfo], start + dur + stopPad);
        break;
      }
      case "glass": {
        atk = 0.002; dur = Math.max(0.18, baseDur * 0.9);
        const carrier = osc("sine", freq);
        const mod = osc("sine", freq * 3.0);
        const mg = ctx.createGain();
        mg.gain.setValueAtTime(freq * 3 * velocity, start);
        mg.gain.exponentialRampToValueAtTime(freq * 0.3, start + dur);
        mod.connect(mg); mg.connect(carrier.frequency); carrier.connect(g);
        mod.start(start); carrier.start(start);
        stopAll([mod, carrier], start + dur + stopPad);
        break;
      }
      case "bell": {
        atk = 0.002; dur = baseDur * 2.2; peak = 0.22 * velocity;
        const carrier = osc("sine", freq);
        const mod = osc("sine", freq * 1.41); // inharmonic
        const mg = ctx.createGain();
        mg.gain.setValueAtTime(freq * 2.2 * velocity, start);
        mg.gain.exponentialRampToValueAtTime(freq * 0.2, start + dur);
        mod.connect(mg); mg.connect(carrier.frequency); carrier.connect(g);
        mod.start(start); carrier.start(start);
        stopAll([mod, carrier], start + dur + stopPad);
        break;
      }
      case "organ": {
        const o1 = osc("sine", freq), o2 = osc("sine", freq * 2), o3 = osc("sine", freq * 3);
        const g2 = ctx.createGain(); g2.gain.value = 0.5;
        const g3 = ctx.createGain(); g3.gain.value = 0.3;
        o1.connect(g); o2.connect(g2); g2.connect(g); o3.connect(g3); g3.connect(g);
        [o1, o2, o3].forEach((n) => n.start(start));
        stopAll([o1, o2, o3], start + dur + stopPad);
        break;
      }
      case "brass": {
        atk = Math.min(0.05, baseDur * 0.3); dur = baseDur * 1.2;
        const o = osc("sawtooth", freq);
        const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 1;
        f.frequency.setValueAtTime(freq * 1.5, start);
        f.frequency.linearRampToValueAtTime(Math.min(7000, freq * 7), start + atk * 2);
        o.connect(f); f.connect(g);
        o.start(start); o.stop(start + dur + stopPad);
        break;
      }
      case "clarinet": {
        const o = osc("square", freq);
        const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 0.7;
        f.frequency.value = Math.min(3500, freq * 4);
        o.connect(f); f.connect(g);
        o.start(start); o.stop(start + dur + stopPad);
        break;
      }
      case "marimba": {
        atk = 0.002; dur = Math.max(0.14, baseDur * 0.6);
        const carrier = osc("sine", freq);
        const mod = osc("sine", freq * 4.0);
        const mg = ctx.createGain();
        mg.gain.setValueAtTime(freq * 1.5 * velocity, start);
        mg.gain.exponentialRampToValueAtTime(freq * 0.1, start + dur * 0.6);
        mod.connect(mg); mg.connect(carrier.frequency); carrier.connect(g);
        mod.start(start); carrier.start(start);
        stopAll([mod, carrier], start + dur + stopPad);
        break;
      }
      case "harp": {
        atk = 0.003; dur = Math.max(0.16, baseDur * 0.8);
        const o = osc("triangle", freq);
        const f = ctx.createBiquadFilter(); f.type = "lowpass";
        f.frequency.setValueAtTime(Math.min(8000, freq * 6), start);
        f.frequency.exponentialRampToValueAtTime(Math.max(300, freq * 1.5), start + dur);
        o.connect(f); f.connect(g);
        o.start(start); o.stop(start + dur + stopPad);
        break;
      }
      case "air": {
        atk = Math.min(0.05, baseDur * 0.4); dur = baseDur * 1.3; peak = 0.5 * velocity;
        const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx); src.loop = true;
        const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq * 2; f.Q.value = 6;
        src.connect(f); f.connect(g);
        src.start(start); src.stop(start + dur + stopPad);
        break;
      }
      case "perc": {
        atk = 0.001; dur = Math.max(0.08, baseDur * 0.4); peak = 0.5 * velocity;
        const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx);
        const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = freq * 1.5;
        src.connect(f); f.connect(g);
        const o = osc("sine", freq * 0.5); o.connect(g);
        src.start(start); src.stop(start + dur + stopPad);
        o.start(start); o.stop(start + dur + stopPad);
        break;
      }
      case "drone": {
        atk = 0.02; dur = baseDur * 2.4; peak = 0.18 * velocity;
        const o1 = osc("sawtooth", freq * 0.995), o2 = osc("sawtooth", freq * 1.005), o3 = osc("sawtooth", freq * 0.5);
        const g3 = ctx.createGain(); g3.gain.value = 0.4;
        const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = Math.min(4000, freq * 4);
        o1.connect(f); o2.connect(f); o3.connect(g3); g3.connect(f); f.connect(g);
        [o1, o2, o3].forEach((n) => n.start(start));
        stopAll([o1, o2, o3], start + dur + stopPad);
        break;
      }
      default: {
        const o = osc("sine", freq);
        o.connect(g);
        o.start(start); o.stop(start + dur + stopPad);
      }
    }

    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  }

  global.PSSynth = { buildGraph, playNote };
})(window);
