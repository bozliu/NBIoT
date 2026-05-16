import type { AtTransport, FieldReport, ModemAdapter, SignalStats } from "./types";

export function createFieldReport(target: string, transport: AtTransport, modem: ModemAdapter, signal?: SignalStats): FieldReport {
  const checks: FieldReport["checks"] = [
    {
      name: "transport",
      ok: true,
      detail: transport.label
    },
    {
      name: "modem-support",
      ok: modem.support === "implemented",
      detail: `${modem.vendor} ${modem.model} is ${modem.support}.`
    }
  ];

  if (signal) {
    checks.push({
      name: "signal",
      ok: signal.rssiDbm !== null && signal.rssiDbm >= -113,
      detail: `RSSI ${signal.rssiDbm ?? "unknown"} dBm, attached=${signal.attached}, registered=${signal.registered}.`
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    target,
    modem: {
      vendor: modem.vendor,
      model: modem.model,
      support: modem.support,
      transport: transport.label
    },
    signal,
    checks
  };
}
