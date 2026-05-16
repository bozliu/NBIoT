#!/usr/bin/env bun
import { createHttpAdapter, createMqttAdapter, createTcpAdapter, createUdpAdapter } from "./cloud/adapters";
import { createCloudProviderAdapter, type CloudProviderName } from "./cloud/providers";
import { decodeWeatherPayload } from "./codec/weatherPayload";
import { UbloxSaraModem } from "./modems/ubloxSara";
import { createFieldReport } from "./report";
import { MockAtTransport } from "./transports/MockAtTransport";
import { SerialAtTransport } from "./transports/SerialAtTransport";
import type { AtTransport, PublishMessage } from "./types";
import { parseArgs, readBoolean, readNumber, readString, requireString } from "./utils/args";
import { bytesToHex, hexToBytes, payloadToBytes } from "./utils/hex";
import { createInterface } from "node:readline/promises";

const HELP = `
NBIoT Field SDK

Usage:
  nbiot doctor [--mock | --port /dev/tty.usbmodem --baud 9600]
  nbiot connect --apn <apn> [--cdp <host>] [--operator <mccmnc>] [--mock | --port <path>]
  nbiot stats [--mock | --port <path>]
  nbiot ping --host <ip-or-host> [--mock | --port <path>]
  nbiot send udp --host <host> --port <port> --payload <text|hex:ABCD> [--mock | --port-device <path>]
  nbiot send tcp --host <host> --port <port> --payload <text|hex:ABCD> [--dry-run]
  nbiot send mqtt --host <host> --topic <topic> --payload <text|hex:ABCD> [--dry-run]
  nbiot send http --url <url> --payload <json-or-text> [--dry-run]
  nbiot cloud test --provider allthingstalk|aws|azure|thingsboard --payload <json-or-text> [--dry-run]
  nbiot decode --hex <14-byte-weather-payload>
  nbiot report [--mock | --port <path>]
  nbiot passthrough --port <path> [--baud 9600]

Payload convention:
  --payload hello       sends UTF-8 text
  --payload hex:010203  sends raw bytes
`;

async function main(argv: string[]): Promise<void> {
  const { positionals, flags } = parseArgs(argv);
  const [command, subcommand] = positionals;

  if (!command || command === "help" || readBoolean(flags, "help")) {
    console.log(HELP.trim());
    return;
  }

  if (command === "decode") {
    const payload = decodeWeatherPayload(hexToBytes(requireString(flags, "hex")));
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (command === "cloud" && subcommand === "test") {
    const provider = requireString(flags, "provider") as CloudProviderName;
    const adapter = createCloudProviderAdapter(provider);
    const result = await adapter.publish(readPublishMessage(flags), { dryRun: readBoolean(flags, "dry-run") });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "send") {
    await send(subcommand, flags);
    return;
  }

  if (command === "passthrough") {
    await passthrough(flags);
    return;
  }

  const transport = await createTransport(flags);
  const modem = new UbloxSaraModem(transport);

  try {
    if (command === "doctor") {
      const ok = await modem.doctor();
      console.log(JSON.stringify({ ok, transport: transport.label }, null, 2));
      return;
    }

    if (command === "connect") {
      await modem.connect({
        apn: requireString(flags, "apn"),
        cdp: readString(flags, "cdp"),
        operator: readString(flags, "operator"),
        timeoutMs: readNumber(flags, "timeout-ms")
      });
      console.log(JSON.stringify({ ok: true, detail: "Modem connection sequence completed." }, null, 2));
      return;
    }

    if (command === "stats") {
      console.log(JSON.stringify(await modem.stats(), null, 2));
      return;
    }

    if (command === "ping") {
      const lines = await modem.ping(requireString(flags, "host"), readNumber(flags, "size"), readNumber(flags, "timeout-ms"));
      console.log(JSON.stringify({ ok: true, lines }, null, 2));
      return;
    }

    if (command === "report") {
      const signal = await modem.stats();
      console.log(JSON.stringify(createFieldReport("field-check", transport, modem, signal), null, 2));
      return;
    }
  } finally {
    await transport.close();
  }

  throw new Error(`Unknown command: ${command}`);
}

async function send(subcommand: string | undefined, flags: Record<string, string | boolean>): Promise<void> {
  if (subcommand === "udp") {
    const payload = payloadToBytes(requireString(flags, "payload"));
    const host = requireString(flags, "host");
    const port = readNumber(flags, "port");
    if (!port) throw new Error("Missing required --port.");

    const devicePort = readString(flags, "port-device");
    if (devicePort || readBoolean(flags, "mock")) {
      const transport = await createTransport({ ...flags, port: devicePort ?? "mock", mock: readBoolean(flags, "mock") });
      const modem = new UbloxSaraModem(transport);
      try {
        await modem.sendUdp({ host, port, payload });
      } finally {
        await transport.close();
      }
      console.log(JSON.stringify({ ok: true, path: "modem", host, port, bytes: payload.byteLength, hex: bytesToHex(payload) }, null, 2));
      return;
    }

    const result = await createUdpAdapter({ host, port }).publish({ payload }, { dryRun: readBoolean(flags, "dry-run") });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (subcommand === "tcp") {
    const port = readNumber(flags, "port");
    if (!port) throw new Error("Missing required --port.");
    const result = await createTcpAdapter({ host: requireString(flags, "host"), port }).publish(readPublishMessage(flags), { dryRun: readBoolean(flags, "dry-run") });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (subcommand === "mqtt") {
    const result = await createMqttAdapter({
      host: requireString(flags, "host"),
      port: readNumber(flags, "port"),
      topic: requireString(flags, "topic"),
      clientId: readString(flags, "client-id"),
      username: readString(flags, "username"),
      password: readString(flags, "password")
    }).publish(readPublishMessage(flags), { dryRun: readBoolean(flags, "dry-run") });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (subcommand === "http") {
    const result = await createHttpAdapter({
      url: requireString(flags, "url"),
      method: (readString(flags, "method") as "POST" | "PUT" | undefined) ?? "POST"
    }).publish(readPublishMessage(flags), { dryRun: readBoolean(flags, "dry-run") });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  throw new Error(`Unknown send target: ${subcommand ?? "<missing>"}`);
}

async function passthrough(flags: Record<string, string | boolean>): Promise<void> {
  const transport = new SerialAtTransport({
    port: requireString(flags, "port"),
    baudRate: readNumber(flags, "baud", 9600)
  });
  await transport.open();
  console.error("Passthrough ready. Type an AT command per line. Ctrl-C to exit.");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    for await (const line of rl) {
      const command = line.trim();
      if (!command) continue;
      const response = await transport.sendCommand(command);
      console.log(response.join("\n"));
    }
  } finally {
    rl.close();
    await transport.close();
  }
}

async function createTransport(flags: Record<string, string | boolean>): Promise<AtTransport> {
  const transport = readBoolean(flags, "mock")
    ? new MockAtTransport()
    : new SerialAtTransport({
        port: requireString(flags, "port"),
        baudRate: readNumber(flags, "baud", 9600)
      });
  await transport.open();
  return transport;
}

function readPublishMessage(flags: Record<string, string | boolean>): PublishMessage {
  const payload = requireString(flags, "payload");
  const topic = readString(flags, "topic");
  const asset = readString(flags, "asset");
  if (payload.startsWith("hex:")) {
    return { payload: payloadToBytes(payload), contentType: "application/octet-stream", topic, asset };
  }

  try {
    return { payload: JSON.parse(payload) as Record<string, unknown>, contentType: "application/json", topic, asset };
  } catch {
    return { payload, contentType: "text/plain", topic, asset };
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
