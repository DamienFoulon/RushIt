import { Composition } from "remotion";
import definition from "@video/index";
import json from "@video/video.json";
import { Animatic, Film, filmSeconds, VideoJson } from "rushit/kit";

const video = VideoJson.parse(json);
const frames = Math.round(filmSeconds(video) * video.format.fps);
const common = { durationInFrames: frames, fps: video.format.fps, width: video.format.width, height: video.format.height, defaultProps: { video, definition } };

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Film" component={Film} {...common} />
    <Composition id="Animatic" component={Animatic} {...common} />
  </>
);
