export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    const raw = arg.slice(2);
    const equalsIndex = raw.indexOf("=");
    if (equalsIndex >= 0) {
      flags[raw.slice(0, equalsIndex)] = raw.slice(equalsIndex + 1);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      flags[raw] = next;
      index += 1;
    } else {
      flags[raw] = true;
    }
  }

  return { positionals, flags };
}

export function readString(flags: Record<string, string | boolean>, name: string, fallback?: string): string | undefined {
  const value = flags[name];
  if (typeof value === "string") {
    return value;
  }
  return fallback;
}

export function requireString(flags: Record<string, string | boolean>, name: string): string {
  const value = readString(flags, name);
  if (!value) {
    throw new Error(`Missing required --${name}.`);
  }
  return value;
}

export function readNumber(flags: Record<string, string | boolean>, name: string, fallback?: number): number | undefined {
  const value = readString(flags, name);
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`--${name} must be a number.`);
  }
  return parsed;
}

export function readBoolean(flags: Record<string, string | boolean>, name: string): boolean {
  return flags[name] === true || flags[name] === "true";
}
