export type Box = { x: number; y: number; w: number; h: number };

/** One mounted <Expect> at the measured frame. Visibility facts, no judgement. */
export type ExpectFact = {
  id: string;
  scene: string | null;
  visible: [number, number] | null;
  hidden: [number, number] | null;
  present: boolean;
  box: Box | null;
  inFrame: number;
  shown: number;
  opacity: number;
  clippedBy: string | null;
  clippedShare: number;
  coveredBy: string | null;
  coveredShare: number;
  related: Box[];
};

/** One block of text at the measured frame. */
export type TextFact = {
  key: string;
  scene: string | null;
  selector: string;
  text: string;
  words: number;
  column: boolean;
  box: Box;
  inFrame: number;
  opacity: number;
  fontPx: number;
  bold: boolean;
  overflow: boolean;
  clippedBy: string | null;
  contrast: number | null;
  allowed: string[];
  reasons: string[];
};

export type OverlapFact = { a: string; b: string; area: number; boxes: [Box, Box] };

export type ProbeReport = { frame: number; width: number; height: number; expects: ExpectFact[]; texts: TextFact[]; overlaps: OverlapFact[]; error?: string };
