import type { AtTransport, ModemAdapter, NetworkProfile, SignalStats, UdpSendOptions } from "../types";
import { bytesToHex } from "../utils/hex";

const REQUIRED_NCONFIG: Array<[string, string]> = [
  ["AUTOCONNECT", "TRUE"],
  ["CR_0354_0338_SCRAMBLING", "TRUE"],
  ["CR_0859_SI_AVOID", "TRUE"]
];

export class UbloxSaraModem implements ModemAdapter {
  readonly vendor = "ublox-sara" as const;
  readonly model = "SARA N2/N3";
  readonly support = "implemented" as const;

  constructor(private readonly transport: AtTransport) {}

  async doctor(): Promise<boolean> {
    const lines = await this.transport.sendCommand("AT", { timeoutMs: 1000 });
    return hasOk(lines);
  }

  async connect(profile: NetworkProfile): Promise<void> {
    await expectOk(this.transport.sendCommand("AT"));
    await expectOk(this.transport.sendCommand("AT+CFUN=0", { timeoutMs: profile.timeoutMs }));
    await this.applyNconfig();
    await this.transport.sendCommand("AT+NRB", { timeoutMs: 1000 }).catch(() => []);
    await expectOk(this.transport.sendCommand(`AT+CGDCONT=1,"IP","${profile.apn}"`, { timeoutMs: profile.timeoutMs }));

    if (profile.cdp) {
      await expectOk(this.transport.sendCommand(`AT+NCDP=${profile.cdp}`, { timeoutMs: profile.timeoutMs }));
    }

    await expectOk(this.transport.sendCommand("AT+NSMI=0", { timeoutMs: profile.timeoutMs }));
    await expectOk(this.transport.sendCommand("AT+NNMI=0", { timeoutMs: profile.timeoutMs }));
    await expectOk(this.transport.sendCommand("AT+CFUN=1", { timeoutMs: profile.timeoutMs }));

    if (profile.operator) {
      await expectOk(this.transport.sendCommand(`AT+COPS=1,2,"${profile.operator}"`, { timeoutMs: profile.timeoutMs }));
    }

    await expectOk(this.transport.sendCommand("AT+CGATT=1", { timeoutMs: profile.timeoutMs ?? 30000 }));
  }

  async stats(): Promise<SignalStats> {
    const csqLines = await this.transport.sendCommand("AT+CSQ");
    const attachLines = await this.transport.sendCommand("AT+CGATT?");
    const regLines = await this.transport.sendCommand("AT+CEREG?");
    const parsedCsq = parseCsq(csqLines);

    return {
      ...parsedCsq,
      attached: parseAttached(attachLines),
      registered: parseRegistered(regLines)
    };
  }

  async ping(host: string, size = 8, timeoutMs = 10000): Promise<string[]> {
    return this.transport.sendCommand(`AT+NPING=${host},${size},${timeoutMs}`, { timeoutMs: timeoutMs + 1000 });
  }

  async sendUdp(options: UdpSendOptions): Promise<void> {
    const localPort = options.localPort ?? 5683;
    const openLines = await this.transport.sendCommand(`AT+NSOCR=DGRAM,17,${localPort},1`);
    const socket = parseSocket(openLines);
    await expectOk(this.transport.sendCommand(`AT+NSOST=${socket},${options.host},${options.port},${options.payload.byteLength},${bytesToHex(options.payload)}`));
    await expectOk(this.transport.sendCommand(`AT+NSOCL=${socket}`));
  }

  private async applyNconfig(): Promise<void> {
    const lines = await this.transport.sendCommand("AT+NCONFIG?");
    for (const [name, value] of REQUIRED_NCONFIG) {
      if (!lines.some((line) => line === `+NCONFIG: ${name},${value}`)) {
        await expectOk(this.transport.sendCommand(`AT+NCONFIG=${name},${value}`));
      }
    }
  }
}

export function convertCsqToRssi(csq: number): number | null {
  if (csq === 99) {
    return null;
  }
  return -113 + 2 * csq;
}

export function parseCsq(lines: string[]): Pick<SignalStats, "rawCsq" | "rawBer" | "rssiDbm" | "berPercent"> {
  const line = lines.find((entry) => entry.startsWith("+CSQ:"));
  if (!line) {
    throw new Error("Missing +CSQ response.");
  }
  const match = /^\+CSQ:\s*(\d+),(\d+)/.exec(line);
  if (!match) {
    throw new Error(`Invalid +CSQ response: ${line}`);
  }
  const rawCsq = Number(match[1]);
  const rawBer = Number(match[2]);
  const berValues = [49, 43, 37, 25, 19, 13, 7, 0];
  return {
    rawCsq,
    rawBer,
    rssiDbm: convertCsqToRssi(rawCsq),
    berPercent: rawBer >= 0 && rawBer < berValues.length ? berValues[rawBer] : null
  };
}

function parseAttached(lines: string[]): boolean | undefined {
  const line = lines.find((entry) => entry.startsWith("+CGATT:"));
  return line ? /\+CGATT:\s*1/.test(line) : undefined;
}

function parseRegistered(lines: string[]): boolean | undefined {
  const line = lines.find((entry) => entry.startsWith("+CEREG:"));
  return line ? /\+CEREG:\s*\d+,1/.test(line) || /\+CEREG:\s*\d+,5/.test(line) : undefined;
}

function parseSocket(lines: string[]): number {
  const numeric = lines.find((line) => /^\d+$/.test(line));
  if (!numeric) {
    throw new Error(`Could not parse socket id from response: ${lines.join(" | ")}`);
  }
  return Number(numeric);
}

async function expectOk(promise: Promise<string[]>): Promise<string[]> {
  const lines = await promise;
  if (!hasOk(lines)) {
    throw new Error(`AT command did not return OK: ${lines.join(" | ")}`);
  }
  return lines;
}

function hasOk(lines: string[]): boolean {
  return lines.some((line) => line === "OK");
}
