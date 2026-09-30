import type { VideoDefinition } from "rushit/kit";

const Blank = () => <div style={{ position: "absolute", inset: 0, background: "var(--bg)" }} />;

const definition: VideoDefinition = {
  scenes: [
    { id: "un", at: 0, texts: [], component: Blank },
    { id: "deux", at: 2, texts: [], component: Blank },
  ],
};
export default definition;
