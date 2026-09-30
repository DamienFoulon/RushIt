import path from "node:path";
import { describe, expect, it } from "vitest";
import { entryPoint, kitEntry, rushitWebpackOverride } from "../tools/lib/webpack";

describe("rushitWebpackOverride", () => {
  it("ajoute les alias @video et rushit/kit sans perdre les alias existants", async () => {
    const out = await rushitWebpackOverride("/tmp/ma-video")({
      resolve: { alias: { autre: "/x" } },
    } as never);
    expect(out.resolve?.alias).toEqual({ autre: "/x", "@video": "/tmp/ma-video", "rushit/kit": kitEntry });
  });

  it("pointe vers le kit et l'entrée du dépôt", () => {
    expect(kitEntry.endsWith(path.join("kit", "index.ts"))).toBe(true);
    expect(entryPoint.endsWith(path.join("src", "index.ts"))).toBe(true);
  });
});
