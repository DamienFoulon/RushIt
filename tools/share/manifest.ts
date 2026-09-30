import { createHash } from "node:crypto";

export type Manifest = { rushit: string; lock: string; name: string; files: Record<string, string> };

const sha = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");

export const buildManifest = (files: Record<string, Uint8Array>, name: string, rushit: string, lock: string): Manifest => ({
  rushit,
  lock,
  name,
  files: Object.fromEntries(Object.entries(files).map(([p, b]) => [p, sha(b)])),
});

/** Paths that are altered, missing, or not declared. */
export const verifyManifest = (files: Record<string, Uint8Array>, m: Manifest): string[] => {
  const bad = Object.entries(m.files).filter(([p, h]) => !files[p] || sha(files[p]) !== h).map(([p]) => p);
  const extra = Object.keys(files).filter((p) => !(p in m.files));
  return [...bad, ...extra].sort();
};

export const versionAdvice = (m: Manifest, rushit: string, lock: string): string | null => {
  if (m.rushit === rushit && m.lock === lock) return null;
  return [
    `Cette vidéo a été faite avec RushIt ${m.rushit} (verrou ${m.lock}), cette machine a ${rushit} (verrou ${lock}).`,
    `Pour un rendu identique : git fetch --tags && git checkout v${m.rushit} && npm ci`,
  ].join("\n");
};
