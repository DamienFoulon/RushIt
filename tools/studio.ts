import { fail, parseArgs } from "./lib/cli";
import { videoDir } from "./lib/paths";
import { runRemotion } from "./lib/remotion";

const { positional, flags } = parseArgs(process.argv.slice(2));
const name = positional[0] ?? fail("Usage : npm run studio -- <vidéo>", flags.json === true);
runRemotion(["studio"], videoDir(name));
