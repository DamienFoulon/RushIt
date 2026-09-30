/** What every scene receives. Frames are local to the scene (its Sequence). */
export type SceneProps = {
  /** The scene's length in frames, snapped to the track's bars. */
  readonly duration: number;
  /** Frames per beat of the track (a bar is four beats). */
  readonly beat: number;
  /** Frame, local to the scene, where each on-screen line appears. */
  readonly textsAt: readonly number[];
};

export type SceneDef = {
  readonly id: string;
  /** Target start in seconds. The cut lands on the nearest bar start. */
  readonly at: number;
  readonly texts: readonly string[];
  readonly component: React.FC<SceneProps>;
  readonly title?: string;
};

export type VideoDefinition = { readonly scenes: readonly SceneDef[] };
