import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { exportVideo } from "../tools/export";
import { importVideo } from "../tools/import";
import { buildManifest, type Manifest, verifyManifest, versionAdvice } from "../tools/share/manifest";

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
  it("signale un fichier déclaré mais absent", () => expect(verifyManifest({}, m)).toEqual(["video.json"]));
  it("signale un fichier présent mais non déclaré", () =>
    expect(verifyManifest({ ...files, "intrus.txt": strToU8("x") }, m)).toEqual(["intrus.txt"]));
  it("conseille de s'aligner quand seul le verrou diffère, à la même version", () =>
    expect(versionAdvice(m, "0.1.0", "def")).toMatch(/verrou abc/));
  it("donne la commande qui revient à la version de la vidéo, pas à celle de la machine", () =>
    expect(versionAdvice(m, "0.2.0", "def")?.split("\n")).toContain("Pour un rendu identique : git fetch --tags && git checkout v0.1.0 && npm ci"));
});

describe("import, fichiers manquants ou en trop", () => {
  /** An exported zip, altered by `edit` on its entries, manifest left as exported. */
  const altered = (edit: (entries: Record<string, Uint8Array>) => void) => {
    const zip = path.join(tmp(), "demo.rushit.zip");
    exportVideo(withVideo(), zip);
    const entries = unzipSync(readFileSync(zip));
    edit(entries);
    writeFileSync(zip, zipSync(entries));
    return zip;
  };

  it("refuse un fichier déclaré dans le manifeste mais absent du zip", () => {
    const zip = altered((e) => delete e["demo/rules.md"]);
    expect(() => importVideo(zip, { root: tmp() })).toThrow(/manquants[\s\S]*rules\.md/);
  });

  it("refuse un fichier présent dans le zip mais non déclaré", () => {
    const zip = altered((e) => (e["demo/intrus.txt"] = strToU8("x")));
    expect(() => importVideo(zip, { root: tmp() })).toThrow(/en trop[\s\S]*intrus\.txt/);
  });
});

describe("export puis import", () => {
  it("retrouve les mêmes fichiers", () => {
    const zip = path.join(tmp(), "demo.rushit.zip");
    exportVideo(withVideo(), zip);
    const root = tmp();
    const r = importVideo(zip, { root });
    expect(readFileSync(path.join(r.dir, "video.json"), "utf8")).toBe(readFileSync("test/fixtures/video-min/video.json", "utf8"));
  });

  it("laisse de côté les rendus intermédiaires", () => {
    const dir = withVideo();
    mkdirSync(path.join(dir, "out"));
    writeFileSync(path.join(dir, "out/demo.raw.mp4"), "intermédiaire");
    writeFileSync(path.join(dir, "out/demo.mp4"), "final");
    const zip = path.join(tmp(), "demo.rushit.zip");
    exportVideo(dir, zip);
    const entries = Object.keys(unzipSync(readFileSync(zip)));
    expect(entries).toContain("demo/out/demo.mp4");
    expect(entries).not.toContain("demo/out/demo.raw.mp4");
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

describe("import, noms et chemins qui sortent du dossier", () => {
  /** Rebuilds a zip under `name` with `extra` files, with a manifest whose hashes match. */
  const forge = (name: string, extra: Record<string, Uint8Array> = {}) => {
    const zip = path.join(tmp(), "demo.rushit.zip");
    exportVideo(withVideo(), zip);
    const entries = unzipSync(readFileSync(zip));
    const old = JSON.parse(strFromU8(entries["manifest.json"])) as Manifest;
    const files: Record<string, Uint8Array> = { ...extra };
    for (const [p, b] of Object.entries(entries)) if (p.startsWith("demo/")) files[p.slice("demo/".length)] = b;
    const manifest = buildManifest(files, name, old.rushit, old.lock);
    const out: Record<string, Uint8Array> = { "manifest.json": strToU8(JSON.stringify(manifest)) };
    for (const [p, b] of Object.entries(files)) out[`${name}/${p}`] = b;
    writeFileSync(zip, zipSync(out));
    return zip;
  };
  /** A root nested in a fresh folder, so an escape would land in `base`. */
  const nestedRoot = () => {
    const base = tmp();
    const root = path.join(base, "videos");
    mkdirSync(root);
    return { base, root };
  };

  it("refuse un manifeste dont le nom sort du dossier", () => {
    const { base, root } = nestedRoot();
    expect(() => importVideo(forge("../evasion"), { root })).toThrow(/\.\.\/evasion/);
    expect(existsSync(path.join(base, "evasion"))).toBe(false);
    expect(readdirSync(root)).toEqual([]);
  });

  it("refuse un chemin de fichier qui remonte, sans rien écrire", () => {
    const { base, root } = nestedRoot();
    const zip = forge("demo", { "../../evasion.txt": strToU8("dehors") });
    expect(Object.keys(unzipSync(readFileSync(zip)))).toContain("demo/../../evasion.txt");
    expect(() => importVideo(zip, { root })).toThrow(/evasion\.txt/);
    expect(existsSync(path.join(base, "evasion.txt"))).toBe(false);
    expect(readdirSync(root)).toEqual([]);
  });

  it("refuse --as qui sort du dossier", () => {
    const { base, root } = nestedRoot();
    const zip = path.join(tmp(), "demo.rushit.zip");
    exportVideo(withVideo(), zip);
    expect(() => importVideo(zip, { root, as: "../x" })).toThrow(/\.\.\/x/);
    expect(existsSync(path.join(base, "x"))).toBe(false);
    expect(readdirSync(root)).toEqual([]);
  });
});
