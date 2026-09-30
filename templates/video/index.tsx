import type { VideoDefinition } from "rushit/kit";
import { Intro } from "./scenes/Intro";
import { texts } from "./texts";

const definition: VideoDefinition = {
  scenes: [{ id: "intro", title: "Intro", at: 0, texts: texts.intro, component: Intro }],
};
export default definition;
