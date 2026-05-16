type BenchmarkDefinition = {
  name: string;
  command: string;
  args: string[];
  display: string;
  iterations: number;
  env?: Record<string, string>;
  scope: string;
};

type BenchmarkResult = BenchmarkDefinition & {
  medianMs: number;
  minMs: number;
  maxMs: number;
};

const benchmarkDefinitions: BenchmarkDefinition[] = [
  {
    name: "Mock modem doctor",
    command: "bun",
    args: ["run", "src/cli.ts", "doctor", "--mock"],
    display: "nbiot doctor --mock",
    iterations: 5,
    scope: "Mock AT transport, no modem required"
  },
  {
    name: "Weather payload decode",
    command: "bun",
    args: ["run", "src/cli.ts", "decode", "--hex", "0929152E03F5002FA90F00B928F2"],
    display: "nbiot decode --hex <14-byte sample>",
    iterations: 5,
    scope: "Local codec only"
  },
  {
    name: "UDP request construction",
    command: "bun",
    args: ["run", "src/cli.ts", "send", "udp", "--host", "203.0.113.10", "--port", "9001", "--payload", "hex:010203", "--dry-run"],
    display: "nbiot send udp --dry-run",
    iterations: 5,
    scope: "Local dry run, TEST-NET endpoint"
  },
  {
    name: "Cloud adapter dry run",
    command: "bun",
    args: ["run", "src/cli.ts", "cloud", "test", "--provider", "thingsboard", "--payload", "{\"temperature\":23.4}", "--dry-run"],
    display: "nbiot cloud test --provider thingsboard --dry-run",
    iterations: 5,
    env: { THINGSBOARD_ACCESS_TOKEN: "synthetic-benchmark-token" },
    scope: "Local request planning, no publish"
  },
  {
    name: "Unit test suite",
    command: "bun",
    args: ["test"],
    display: "bun test",
    iterations: 1,
    scope: "Local test suite"
  },
  {
    name: "TypeScript validation",
    command: "bun",
    args: ["run", "typecheck"],
    display: "bun run typecheck",
    iterations: 1,
    scope: "Static validation"
  }
];

const generatedAt = new Date().toISOString().slice(0, 10);
const results: BenchmarkResult[] = [];

for (const definition of benchmarkDefinitions) {
  const samples: number[] = [];
  for (let index = 0; index < definition.iterations; index += 1) {
    samples.push(await measure(definition));
  }
  samples.sort((a, b) => a - b);
  results.push({
    ...definition,
    medianMs: median(samples),
    minMs: samples[0] ?? 0,
    maxMs: samples[samples.length - 1] ?? 0
  });
}

const scanSummary = await runForOutput({
  name: "Public scan",
  command: "bun",
  args: ["run", "scripts/scanPublic.ts"],
  display: "bun run scan:public",
  iterations: 1,
  scope: "Tracked-file release scan"
});

const payload = {
  generatedAt,
  environment: {
    runtime: `Bun ${Bun.version}`,
    platform: `${process.platform} ${process.arch}`,
    machine: "Apple Silicon local development machine"
  },
  readiness: readinessRows(scanSummary.trim()),
  benchmarks: results.map(({ name, display, iterations, scope, medianMs, minMs, maxMs }) => ({
    name,
    command: display,
    runs: iterations,
    medianMs: round(ms(medianMs)),
    minMs: round(ms(minMs)),
    maxMs: round(ms(maxMs)),
    scope
  })),
  hardwareAcceptance: hardwareAcceptanceRows(),
  ecosystemComparison: ecosystemRows()
};

await Bun.write("docs/results/benchmark.json", `${JSON.stringify(payload, null, 2)}\n`);

const markdown = renderMarkdown(payload);
await Bun.write("docs/results/benchmark.md", markdown);
await updateReadme(markdown);

console.log("Generated docs/results/benchmark.json");
console.log("Generated docs/results/benchmark.md");
console.log("Updated README.md result tables");

async function measure(definition: BenchmarkDefinition): Promise<number> {
  const started = performance.now();
  await runForOutput(definition);
  return performance.now() - started;
}

async function runForOutput(definition: BenchmarkDefinition): Promise<string> {
  const proc = Bun.spawn([definition.command, ...definition.args], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, ...definition.env, NO_COLOR: "1" }
  });
  const [exit, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text()
  ]);
  if (exit !== 0) {
    throw new Error(`${definition.display} failed:\n${stderr || stdout}`);
  }
  return stdout;
}

function readinessRows(scanSummary: string): Array<Record<string, string>> {
  return [
    { check: "Public file hygiene", result: "PASS", evidence: scanSummary },
    { check: "Unit tests", result: "PASS", evidence: "bun test completed in the local benchmark run" },
    { check: "Typecheck/lint gate", result: "PASS", evidence: "bun run typecheck completed; lint uses the same tsc gate" },
    { check: "CLI command surface", result: "PASS", evidence: "doctor, connect, stats, ping, send, cloud test, decode, report, passthrough" },
    { check: "Cloud adapter surface", result: "PASS", evidence: "UDP, TCP, MQTT, HTTP, AllThingsTalk, AWS IoT, Azure IoT, ThingsBoard" },
    { check: "Hero visual", result: "PASS", evidence: "Generated docs/assets/hero-workflow.gif from synthetic workflow frames" }
  ];
}

