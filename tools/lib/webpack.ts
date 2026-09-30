import path from "node:path";
import type { WebpackOverrideFn } from "@remotion/bundler";
import { repoRoot } from "./paths";

export const kitEntry = path.join(repoRoot, "kit/index.ts");
export const entryPoint = path.join(repoRoot, "src/index.ts");

/**
 * The aliases every RushIt bundle needs: `@video` is the current video folder,
 * `rushit/kit` the kit. Shared by remotion.config.ts (CLI) and bundle() (the
 * check), which does not read remotion.config.ts. Without a video folder,
 * `@video` is left out so that general commands still work.
 */
export const rushitWebpackOverride =
  (videoDir: string | undefined): WebpackOverrideFn =>
  (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias as Record<string, string>),
        ...(videoDir ? { "@video": videoDir } : {}),
        "rushit/kit": kitEntry,
      },
    },
  });
