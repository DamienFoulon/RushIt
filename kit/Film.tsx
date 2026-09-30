import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { VideoDefinition } from "./definition";
import type { VideoJson } from "./schema";
import { Soundtrack } from "./Soundtrack";
import { TextColumn } from "./TextColumn";
import { Probe } from "./qa/Probe";
import { SceneContext } from "./qa/SceneContext";
import { ThemeProvider } from "./theme";
import { framesPerBeat, timeScenes } from "./timing";

/** The music credit shown over the last scene, or null when the licence does not require one. */
export const creditText = (video: VideoJson): string | null => (video.music?.creditRequired ? video.music.credit : null);

/**
 * The film: every scene of the definition on the grid of the video's track.
 * With the `qa` input prop, the check's probe measures each frame it renders.
 */
export const Film: React.FC<{ video: VideoJson; definition: VideoDefinition; qa?: { endpoint: string } }> = ({ video, definition, qa }) => {
  const { fps } = useVideoConfig();
  const grid = video.music ?? { downbeats: [], outputDuration: video.durationSeconds };
  const timed = timeScenes(definition.scenes, grid, fps);
  const beat = framesPerBeat(video.music?.bpm, fps);
  const creditFrom = timed[timed.length - 1]?.from ?? 0;
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
                  <TextColumn texts={scene.texts} textsAt={t.textsAt} />
                </AbsoluteFill>
              </SceneContext.Provider>
            </Sequence>
          );
        })}
        {credit !== null && (
          <Sequence from={creditFrom} layout="none">
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 32, textAlign: "center", fontSize: 16, color: "var(--muted, var(--ink))" }}>
              {credit}
            </div>
          </Sequence>
        )}
        {qa && <Probe endpoint={qa.endpoint} />}
      </AbsoluteFill>
    </ThemeProvider>
  );
};
