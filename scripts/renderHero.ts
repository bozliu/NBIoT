import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const WIDTH = 1080;
const HEIGHT = 560;
const FRAME_COUNT = 54;
const FPS = 12;
const OUTPUT = "docs/assets/hero-workflow.gif";

const steps = [
  { label: "AT check", detail: "modem responds", color: "#2563eb" },
  { label: "Attach", detail: "SIM/APN ready", color: "#0f766e" },
  { label: "Signal", detail: "RSRP/RSRQ/ECL", color: "#7c3aed" },
  { label: "Transport", detail: "UDP/MQTT/HTTP", color: "#c2410c" },
  { label: "Cloud", detail: "adapter dry run", color: "#15803d" },
  { label: "Report", detail: "field evidence", color: "#be123c" }
];

async function main(): Promise<void> {
  await requireTool("rsvg-convert");
  await requireTool("ffmpeg");

  const workdir = await mkdtemp(join(tmpdir(), "nbiot-hero-"));
  try {
    for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
      const svg = renderSvg(frame);
      const svgPath = join(workdir, `frame-${String(frame).padStart(3, "0")}.svg`);
      const pngPath = join(workdir, `frame-${String(frame).padStart(3, "0")}.png`);
      await Bun.write(svgPath, svg);
      await run(["rsvg-convert", svgPath, "-w", String(WIDTH), "-h", String(HEIGHT), "-o", pngPath]);
    }

    await run([
      "ffmpeg",
      "-y",
      "-framerate",
      String(FPS),
      "-i",
      join(workdir, "frame-%03d.png"),
      "-vf",
      "split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
      "-loop",
      "0",
      OUTPUT
    ]);
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }

  console.log(`Generated ${OUTPUT}`);
}

function renderSvg(frame: number): string {
  const cycle = frame / FRAME_COUNT;
  const active = Math.min(steps.length - 1, Math.floor(cycle * steps.length));
  const packetX = 130 + cycle * 760;
  const packetY = 275 - Math.sin(cycle * Math.PI * 2) * 18;
  const terminalLines = [
    "$ nbiot doctor --mock",
    '{ "ok": true, "transport": "mock" }',
    "$ nbiot stats",
    '{ "rsrp": -92, "ecl": 0 }',
    "$ nbiot cloud test --dry-run",
    '{ "provider": "thingsboard", "dryRun": true }'
  ];
  const visibleLines = terminalLines.slice(0, 2 + (active % 5));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="55%" stop-color="#eef7f4"/>
      <stop offset="100%" stop-color="#fff7ed"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect x="34" y="34" width="1012" height="492" rx="20" fill="#ffffff" opacity="0.94" filter="url(#shadow)"/>

  <text x="70" y="90" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800" fill="#111827">NBIoT Field SDK</text>
  <text x="70" y="125" font-family="Inter, Arial, sans-serif" font-size="18" fill="#475569">Evidence-driven modem bring-up, transport validation, and cloud ingestion checks.</text>

  <rect x="70" y="155" width="410" height="160" rx="12" fill="#111827"/>
  <circle cx="94" cy="178" r="6" fill="#ef4444"/>
  <circle cx="116" cy="178" r="6" fill="#f59e0b"/>
  <circle cx="138" cy="178" r="6" fill="#22c55e"/>
  ${visibleLines
    .map((line, index) => {
      const color = line.startsWith("$") ? "#7dd3fc" : "#d1fae5";
      return `<text x="92" y="${212 + index * 20}" font-family="SFMono-Regular, Menlo, monospace" font-size="14" fill="${color}">${escapeXml(line)}</text>`;
    })
    .join("\n  ")}
  <rect x="${92 + ((frame % 18) * 7)}" y="${296}" width="8" height="16" fill="#e2e8f0" opacity="${frame % 12 < 6 ? 0.9 : 0.25}"/>

  <path d="M 132 370 C 280 330, 380 410, 520 368 S 770 340, 895 374" fill="none" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/>
  <circle cx="${packetX.toFixed(1)}" cy="${packetY.toFixed(1)}" r="10" fill="#0f766e"/>
  <circle cx="${packetX.toFixed(1)}" cy="${packetY.toFixed(1)}" r="${18 + (frame % 10)}" fill="none" stroke="#0f766e" stroke-width="3" opacity="0.18"/>

  ${steps
    .map((step, index) => {
      const x = 84 + index * 155;
      const isActive = index === active;
      const fill = isActive ? step.color : "#ffffff";
      const stroke = isActive ? step.color : "#cbd5e1";
      const text = isActive ? "#ffffff" : "#1f2937";
      const detail = isActive ? "#f8fafc" : "#64748b";
      return `<g>
    <rect x="${x}" y="335" width="132" height="76" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <text x="${x + 18}" y="366" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="800" fill="${text}">${escapeXml(step.label)}</text>
    <text x="${x + 18}" y="392" font-family="Inter, Arial, sans-serif" font-size="13" fill="${detail}">${escapeXml(step.detail)}</text>
  </g>`;
    })
    .join("\n  ")}

  <rect x="540" y="155" width="420" height="160" rx="14" fill="#f8fafc" stroke="#dbeafe"/>
  <text x="570" y="190" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" fill="#111827">Field evidence, not screenshots</text>
  ${metricRow(570, 222, "Release scan", "PASS", "#15803d")}
  ${metricRow(570, 252, "Mock modem path", "PASS", "#15803d")}
  ${metricRow(570, 282, "Live RF latency", "PENDING HW", "#c2410c")}

  <rect x="70" y="448" width="890" height="42" rx="12" fill="#ecfeff" stroke="#a5f3fc"/>
  <text x="96" y="475" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700" fill="#0f172a">B2B use: validate SIM/APN, coverage symptoms, telemetry paths, and cloud payloads before field rollout.</text>
</svg>`;
}

function metricRow(x: number, y: number, label: string, value: string, color: string): string {
  return `<text x="${x}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="15" fill="#334155">${escapeXml(label)}</text>
  <rect x="${x + 230}" y="${y - 20}" width="120" height="26" rx="13" fill="${color}"/>
  <text x="${x + 245}" y="${y - 2}" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="800" fill="#ffffff">${escapeXml(value)}</text>`;
}

async function requireTool(name: string): Promise<void> {
  const proc = Bun.spawn(["which", name], { stdout: "pipe", stderr: "pipe" });
  if ((await proc.exited) !== 0) {
    throw new Error(`${name} is required to render the hero GIF.`);
  }
}

async function run(cmd: string[]): Promise<void> {
  const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
  const [exit, stderr] = await Promise.all([proc.exited, new Response(proc.stderr).text()]);
  if (exit !== 0) {
    throw new Error(`${cmd.join(" ")} failed:\n${stderr}`);
  }
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

await main();
