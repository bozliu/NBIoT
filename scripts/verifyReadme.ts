const readme = await Bun.file("README.md").text();
const benchmark = (await Bun.file("docs/results/benchmark.md").text()).trim();
const gif = await Bun.file("docs/assets/hero-workflow.gif").arrayBuffer();
const header = new TextDecoder().decode(new Uint8Array(gif.slice(0, 6)));

const failures: string[] = [];

if (header !== "GIF87a" && header !== "GIF89a") {
  failures.push("docs/assets/hero-workflow.gif is not a GIF file.");
}

if (gif.byteLength < 10_000) {
  failures.push("docs/assets/hero-workflow.gif is unexpectedly small.");
}

if (!readme.includes("![NBIoT Field SDK workflow](docs/assets/hero-workflow.gif)")) {
  failures.push("README.md does not embed the hero workflow GIF.");
}

const start = "<!-- results:start -->";
const end = "<!-- results:end -->";
const section = extract(readme, start, end);
if (section?.trim() !== benchmark) {
  failures.push("README.md result section does not match docs/results/benchmark.md.");
}

if (/screenshot/i.test(readme)) {
  failures.push("README.md mentions screenshots, which are intentionally not the main visual evidence.");
}

if (failures.length > 0) {
  console.error("README verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("README evidence verification passed.");

function extract(content: string, start: string, end: string): string | undefined {
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) return undefined;
  return content.slice(startIndex + start.length, endIndex);
}

export {};
