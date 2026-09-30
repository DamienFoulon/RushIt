import { rmSync } from "node:fs";
import { cpus } from "node:os";
import http from "node:http";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import type { ProbeReport } from "../../kit/qa/types";
import { entryPoint, rushitWebpackOverride } from "../lib/webpack";

export type Session = {
  render(frames: readonly number[], outDir: string): Promise<ProbeReport[]>;
  totalFrames: number;
  fps: number;
  /** The webpack bundle, removed by close(). */
  bundleDir: string;
  close(): Promise<void>;
};

const concurrency = () => Math.max(1, Math.min(4, Math.floor(cpus().length / 2)));

/** One bundle, one browser, one collector, for as many frames as needed. */
export const openSession = async (videoDir: string): Promise<Session> => {
  const received = new Map<number, ProbeReport>();
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (body) {
        const r = JSON.parse(body) as ProbeReport;
        received.set(r.frame, r);
      }
      res.writeHead(204, { "access-control-allow-origin": "*" });
      res.end();
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address() as { port: number };
  const inputProps = { qa: { endpoint: `http://127.0.0.1:${port}/qa` } };
  let serveUrl: string | null = null;
  let browser: Awaited<ReturnType<typeof openBrowser>> | null = null;
  // The bundle weighs some 30 MB in the temporary folder: it leaves with the session, failed or not.
  const release = async () => {
    try {
      await browser?.close({ silent: true });
    } finally {
      server.close();
      if (serveUrl) rmSync(serveUrl, { recursive: true, force: true });
    }
  };
  let composition: Awaited<ReturnType<typeof selectComposition>>;
  try {
    serveUrl = await bundle({ entryPoint, publicDir: videoDir, webpackOverride: rushitWebpackOverride(videoDir) });
    browser = await openBrowser("chrome", { chromiumOptions: { gl: "swiftshader" }, logLevel: "error" });
    composition = await selectComposition({ serveUrl, id: "Film", inputProps, puppeteerInstance: browser, logLevel: "error" });
  } catch (e) {
    await release();
    throw e;
  }
  const url = serveUrl;
  const chrome = browser;

  const one = async (frame: number, outDir: string): Promise<ProbeReport> => {
    await renderStill({
      serveUrl: url, composition, frame, inputProps, puppeteerInstance: chrome,
      output: path.join(outDir, `frame-${frame}.png`), overwrite: true,
      chromiumOptions: { gl: "swiftshader" }, logLevel: "error",
    });
    const r = received.get(frame);
    if (!r) throw new Error(`Image ${frame} : aucun rapport de la sonde reçu`);
    if (r.error) throw new Error(`Image ${frame} : la mesure a échoué dans la page :\n${r.error}`);
    return r;
  };

  let closed = false;
  return {
    totalFrames: composition.durationInFrames,
    fps: composition.fps,
    async render(frames, outDir) {
      const out: ProbeReport[] = [];
      const n = concurrency();
      for (let i = 0; i < frames.length; i += n) out.push(...(await Promise.all(frames.slice(i, i + n).map((f) => one(f, outDir)))));
      return out;
    },
    bundleDir: url,
    async close() {
      if (closed) return;
      closed = true;
      await release();
    },
  };
};
