import { describe, expect, test } from "bun:test";

describe("CLI", () => {
  test("runs doctor against mock transport", async () => {
    const proc = Bun.spawn(["bun", "run", "src/cli.ts", "doctor", "--mock"], {
      stdout: "pipe",
      stderr: "pipe"
    });
    const output = await new Response(proc.stdout).text();
    const exit = await proc.exited;

    expect(exit).toBe(0);
    expect(JSON.parse(output)).toEqual({ ok: true, transport: "mock" });
  });

  test("decodes payload", async () => {
    const proc = Bun.spawn(["bun", "run", "src/cli.ts", "decode", "--hex", "0929152E03F5002FA90F00B928F2"], {
      stdout: "pipe",
      stderr: "pipe"
    });
    const output = await new Response(proc.stdout).text();
    const exit = await proc.exited;

    expect(exit).toBe(0);
    expect(JSON.parse(output).pressureMbar).toBe(1013);
  });
});
