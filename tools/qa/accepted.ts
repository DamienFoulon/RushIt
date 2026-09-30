import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Finding } from "./analyze";

export type Accepted = { id: string; check: string; scene: string | null; element: string; reason: string; date: string };

const file = (dir: string) => path.join(dir, "qa", "accepted.json");

export const readAccepted = (dir: string): Accepted[] => (existsSync(file(dir)) ? JSON.parse(readFileSync(file(dir), "utf8")) : []);

export const addAccepted = (dir: string, f: Finding, reason: string, date: string) => {
  if (f.check === "attente") throw new Error("Une attente ne s'accepte pas : corriger la scène ou l'attente.");
  if (!reason.trim()) throw new Error("Une raison est obligatoire : --reason \"…\"");
  const list = readAccepted(dir).filter((a) => a.id !== f.id);
  list.push({ id: f.id, check: f.check, scene: f.scene, element: `${f.element.selector}|${f.element.text}`, reason, date });
  mkdirSync(path.dirname(file(dir)), { recursive: true });
  writeFileSync(file(dir), JSON.stringify(list, null, 2) + "\n");
};
