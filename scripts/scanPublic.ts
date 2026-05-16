const forbiddenPathPatterns = [
  /(^|\/)\.git(\/|$)/,
  /(^|\/)\.DS_Store$/,
  /(^|\/)\.omx(\/|$)/,
  /^(Prompt|Plan|Implement|Documentation)\.md$/,
  /\.(exe|dll|rar|zip|7z|tar|tar\.gz|chm)$/i
];

const forbiddenContentPatterns = [
  { name: "local user path", pattern: /\/Users\/[A-Za-z0-9._-]+/ },
  { name: "internal partner label", pattern: new RegExp(`\\b(${["Bo", "sch"].join("")}|Robert ${["Bo", "sch"].join("")}|${["Intern", "ship"].join("")})\\b`, "i") },
  { name: "old AllThingsTalk maker token", pattern: /maker:[A-Za-z0-9._-]{8,}/ },
  { name: "old demo identifiers", pattern: new RegExp(`\\b(${["SGH0", "FS06"].join("")}|${["BAE1", "SGH"].join("")})\\b`) },
  { name: "old hardcoded endpoint", pattern: /\b(111\.231\.139\.125|114\.115\.144\.122)\b/ },
  { name: "private key material", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "private network endpoint", pattern: /\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})\b/ },
  { name: "assigned credential value", pattern: /\b(API_KEY|SECRET|PASSWORD|TOKEN)\s*[:=]\s*['"][A-Za-z0-9_./+=-]{12,}['"]/i }
];

const textExtensions = new Set([
  "",
  ".c",
  ".cc",
  ".cpp",
  ".css",
  ".h",
  ".html",
  ".ino",
  ".js",
  ".json",
  ".lock",
  ".md",
  ".mjs",
  ".svg",
  ".toml",
  ".ts",
  ".txt",
  ".yaml",
  ".yml"
]);

type Finding = {
  file: string;
  reason: string;
  line?: number;
};

const files = await gitLsFiles();
const findings: Finding[] = [];

for (const file of files) {
  for (const pattern of forbiddenPathPatterns) {
    if (pattern.test(file)) {
      findings.push({ file, reason: `forbidden tracked path: ${pattern}` });
    }
  }

  if (!isLikelyText(file)) continue;

  const content = await Bun.file(file).text();
  const lines = content.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const { name, pattern } of forbiddenContentPatterns) {
      if (pattern.test(line)) {
        findings.push({ file, reason: name, line: index + 1 });
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Public scan found publish blockers:");
  for (const finding of findings) {
    const location = finding.line ? `${finding.file}:${finding.line}` : finding.file;
    console.error(`- ${location} ${finding.reason}`);
  }
  process.exit(1);
}

console.log("Public scan passed.");

async function gitLsFiles(): Promise<string[]> {
  const proc = Bun.spawn(["git", "ls-files", "--cached", "--others", "--exclude-standard"], { stdout: "pipe", stderr: "pipe" });
  const [exit, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text()
  ]);
  if (exit !== 0) {
    throw new Error(`git ls-files failed:\n${stderr}`);
  }
  return stdout.split(/\r?\n/).filter(Boolean);
}

function isLikelyText(file: string): boolean {
  const lower = file.toLowerCase();
  const dot = lower.lastIndexOf(".");
  const ext = dot === -1 ? "" : lower.slice(dot);
  return textExtensions.has(ext);
}

export {};
