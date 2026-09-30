export type Args = { positional: string[]; flags: Record<string, string | true> };

/** `--key value`, `--key=value` and bare `--flag`. */
export const parseArgs = (argv: string[]): Args => {
  const positional: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      positional.push(a);
      continue;
    }
    const [key, inline] = a.slice(2).split("=", 2);
    const next = argv[i + 1];
    if (inline !== undefined) flags[key] = inline;
    else if (next !== undefined && !next.startsWith("--")) {
      flags[key] = next;
      i++;
    } else flags[key] = true;
  }
  return { positional, flags };
};

export const output = (json: boolean, human: string, data: unknown) =>
  console.log(json ? JSON.stringify(data) : human);

export const fail = (message: string, json: boolean): never => {
  if (json) console.log(JSON.stringify({ ok: false, error: message }));
  else console.error(message);
  process.exit(1);
};
