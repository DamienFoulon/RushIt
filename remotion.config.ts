import path from "node:path";
import { Config } from "@remotion/cli/config";

// The current video is a folder chosen by RUSHIT_VIDEO_DIR, which the tools
// set: it is both Remotion's public dir (staticFile) and the target of the
// `@video` alias. `rushit/kit` points at the kit, so that a video folder never
// holds a path to the machine it was made on. Without a video, general
// commands (`remotion browser ensure`, `remotion versions`) still work.
const videoDir = process.env.RUSHIT_VIDEO_DIR;

Config.setEntryPoint("src/index.ts");
if (videoDir) Config.setPublicDir(videoDir);
Config.setChromiumOpenGlRenderer("swiftshader");
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias as Record<string, string>),
      ...(videoDir ? { "@video": videoDir } : {}),
      "rushit/kit": path.resolve(process.cwd(), "kit/index.ts"),
    },
  },
}));
