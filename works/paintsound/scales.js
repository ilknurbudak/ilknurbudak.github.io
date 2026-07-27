// scales.js — pitch mapping. No mystique: Y position picks a note from a scale.

(function (global) {
  const ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  // Semitone offsets from the root.
  const SCALES = {
    "minor pentatonic": [0, 3, 5, 7, 10],
    "major pentatonic": [0, 2, 4, 7, 9],
    "major": [0, 2, 4, 5, 7, 9, 11],
    "minor": [0, 2, 3, 5, 7, 8, 10],
    "dorian": [0, 2, 3, 5, 7, 9, 10],
    "whole tone": [0, 2, 4, 6, 8, 10],
    "chromatic": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  };

  function rootPitchClass(rootName) {
    return Math.max(0, ROOTS.indexOf(rootName));
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Ascending list of MIDI notes that belong to the scale, within [lowMidi, highMidi].
  function buildAllowedNotes(rootName, scaleName, lowMidi, highMidi) {
    const pc = rootPitchClass(rootName);
    const set = SCALES[scaleName] || SCALES["chromatic"];
    const notes = [];
    for (let m = lowMidi; m <= highMidi; m++) {
      const rel = ((m - pc) % 12 + 12) % 12;
      if (set.indexOf(rel) !== -1) notes.push(m);
    }
    return notes;
  }

  global.PSScales = { ROOTS, SCALES, midiToFreq, buildAllowedNotes };
})(window);
