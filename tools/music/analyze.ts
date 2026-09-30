import { trackBeats } from "./beats";
import { decodeMono } from "./decode";
import { correctOffbeat, envelopeAt, harmonyChange, lowPass, normalizedSum, onsetEnvelope, pickDownbeatPhase } from "./downbeats";
import { proposeEdit, toOutputDownbeats } from "./edit";
import { barFeatures, beatChromas, featureDistance } from "./features";

const SR = 44_100;
const BASS_CUTOFF = 150;
const BASS_HOP = 256;
const DOWNBEAT_RADIUS = 0.035;

/**
 * The proposed grid of a track, in source seconds: essentia's tempo and
 * beats, moved by half a pulse when they sit on the offbeat, then grouped in
 * bars of four where the kick hits and the harmony changes. A proposal: the
 * phase is checked by ear in the animatic and moved with `music -- shift`.
 */
export const analyzeGrid = (signal: Float32Array, sampleRate = SR) => {
  const tracked = trackBeats(signal);
  const bass = onsetEnvelope(lowPass(signal, sampleRate, BASS_CUTOFF), sampleRate, BASS_HOP);
  const { beats, shifted } = correctOffbeat(tracked.beats, (t) => envelopeAt(bass, t));
  const chromas = beatChromas(signal, sampleRate, beats);
  const index = new Map(beats.map((t, i) => [t, i]));
  const strength = normalizedSum(beats, [
    (t) => envelopeAt(bass, t, DOWNBEAT_RADIUS),
    (t) => harmonyChange(chromas, index.get(t) ?? 0),
  ]);
  const phase = pickDownbeatPhase(beats, strength);
  return { bpm: tracked.bpm, beats, shifted, downbeats: beats.filter((_, i) => i % 4 === phase) };
};

export const analyzeTrack = (
  file: string,
  target: number,
  overrides: { segments?: [number, number][]; downbeatOffset?: number } = {},
) => {
  const signal = decodeMono(file, SR);
  const duration = signal.length / SR;
  const grid = analyzeGrid(signal, SR);
  const shift = overrides.downbeatOffset ?? 0;
  const downbeats = grid.downbeats.map((t) => t + shift);
  const bar = (60 / grid.bpm) * 4;
  const edit = overrides.segments
    ? { segments: overrides.segments, warning: undefined }
    : proposeEdit({
        downbeats,
        duration,
        target,
        distance: (a, b) => featureDistance(barFeatures(signal, SR, a - bar, a), barFeatures(signal, SR, b, b + bar)),
      });
  const outputDuration = edit.segments.reduce((s, [a, b]) => s + (b - a), 0);
  return {
    bpm: grid.bpm,
    segments: edit.segments,
    downbeats: toOutputDownbeats(downbeats, edit.segments),
    beats: toOutputDownbeats(grid.beats.map((t) => t + shift), edit.segments),
    outputDuration,
    warning: edit.warning,
  };
};
