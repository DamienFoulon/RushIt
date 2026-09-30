import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { exportVideo } from "../tools/export";
import { importVideo } from "../tools/import";
import { buildManifest, verifyManifest, versionAdvice } from "../tools/share/manifest";

const tmp = () => mkdtempSync(path.join(tmpdir(), "rushit-share-"));
const withVideo = () => {
  const dir = path.join(tmp(), "demo");
  cpSync("test/fixtures/video-min", dir, { recursive: true });
  return dir;
};

describe("manifeste", () => {
  const files = { "video.json": strToU8("{}") };
  const m = buildManifest(files, "demo", "0.1.0", "abc");
  it("ne signale rien quand tout correspond", () => expect(verifyManifest(files, m)).toEqual([]));
  it("signale un fichier altéré", () => expect(verifyManifest({ "video.json": strToU8("{ }") }, m)).toEqual(["video.json"]));
  it("conseille de s'aligner quand la version diffère", () => expect(versionAdvice(m, "0.2.0", "abc")).toMatch(/0\.1\.0/));
  it("ne conseille rien quand tout est aligné", () => expect(versionAdvice(m, "0.1.0", "abc")).toBeNull());
});

describe("export puis import", () => {
  it("retrouve les mêmes fichiers", () => {
    const zip = path.join(tmp(), "demo.rushit.zip");
    exportVideo(withVideo(), zip);
    const root = tmp();
    const r = importVideo(zip, { root });
    expect(readFileSync(path.join(r.dir, "video.json"), "utf8")).toBe(readFileSync("test/fixtures/video-min/video.json", "utf8"));
  });

  it("refuse une vidéo qui existe déjà, sauf --as", () => {
    const zip = path.join(tmp(), "demo.rushit.zip");
    exportVideo(withVideo(), zip);
    const root = tmp();
    importVideo(zip, { root });
    expect(() => importVideo(zip, { root })).toThrow(/existe déjà/);
    expect(importVideo(zip, { root, as: "demo-2" }).name).toBe("demo-2");
  });

  it("refuse un zip altéré", () => {
    const zip = path.join(tmp(), "demo.rushit.zip");
    exportVideo(withVideo(), zip);
    const entries = unzipSync(readFileSync(zip));
    entries["demo/video.json"] = strToU8("{}");
    writeFileSync(zip, zipSync(entries));
    expect(() => importVideo(zip, { root: tmp() })).toThrow(/video\.json/);
  });
});
