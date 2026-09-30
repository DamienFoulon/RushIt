export const CHECKS = ["attente", "chevauchement", "coupe", "hors-cadre", "petit-texte", "contraste", "lecture", "zone"] as const;
export type CheckName = (typeof CHECKS)[number];
export type Level = "erreur" | "avertissement" | "ignoré";

export type QaRules = {
  secondsPerWord: number;
  minTextPx: number;
  minContrast: number;
  levels: Record<CheckName, Level>;
  /** Lines of the section that could not be read, kept as they were written. */
  problems: string[];
};

export const DEFAULT_RULES: QaRules = {
  secondsPerWord: 0.3,
  minTextPx: 24,
  minContrast: 4.5,
  levels: {
    attente: "erreur", chevauchement: "erreur", coupe: "erreur", "hors-cadre": "erreur",
    "petit-texte": "avertissement", contraste: "avertissement", lecture: "avertissement", zone: "avertissement",
  },
  problems: [],
};

const number = (s: string) => {
  const m = s.match(/(\d+(?:[.,]\d+)?)/);
  return m ? Number(m[1].replace(",", ".")) : NaN;
};

/** Reads the "Seuils de la passe de contrôle" section of rules.md. Anything else is ignored. */
export const parseQaRules = (markdown: string): QaRules => {
  const rules: QaRules = { ...DEFAULT_RULES, levels: { ...DEFAULT_RULES.levels }, problems: [] };
  const section = markdown.split(/^## /m).find((s) => s.startsWith("Seuils de la passe de contrôle"));
  if (!section) return rules;
  for (const raw of section.split("\n").slice(1)) {
    const line = raw.replace(/^\s*-\s*/, "").trim();
    if (!line) continue;
    const [key, value = ""] = line.split(/\s*:\s*/, 2);
    const k = key.toLowerCase();
    if (k === "lecture" || k === "taille de texte minimale" || k === "contraste minimal") {
      const n = number(value);
      if (Number.isNaN(n)) rules.problems.push(line);
      else if (k === "lecture") rules.secondsPerWord = n;
      else if (k === "taille de texte minimale") rules.minTextPx = n;
      else rules.minContrast = n;
    } else if (k === "sévérité") {
      for (const part of value.split(",")) {
        const [check, level] = part.split("=").map((s) => s.trim());
        if (!(CHECKS as readonly string[]).includes(check) || !["erreur", "avertissement", "ignoré"].includes(level)) {
          rules.problems.push(`sévérité : ${part.trim()}`);
        } else if (check === "attente") {
          rules.problems.push("sévérité : attente reste une erreur, elle ne se règle pas");
        } else rules.levels[check as CheckName] = level as Level;
      }
    } else rules.problems.push(line);
  }
  return rules;
};
