import { Composition } from "remotion";
import definition from "@video/index";
import json from "@video/video.json";
import { Animatic, Film, filmSeconds, VideoJson } from "rushit/kit";

const video = VideoJson.parse(json);
const frames = Math.round(filmSeconds(video) * video.format.fps);

// The definition holds components, which Remotion cannot serialize: it reaches
// the film by closure, never through props. Props stay serializable and are
// passed along (input props such as `qa` will arrive that way).
const VideoFilm: React.FC<Record<string, unknown>> = (p) => <Film {...p} video={video} definition={definition} />;
const VideoAnimatic: React.FC<Record<string, unknown>> = (p) => <Animatic {...p} video={video} definition={definition} />;

const common = { durationInFrames: frames, fps: video.format.fps, width: video.format.width, height: video.format.height, defaultProps: {} };

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Film" component={VideoFilm} {...common} />
    <Composition id="Animatic" component={VideoAnimatic} {...common} />
  </>
);
