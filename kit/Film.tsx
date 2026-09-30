import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { VideoDefinition } from "./definition";
import type { VideoJson } from "./schema";
import { Soundtrack } from "./Soundtrack";
import { TextColumn } from "./TextColumn";
import { ThemeProvider } from "./theme";
import { framesPerBeat, timeScenes } from "./timing";

/** The film: every scene of the definition on the grid of the video's track. */
export const Film: React.FC<{ video: VideoJson; definition: VideoDefinition }> = ({ video, definition }) => {
  const { fps } = useVideoConfig();
  const grid = video.music ?? { downbeats: [], outputDuration: video.durationSeconds };
  const timed = timeScenes(definition.scenes, grid, fps);
  const beat = framesPerBeat(video.music?.bpm, fps);
  const creditFrom = timed[timed.length - 1]?.from ?? 0;
  return (
    <ThemeProvider theme={video.theme}>
      <AbsoluteFill style={{ background: "var(--bg)", color: "var(--ink)" }}>
        {video.music && <Soundtrack music={video.music} />}
        {timed.map((t, i) => {
          const scene = definition.scenes[i];
          const Scene = scene.component;
          return (
            <Sequence key={t.id} from={t.from} durationInFrames={t.durationInFrames} layout="none">
              <AbsoluteFill>
                <Scene duration={t.durationInFrames} beat={beat} textsAt={t.textsAt} />
                <TextColumn texts={scene.texts} textsAt={t.textsAt} />
              </AbsoluteFill>
            </Sequence>
          );
        })}
        {video.music?.creditRequired && (
          <Sequence from={creditFrom} layout="none">
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 32, textAlign: "center", fontSize: 16, color: "var(--muted, var(--ink))" }}>
              {video.music.credit}
            </div>
          </Sequence>
        )}
      </AbsoluteFill>
    </ThemeProvider>
  );
};
