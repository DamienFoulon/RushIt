import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoDefinition } from "./definition";
import type { VideoJson } from "./schema";
import { progress, useEase } from "./motion";
import { Soundtrack } from "./Soundtrack";
import { TextColumn } from "./TextColumn";
import { Probe } from "./qa/Probe";
import { SceneContext } from "./qa/SceneContext";
import { ThemeProvider } from "./theme";
import { framesPerBeat, timeScenes, type TimedScene } from "./timing";

/** The music credit shown over the last scene, or null when the licence does not require one. */
export const creditText = (video: VideoJson): string | null => (video.music?.creditRequired ? video.music.credit : null);

/**
 * Where the credit comes in: one beat into the last scene, once that scene has
 * started to show, never over an empty background.
 */
export const creditStart = (timed: readonly TimedScene[], beat: number): number => (timed[timed.length - 1]?.from ?? 0) + Math.round(beat);

/** The credit, in the safe area at the bottom of the image: large enough to read, fading in. */
const Credit: React.FC<{ text: string }> = ({ text }) => {
  const opacity = progress(useCurrentFrame(), 0, 12, useEase());
  return (
    <div
      style={{
        position: "absolute", left: 96, right: 96, bottom: 56, textAlign: "center", fontSize: 24, lineHeight: 1.3,
        textWrap: "balance", color: "var(--muted, var(--ink))", opacity,
      }}
    >
      {text}
    </div>
  );
};

/**
 * The film: every scene of the definition on the grid of the video's track.
 * With the `qa` input prop, the check's probe measures each frame it renders.
 */
export const Film: React.FC<{ video: VideoJson; definition: VideoDefinition; qa?: { endpoint: string } }> = ({ video, definition, qa }) => {
  const { fps } = useVideoConfig();
  const grid = video.music ?? { downbeats: [], outputDuration: video.durationSeconds };
  const timed = timeScenes(definition.scenes, grid, fps);
  const beat = framesPerBeat(video.music?.bpm, fps);
  const credit = creditText(video);
  return (
    <ThemeProvider theme={video.theme}>
      <AbsoluteFill style={{ background: "var(--bg)", color: "var(--ink)" }}>
        {video.music && <Soundtrack music={video.music} />}
        {timed.map((t, i) => {
          const scene = definition.scenes[i];
          const Scene = scene.component;
          return (
            <Sequence key={t.id} from={t.from} durationInFrames={t.durationInFrames} layout="none">
              <SceneContext.Provider value={{ id: t.id, from: t.from }}>
                <AbsoluteFill data-rushit-scene={t.id}>
                  <Scene duration={t.durationInFrames} beat={beat} textsAt={t.textsAt} />
                  <TextColumn texts={scene.texts} textsAt={t.textsAt} duration={t.durationInFrames} />
                </AbsoluteFill>
              </SceneContext.Provider>
            </Sequence>
          );
        })}
        {credit !== null && (
          <Sequence from={creditStart(timed, beat)} layout="none">
            <Credit text={credit} />
          </Sequence>
        )}
        {qa && <Probe endpoint={qa.endpoint} />}
      </AbsoluteFill>
    </ThemeProvider>
  );
};
