import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type HashesFile, mediaHashes } from "../tools/hashes";
import { createVideo } from "../tools/new";
import { renderVideo } from "../tools/render";
import { tempDirs } from "./helpers/tmp";

const tmp = tempDirs("rushit-ref-");

/**
 * Carnet rendered here against Carnet rendered on the reference machine
 * (test/fixtures/carnet-hashes-640.json, written by `npm run hashes`). Same
 * machine, same version: identical is guaranteed. Another machine: this test
 * measures it, and the CI does not fail on it.
 */
describe.skipIf(process.env.RUSHIT_E2E !== "1")("comparaison avec la machine de référence", () => {
  it("Carnet en 640×360 : mêmes images et même son que la machine de référence", async () => {
    const reference = JSON.parse(readFileSync("test/fixtures/carnet-hashes-640.json", "utf8")) as HashesFile;
    const v = await createVideo({ name: "carnet", rules: "neutre", from: "carnet", root: tmp() });
    const here = await mediaHashes((await renderVideo(v.dir, { scale: 1 / 3, skipCheck: true })).mp4);
    const differing = here.frames.filter((h, i) => h !== reference.frames[i]).length;
    console.log(
      `Référence : RushIt ${reference.rushit}, Remotion ${reference.remotion}, Chrome ${reference.chrome}, ${reference.platform}-${reference.arch}\n` +
        `Ici : ${differing} images différentes sur ${here.frames.length}, son ${here.pcm === reference.pcm ? "identique" : "différent"}`,
    );
    expect([here.width, here.height]).toEqual([640, 360]);
    expect(here.frames).toEqual(reference.frames);
    expect(here.pcm).toBe(reference.pcm);
  }, 900_000);
});