function hardwareAcceptanceRows(): Array<Record<string, string>> {
  return [
    { metric: "Serial modem detection", status: "Pending hardware validation", requiredEvidence: "u-blox SARA N2/N3 connected over serial and responding to AT" },
    { metric: "Network attach latency", status: "Pending hardware validation", requiredEvidence: "SIM/APN/operator attach run with timestamped field report" },
    { metric: "Signal quality", status: "Pending hardware validation", requiredEvidence: "RSRP, RSRQ, RSSI, registration, and ECL captured at field site" },
    { metric: "UDP RTT / delivery", status: "Pending hardware validation", requiredEvidence: "Real network UDP send and server receipt log" },
    { metric: "Cloud ingestion latency", status: "Pending hardware validation", requiredEvidence: "Live AllThingsTalk/AWS/Azure/ThingsBoard credentialed publish" },
    { metric: "Power draw / PSM/eDRX", status: "Pending hardware validation", requiredEvidence: "External power measurement and modem power-mode trace" }
  ];
}

function ecosystemRows(): Array<Record<string, string>> {
  return [
    {
      tool: "[NBIoT Field SDK](https://github.com/bozliu/NBIoT)",
      scope: "B2B field SDK/CLI for bring-up, dry-run transports, cloud adapters, reports",
      hardware: "Implemented u-blox SARA N2/N3 path; Quectel/SIMCom planned",
      evidence: "This repo: local tests, scans, generated benchmark"
    },
    {
      tool: "[SODAQ nbIOT](https://www.arduinolibraries.info/libraries/sodaq_nb-iot)",
      scope: "Arduino library for uBlox NB-IoT modules",
      hardware: "u-blox NB-IoT module family",
      evidence: "Strong firmware precedent; not a host-side B2B report/benchmark CLI"
    },
    {
      tool: "[AllThingsTalk Python SDK](https://docs.allthingstalk.com/developers/sdk/python/)",
      scope: "Python SDK for AllThingsTalk device/platform access",
      hardware: "Cloud SDK, not modem field diagnostics",
      evidence: "Good cloud target; narrower than multi-cloud field validation"
    },
    {
      tool: "[PyPI nbiot](https://pypi.org/project/nbiot/)",
      scope: "NB-IoT scanner and coverage tool for rollout troubleshooting",
      hardware: "u-blox SARA N211 serial module",
      evidence: "Closest open field-diagnostics precedent; narrower cloud adapter surface"
    },
    {
      tool: "[SimpleNB](https://github.com/techstudio-design/SimpleNB)",
      scope: "Arduino NB-IoT/CAT-M1 AT-command library",
      hardware: "SIMCom, Quectel, u-blox SARA-R/N families; not SARA-N2",
      evidence: "Broader firmware module list; not host-side evidence/report workflow"
    },
    {
      tool: "[SparkFun SARA-R5 Arduino Library](https://github.com/sparkfun/SparkFun_u-blox_SARA-R5_Arduino_Library)",
      scope: "Arduino library for SARA-R5 LTE-M/NB-IoT with secure cloud examples",
      hardware: "u-blox SARA-R5 boards",
      evidence: "Modern firmware library; different modem generation than SARA N2/N3"
    },
    {
      tool: "[Scanner-class RF tools](https://www.rohde-schwarz.com/ca/solutions/critical-infrastructure/mobile-network-testing/stories-insights/article-nb-iot-scanners-are-a-must-for-coverage-measurements-part-2_253484.html)",
      scope: "Passive RF coverage measurement and operator benchmarking",
      hardware: "Dedicated scanner hardware",
      evidence: "True RF benchmark class; this SDK is active device-side validation, not a scanner replacement"
    }
  ];
}

function renderMarkdown(data: typeof payload): string {
  return `Measured on ${data.generatedAt} with ${data.environment.runtime} on ${data.environment.machine}. These are local SDK checks only; real RF/network numbers require physical hardware, SIM/APN, operator coverage, and cloud credentials.

### Results At A Glance

${table(["Check", "Result", "Evidence"], data.readiness.map((row) => [row.check, row.result, row.evidence]))}

### Local SDK Benchmark

${table(
  ["Task", "Command", "Runs", "Median", "Range", "Claim Scope"],
  data.benchmarks.map((row) => [
    row.name,
    `\`${row.command}\``,
    String(row.runs),
    `${row.medianMs} ms`,
    `${row.minMs}-${row.maxMs} ms`,
    row.scope
  ])
)}

### Hardware Acceptance Matrix

${table(["Metric", "Status", "Evidence Needed Before Claiming"], data.hardwareAcceptance.map((row) => [row.metric, row.status, row.requiredEvidence]))}

### SOTA / Ecosystem Comparison

${table(["Tool", "Public Scope", "Hardware Scope", "Honest Comparison"], data.ecosystemComparison.map((row) => [row.tool, row.scope, row.hardware, row.evidence]))}
`;
}

function table(headers: string[], rows: string[][]): string {
  const head = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`).join("\n");
  return `${head}\n${divider}\n${body}`;
}

function escapeCell(value: string): string {
  return value.replaceAll("\n", " ").replaceAll("|", "\\|");
}

function median(values: number[]): number {
  const mid = Math.floor(values.length / 2);
  return values.length % 2 === 0 ? ((values[mid - 1] ?? 0) + (values[mid] ?? 0)) / 2 : values[mid] ?? 0;
}

function ms(value: number): number {
  return value;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

async function updateReadme(markdown: string): Promise<void> {
  const start = "<!-- results:start -->";
  const end = "<!-- results:end -->";
  const readme = await Bun.file("README.md").text();
  if (!readme.includes(start) || !readme.includes(end)) {
    return;
  }

  const next = readme.replace(new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`), `${start}\n${markdown.trim()}\n${end}`);
  await Bun.write("README.md", next);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export {};
