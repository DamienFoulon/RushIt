import { AbsoluteFill } from "remotion";
import { Allow, Expect, Layer, type SceneProps, type VideoDefinition } from "rushit/kit";

const T: React.CSSProperties = { position: "absolute", fontSize: 32, color: "#111", margin: 0 };
const box = (s: React.CSSProperties) => ({ position: "absolute" as const, ...s });

const Overlap = () => (
  <AbsoluteFill>
    <p style={{ ...T, left: 500, top: 200 }}>Premier texte ici</p><p style={{ ...T, left: 520, top: 210 }}>Second texte ici</p>
    <div style={box({ left: 500, top: 400, rotate: "6deg" })}><p style={{ ...T, position: "static", whiteSpace: "nowrap" }}>Carte penchée A</p></div>
    <div style={box({ left: 520, top: 410, rotate: "-6deg" })}><p style={{ ...T, position: "static", whiteSpace: "nowrap" }}>Carte penchée B</p></div>
  </AbsoluteFill>
);
const Cut = () => (<AbsoluteFill><div style={box({ left: 500, top: 200, width: 120, overflow: "hidden", whiteSpace: "nowrap" })}><p style={{ ...T, position: "static" }}>Un texte beaucoup trop long</p></div></AbsoluteFill>);
const OffFrame = () => (<AbsoluteFill><p style={{ ...T, left: 1180, top: 300, whiteSpace: "nowrap" }}>Hors du cadre à droite</p></AbsoluteFill>);
const Clipped = () => (<AbsoluteFill><div style={box({ left: 500, top: 200, width: 200, height: 40, overflow: "hidden" })}><Expect id="rogne" visible={[0, 29]}><div style={box({ left: 0, top: 0, width: 300, height: 40, background: "#2255aa" })} /></Expect></div></AbsoluteFill>);
const Covered = () => (<AbsoluteFill><div style={box({ left: 500, top: 200, rotate: "8deg", scale: "0.9" })}><Expect id="couvert" visible={[0, 29]}><div style={box({ left: 0, top: 0, width: 300, height: 80, background: "#2255aa" })} /></Expect><div style={box({ left: 0, top: 0, width: 300, height: 30, background: "#aa2222" })} /></div></AbsoluteFill>);
const Faded = () => (<AbsoluteFill style={{ opacity: 0.3 }}><Expect id="pale" visible={[0, 29]}><div style={box({ left: 500, top: 200, width: 200, height: 80, background: "#2255aa" })} /></Expect></AbsoluteFill>);
const Tiny = () => (<AbsoluteFill><p style={{ ...T, left: 500, top: 200, fontSize: 40, scale: "0.25", transformOrigin: "0 0" }}>Minuscule à l'écran</p></AbsoluteFill>);
const ShouldHide = () => (<AbsoluteFill><Expect id="cache" hidden={[0, 29]}><div style={box({ left: 500, top: 200, width: 200, height: 80, background: "#2255aa" })} /></Expect></AbsoluteFill>);
const NotMounted = () => (<AbsoluteFill><Expect id="absent" visible={[0, 29]}>{null}</Expect></AbsoluteFill>);
const LowContrast = () => (<AbsoluteFill><p style={{ ...T, left: 500, top: 200, color: "#dddddd" }}>Contraste faible</p></AbsoluteFill>);
const OutOfZone = () => (<AbsoluteFill><p style={{ ...T, left: 400, top: 680, fontSize: 24, whiteSpace: "nowrap" }}>Texte entre les zones</p></AbsoluteFill>);
const Margin = () => (<AbsoluteFill><div style={box({ left: 500, top: 200, width: 400, height: 200, overflow: "hidden" })}><p style={{ ...T, right: 8, top: 80, whiteSpace: "nowrap" }}>Collé au bord</p></div></AbsoluteFill>);
const Clean = () => (
  <AbsoluteFill>
    <Layer><p style={{ ...T, left: 500, top: 200 }}>Superposition voulue</p></Layer>
    <p style={{ ...T, left: 505, top: 205 }}>Dessous</p>
    <Allow checks={["petit-texte"]} reason="détail en plan large"><p style={{ ...T, left: 500, top: 400, fontSize: 12 }}>Détail accepté</p></Allow>
    <div style={box({ left: 800, top: 300, rotate: "12deg" })}><p style={{ ...T, position: "static" }}>Carte tournée</p></div>
    <div style={box({ left: 460, top: 450, rotate: "-4deg", whiteSpace: "nowrap" })}>
      <p style={{ ...T, position: "static" }}>Titre soigneusement</p>
      <p style={{ ...T, position: "static", marginTop: 4 }}>Ligne juste-dessous</p>
    </div>
    <Expect id="cache-propre" hidden={[0, 29]}><div style={box({ left: 500, top: 500, width: 100, height: 40, background: "#2255aa", opacity: 0 })} /></Expect>
  </AbsoluteFill>
);

const scenes: [string, React.FC<SceneProps>, string[]][] = [
  ["chevauchement", Overlap, []], ["coupe", Cut, []], ["hors-cadre", OffFrame, []], ["rogne", Clipped, []],
  ["couvert", Covered, []], ["pale", Faded, []], ["petit", Tiny, []], ["cache", ShouldHide, []],
  ["absent", NotMounted, []], ["contraste", LowContrast, []], ["zone", OutOfZone, ["Une ligne de colonne longue à lire"]], ["propre", Clean, []],
  ["marge", Margin, []],
];

const definition: VideoDefinition = {
  scenes: scenes.map(([id, component, texts], i) => ({ id, at: i, texts, component })),
};
export default definition;
