import type { ReactNode } from "react";

/** Mirrors tools/qa/rules.ts CHECKS, minus "attente", which cannot be allowed. */
export type AllowableCheck = "chevauchement" | "coupe" | "hors-cadre" | "petit-texte" | "contraste" | "lecture" | "zone";

/** Accepts, for everything inside, the named checks. The reason shows in the report. */
export const Allow: React.FC<{ checks: readonly AllowableCheck[]; reason: string; children: ReactNode }> = ({ checks, reason, children }) => (
  <div data-rushit-allow={checks.join(" ")} data-rushit-reason={reason} style={{ display: "contents" }}>
    {children}
  </div>
);

/** A layer meant to sit over what is below it: its texts are not reported as overlapping. */
export const Layer: React.FC<{ children: ReactNode }> = ({ children }) => (
  <Allow checks={["chevauchement"]} reason="superposition voulue">
    {children}
  </Allow>
);
