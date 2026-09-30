import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoDefinition } from "./definition";
import type { VideoJson } from "./schema";
import { Soundtrack } from "./Soundtrack";
import { TextColumn } from "./TextColumn";
import { ThemeProvider } from "./theme";
import { timeScenes } from "./timing";

/**
 * A working mock-up: each scene is a card with its title and lines, cut on the
 * track's grid, with a light on every downbeat. It lets the rhythm be judged
 * before a single scene is built.
 */
export const Animatic: React.FC<{ video: VideoJson; definition: VideoDefinition }> = ({ video, definition }) => {
  const { fps } = useVideoConfig();
  const grid = video.music ?? { downbeats: [], outputDuration: video.durationSeconds };
  const timed = timeScenes(definition.scenes, grid, fps);
  const { stage } = video.theme.layout;
  return (
    <ThemeProvider theme={video.theme}>
      <AbsoluteFill style={{ background: "var(--bg)", color: "var(--ink)" }}>
        {video.music && <Soundtrack music={video.music} />}
        {timed.map((t, i) => {
          const scene = definition.scenes[i];
          return (
            <Sequence key={t.id} from={t.from} durationInFrames={t.durationInFrames} layout="none">
              <AbsoluteFill>
                <div
                  style={{
                    position: "absolute", left: stage.left, top: stage.top, width: stage.width, height: stage.height,
                    border: "2px dashed var(--ink)", borderRadius: 18, display: "grid", placeItems: "center",
                    fontSize: 48, fontWeight: 600,
                  }}
                >
                  {`Scène ${i + 1} · ${scene.title ?? scene.id}`}
                </div>
                <TextColumn texts={scene.texts} textsAt={t.textsAt} duration={t.durationInFrames} />
              </AbsoluteFill>
            </Sequence>
          );
        })}
        {video.music && <Beat downbeats={video.music.downbeats} fps={fps} />}
        <div style={{ position: "absolute", left: 96, bottom: 40, fontSize: 18 }}>
          {video.music ? `${video.music.title}, ${video.music.artist} · ${Math.round(video.music.bpm)} BPM` : "Sans musique"}
        </div>
      </AbsoluteFill>
    </ThemeProvider>
  );
};

/** A light that flashes on every downbeat, and the bar number. */
const Beat: React.FC<{ downbeats: readonly number[]; fps: number }> = ({ downbeats, fps }) => {
  const seconds = useCurrentFrame() / fps;
  const bar = downbeats.filter((b) => b <= seconds).length;
  const last = downbeats[bar - 1] ?? 0;
  return (
    <div style={{ position: "absolute", right: 96, bottom: 40, display: "flex", alignItems: "center", gap: 12, fontSize: 18 }}>
      <span
        style={{
          width: 12, height: 12, borderRadius: 999, background: "var(--accent, var(--ink))",
          opacity: interpolate(seconds - last, [0, 0.3], [1, 0.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
      Mesure {bar}
    </div>
  );
};
