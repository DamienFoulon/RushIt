import { AbsoluteFill } from "remotion";
import { Expect, type SceneProps, type VideoDefinition } from "rushit/kit";

const T: React.CSSProperties = { position: "absolute", fontSize: 32, color: "#111", margin: 0, whiteSpace: "nowrap" };
const box = (s: React.CSSProperties) => ({ position: "absolute" as const, ...s });
const bloc = box({ left: 0, top: 0, width: 100, height: 40, background: "#2255aa" });

/** Texts: their own background, inherited opacity, weight, squeezed, overflowing a little, a small overlap, a nested text. */
const Texts = () => (
  <AbsoluteFill>
    <p id="badge" style={{ ...T, left: 100, top: 60, background: "#111", color: "#fff" }}>Badge sombre</p>
    <div style={{ opacity: 0.3 }}><p id="pale-texte" style={{ ...T, left: 100, top: 140 }}>Texte pâle</p></div>
    <p id="gras" style={{ ...T, left: 100, top: 220, fontWeight: 700 }}>Gras</p>
    <p id="ecrase" style={{ ...T, left: 100, top: 300, scale: "1 0.25", transformOrigin: "0 0" }}>Écrasé</p>
    <p id="deborde" style={{ ...T, left: 100, top: 380, width: 150, overflow: "hidden" }}>Déborde un peu</p>
    <p id="frole-a" style={{ ...T, left: 700, top: 60 }}>Il</p>
    <p id="frole-b" style={{ ...T, left: 700, top: 90 }}>Il</p>
    <div id="parent" style={{ ...T, left: 700, top: 300 }}>Texte parent<span id="enfant" style={{ position: "absolute", left: 0, top: 0 }}>Enfant</span></div>
  </AbsoluteFill>
);

/** Expectations: under a transparent layer, under an invisible one, hidden, half transparent, cut by clip-path, cut by an outer box. */
const Blocks = () => (
  <AbsoluteFill>
    <div style={box({ left: 100, top: 100, width: 100, height: 40 })}>
      <Expect id="sous-vitre" visible={[0, 29]}><div style={bloc} /></Expect>
      <div style={box({ left: 0, top: 0, width: 100, height: 40, background: "rgba(0, 0, 0, 0)" })} />
    </div>
    <div style={box({ left: 300, top: 100, width: 100, height: 40 })}>
      <Expect id="sous-fantome" visible={[0, 29]}><div style={bloc} /></Expect>
      <div style={box({ left: 0, top: 0, width: 100, height: 40, background: "#aa2222", opacity: 0 })} />
    </div>
    <div style={box({ left: 500, top: 100 })}><Expect id="invisible" hidden={[0, 29]}><div style={{ ...bloc, visibility: "hidden" }} /></Expect></div>
    <div style={box({ left: 700, top: 100 })}><Expect id="demi" visible={[0, 29]}><div style={{ ...bloc, opacity: 0.5 }} /></Expect></div>
    <div style={box({ left: 100, top: 300, width: 200, height: 40, clipPath: "inset(0 100px 0 0)" })}>
      <Expect id="decoupe" visible={[0, 29]}><div style={box({ left: 0, top: 0, width: 200, height: 40, background: "#2255aa" })} /></Expect>
    </div>
    <div id="exterieur" style={box({ left: 500, top: 300, width: 100, height: 40, overflow: "hidden" })}>
      <div id="interieur" style={box({ left: 0, top: 0, width: 300, height: 40, overflow: "hidden" })}>
        <Expect id="emboite" visible={[0, 29]}><div style={box({ left: 0, top: 0, width: 200, height: 40, background: "#2255aa" })} /></Expect>
      </div>
    </div>
  </AbsoluteFill>
);

/** A clipping box that starts left of the image: the margin is taken to the edge of the image. */
const Edge = () => (
  <AbsoluteFill>
    <div style={box({ left: -100, top: 100, width: 400, height: 200, overflow: "hidden" })}><p style={{ ...T, left: 108, top: 80 }}>Au bord de l'image</p></div>
  </AbsoluteFill>
);

const scenes: [string, React.FC<SceneProps>][] = [["textes", Texts], ["blocs", Blocks], ["bord", Edge]];

const definition: VideoDefinition = {
  scenes: scenes.map(([id, component], i) => ({ id, at: i, texts: [], component })),
};
export default definition;
