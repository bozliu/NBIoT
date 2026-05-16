import type { ModemAdapter, ModemVendor, NetworkProfile, SignalStats, UdpSendOptions } from "../types";

export class PlannedModemAdapter implements ModemAdapter {
  readonly support = "planned-unverified" as const;

  constructor(
    readonly vendor: Exclude<ModemVendor, "ublox-sara">,
    readonly model: string
  ) {}

  async doctor(): Promise<boolean> {
    throw this.error();
  }

  async connect(_profile: NetworkProfile): Promise<void> {
    throw this.error();
  }

  async stats(): Promise<SignalStats> {
    throw this.error();
  }

  async ping(_host: string): Promise<string[]> {
    throw this.error();
  }

  async sendUdp(_options: UdpSendOptions): Promise<void> {
    throw this.error();
  }

  private error(): Error {
    return new Error(`${this.vendor} ${this.model} support is planned but unverified. Use the adapter contract to add hardware-backed commands.`);
  }
}

export const plannedQuectelAdapter = new PlannedModemAdapter("quectel", "BC95/BC66/BG95");
export const plannedSimcomAdapter = new PlannedModemAdapter("simcom", "SIM7020/SIM7070 family");
