// Carnet, a fictional notes app, drawn for the example at the window's logical size (1096×685),
// the size of the stage: in the wide shot, one logical pixel is one pixel of the image, and no
// text is under 24 px. Every height is fixed, so that the scenes can frame the list from its exact box.

import type { Box } from "rushit/kit";

export type Note = { readonly title: string; readonly preview: string; readonly tag: string; readonly when: string };

export const notes: readonly Note[] = [
  { title: "Idées pour l'atelier de jeudi", preview: "Trois exercices, un tour de table, la pause à 10 h 30.", tag: "atelier", when: "Aujourd'hui" },
  { title: "Questions pour le fournisseur", preview: "Délais de livraison, remise sur volume, contact de secours.", tag: "achats", when: "Hier" },
  { title: "Plan du trimestre", preview: "Deux lancements, un recrutement, la revue de septembre.", tag: "équipe", when: "Lundi" },
  { title: "Lectures à rattraper", preview: "Le rapport annuel, deux articles, un livre prêté.", tag: "perso", when: "12 sept." },
];

const tags = ["Toutes les notes", "atelier", "achats", "équipe", "perso"];

/** The app's geometry, in logical window pixels. */
export const app = {
  sidebar: 248,
  top: 56,
  main: { left: 288, right: 1048 },
  heading: 44,
  headingGap: 20,
  row: 88,
  rowGap: 12,
  draftGap: 16,
} as const;

const rowsTop = app.top + app.heading + app.headingGap;

/** Top of note `i`, with the draft slot open by `open` (0 to 1). */
export const rowTop = (i: number, open = 0) => rowsTop + open * (app.row + app.draftGap) + i * (app.row + app.rowGap);

/** The heading and every note, with room for the draft when `withDraft`. */
export const listBox = (withDraft: boolean): Box => ({
  left: app.main.left,
  right: app.main.right,
  top: app.top,
  bottom: rowTop(notes.length - 1, withDraft ? 1 : 0) + app.row,
});

export type Draft = {
  readonly text: string;
  /** 0 → 1: the slot opens and pushes the notes down. */
  readonly open: number;
  /** 0 → 1: Entrée pressed, the draft becomes a note. */
  readonly saved: number;
};

type Props = {
  /** Entrance of each note, 0 → 1. */
  readonly rows: readonly number[];
  /** Opacity of the sidebar's wordmark and tags, in that order (six values). */
  readonly sidebar?: readonly number[];
  readonly heading?: number;
  readonly draft?: Draft;
  /** Hover on the first note, 0 → 1. */
  readonly hover?: number;
};

const mix = (from: string, to: string, p: number) => `color-mix(in srgb, ${to} ${Math.round(p * 100)}%, ${from})`;

export const NotesApp: React.FC<Props> = ({ rows, sidebar = [1, 1, 1, 1, 1, 1], heading = 1, draft, hover = 0 }) => (
  <div style={{ position: "absolute", inset: 0, background: "var(--surface)" }}>
    <aside
      style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: app.sidebar,
        borderRight: `1px solid ${mix("transparent", "var(--line)", sidebar[0])}`,
        padding: `${app.top}px 12px 0 24px`, boxSizing: "border-box", fontSize: 24, color: "var(--muted)", whiteSpace: "nowrap",
      }}
    >
      <div style={{ fontSize: 28, lineHeight: "34px", fontWeight: 700, color: "var(--ink)", margin: "0 12px 24px", opacity: sidebar[0] }}>
        Carnet
      </div>
      {tags.map((t, i) => (
        <div
          key={t}
          style={{
            padding: "8px 12px", borderRadius: 8, lineHeight: "30px", opacity: sidebar[i + 1],
            background: i === 0 ? "var(--bg)" : "transparent", color: i === 0 ? "var(--ink)" : undefined,
          }}
        >
          {i === 0 ? t : `# ${t}`}
        </div>
      ))}
    </aside>
    <div
      style={{
        position: "absolute", left: app.main.left, top: app.top, height: app.heading, lineHeight: `${app.heading}px`,
        fontSize: 34, fontWeight: 700, opacity: heading, whiteSpace: "nowrap",
      }}
    >
      Toutes les notes
    </div>
    {draft && (
      <Row top={rowsTop} opacity={Math.max(0, Math.min(1, (draft.open - 0.8) / 0.2))} border={mix("var(--accent)", "var(--line)", draft.saved)} weight={2}>
        <span style={{ lineHeight: "32px" }}>
          {draft.text}
          {draft.saved === 0 && <span style={{ borderLeft: "2px solid var(--accent)", marginLeft: 2 }} />}
        </span>
        <span style={{ fontSize: 24, lineHeight: "30px", color: "var(--accent)", opacity: draft.saved }}># achats · À l'instant</span>
      </Row>
    )}
    {notes.map((n, i) => {
      const p = rows[i] ?? 0;
      return (
        <Row
          key={n.title}
          top={rowTop(i, draft?.open) + (1 - p) * 16}
          opacity={p}
          background={i === 0 ? mix("var(--surface)", "var(--bg)", hover) : undefined}
        >
          <span style={{ display: "flex", justifyContent: "space-between", gap: 24, lineHeight: "32px" }}>
            <span>{n.title}</span>
            <span style={{ fontSize: 24, color: "var(--accent)" }}># {n.tag} · {n.when}</span>
          </span>
          <span style={{ fontSize: 24, lineHeight: "30px", color: "var(--muted)" }}>{n.preview}</span>
        </Row>
      );
    })}
  </div>
);

const Row: React.FC<{ top: number; opacity: number; border?: string; weight?: number; background?: string; children: React.ReactNode }> = ({
  top, opacity, border = "var(--line)", weight = 1, background = "transparent", children,
}) => (
  <div
    style={{
      position: "absolute", left: app.main.left, width: app.main.right - app.main.left, top, height: app.row, boxSizing: "border-box",
      display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, padding: "0 24px", whiteSpace: "nowrap",
      borderRadius: 12, fontSize: 26, border: `${weight}px solid ${border}`, background, opacity,
    }}
  >
    {children}
  </div>
);
