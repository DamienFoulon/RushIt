import type { VideoDefinition } from "rushit/kit";
import { Capture } from "./scenes/Capture";
import { Logo } from "./scenes/Logo";
import { Reveal } from "./scenes/Reveal";
import { Scattered } from "./scenes/Scattered";
import { texts } from "./texts";

const definition: VideoDefinition = {
  scenes: [
    { id: "scattered", title: "Éparpillées", at: 0, texts: texts.scattered, component: Scattered },
    { id: "reveal", title: "Carnet", at: 4.4, texts: texts.reveal, component: Reveal },
    { id: "capture", title: "Au clavier", at: 11, texts: texts.capture, component: Capture },
    { id: "logo", title: "Logo", at: 15.5, texts: texts.logo, component: Logo },
  ],
};
export default definition;
