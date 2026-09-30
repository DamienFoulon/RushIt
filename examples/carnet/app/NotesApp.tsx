// Carnet, a fictional notes app, drawn for the example at the window's logical size (1440×900).

export type Note = { readonly title: string; readonly tag: string; readonly when: string };

export const notes: readonly Note[] = [
  { title: "Idées pour l'atelier de jeudi", tag: "atelier", when: "Aujourd'hui" },
  { title: "Questions pour le fournisseur", tag: "achats", when: "Hier" },
  { title: "Plan du trimestre", tag: "équipe", when: "Lundi" },
  { title: "Lectures à rattraper", tag: "perso", when: "12 sept." },
];

export const NotesApp: React.FC<{ visible: number; draft?: string; highlight?: number }> = ({ visible, draft, highlight }) => (
  <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "280px 1fr", background: "var(--surface)" }}>
    <aside style={{ borderRight: "1px solid var(--line)", padding: "32px 24px", fontSize: 18, color: "var(--muted)" }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--ink)", marginBottom: 32 }}>Carnet</div>
      {["Toutes les notes", "atelier", "achats", "équipe", "perso"].map((t, i) => (
        <div key={t} style={{ padding: "10px 12px", borderRadius: 8, background: i === 0 ? "var(--bg)" : "transparent", color: i === 0 ? "var(--ink)" : undefined }}>
          {i === 0 ? t : `# ${t}`}
        </div>
      ))}
    </aside>
    <main style={{ padding: "40px 48px" }}>
      <div style={{ fontSize: 34, fontWeight: 700, marginBottom: 24 }}>Toutes les notes</div>
      {draft !== undefined && (
        <div style={{ border: "2px solid var(--accent)", borderRadius: 12, padding: "18px 20px", fontSize: 24, marginBottom: 16 }}>
          {draft}
          <span style={{ borderLeft: "2px solid var(--accent)", marginLeft: 2 }} />
        </div>
      )}
      {notes.slice(0, visible).map((n, i) => (
        <div
          key={n.title}
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px",
            borderRadius: 12, marginBottom: 12, fontSize: 24,
            background: highlight === i ? "var(--bg)" : "transparent", border: "1px solid var(--line)",
          }}
        >
          <span>{n.title}</span>
          <span style={{ fontSize: 18, color: "var(--accent)" }}># {n.tag} · {n.when}</span>
        </div>
      ))}
    </main>
  </div>
);
