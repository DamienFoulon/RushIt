import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { exportVideo } from "../tools/export";
import { fileSha256, mediaHashes } from "../tools/hashes";
import { importVideo } from "../tools/import";
import { createVideo } from "../tools/new";
import { renderVideo } from "../tools/render";

describe.skipIf(process.env.RUSHIT_E2E !== "1")("reproductibilité", () => {
  it("Carnet : mêmes images et même son avant et après export puis import", async () => {
    const a = await createVideo({ name: "carnet-a", rules: "neutre", from: "carnet", root: mkdtempSync(path.join(tmpdir(), "rushit-e2e-")) });
    const first = await renderVideo(a.dir, { scale: 1 / 3, skipCheck: true });
    const zip = path.join(tmpdir(), `carnet-${Date.now()}.rushit.zip`);
    exportVideo(a.dir, zip);
    const b = importVideo(zip, { root: mkdtempSync(path.join(tmpdir(), "rushit-e2e-")) });
    const second = await renderVideo(b.dir, { scale: 1 / 3, skipCheck: true });

    const [x, y] = [await mediaHashes(first.mp4), await mediaHashes(second.mp4)];
    expect(x.frames.length).toBeGreaterThan(0);
    expect(x.pcm).not.toBeNull();
    expect(y.frames).toEqual(x.frames);
    expect(y.pcm).toBe(x.pcm);

    // Same pictures and same sound are the promise. Same file bytes are measured, not required.
    const [ha, hb] = [fileSha256(first.mp4), fileSha256(second.mp4)];
    console.log(`MP4 sha256 : ${ha} / ${hb} (${ha === hb ? "identiques" : "différents"})`);
  }, 900_000);
});
