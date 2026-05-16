import { spawnSync } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import type { ReadStream, WriteStream } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import type { AtCommandOptions, AtTransport } from "../types";

export interface SerialAtTransportOptions {
  port: string;
  baudRate?: number;
  lineEnding?: string;
}

export class SerialAtTransport implements AtTransport {
  readonly label: string;
  private readonly port: string;
  private readonly baudRate: number;
  private readonly lineEnding: string;
  private reader?: ReadStream;
  private writer?: WriteStream;
  private buffer = "";

  constructor(options: SerialAtTransportOptions) {
    this.port = options.port;
    this.baudRate = options.baudRate ?? 9600;
    this.lineEnding = options.lineEnding ?? "\r";
    this.label = `serial:${this.port}@${this.baudRate}`;
  }

  async open(): Promise<void> {
    configureSerialPort(this.port, this.baudRate);
    this.reader = createReadStream(this.port, { encoding: "utf8" });
    this.writer = createWriteStream(this.port, { encoding: "utf8" });
    this.reader.on("data", (chunk) => {
      this.buffer += chunk;
    });
    await delay(100);
  }

  async close(): Promise<void> {
    this.reader?.destroy();
    this.writer?.end();
  }

  async sendCommand(command: string, options: AtCommandOptions = {}): Promise<string[]> {
    if (!this.writer) {
      throw new Error("Serial transport is not open.");
    }

    this.buffer = "";
    this.writer.write(`${command}${this.lineEnding}`);

    const timeoutMs = options.timeoutMs ?? 5000;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const lines = splitLines(this.buffer).filter((line) => line !== command);
      if (lines.some((line) => line === "OK" || line === "ERROR" || line.startsWith("+CME ERROR"))) {
        return lines;
      }
      await delay(25);
    }

    throw new Error(`Timed out waiting for AT response to ${command}.`);
  }
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n|\r/g)
    .map((line) => line.trim())
    .filter(Boolean);
}

function configureSerialPort(port: string, baudRate: number): void {
  const mac = spawnSync("stty", ["-f", port, String(baudRate), "raw", "-echo"], { stdio: "ignore" });
  if (mac.status === 0) {
    return;
  }

  const linux = spawnSync("stty", ["-F", port, String(baudRate), "raw", "-echo"], { stdio: "ignore" });
  if (linux.status !== 0) {
    throw new Error(`Unable to configure serial port ${port} at ${baudRate} baud.`);
  }
}
