export type ModemVendor = "ublox-sara" | "quectel" | "simcom";

export type ModemSupportLevel = "implemented" | "planned-unverified";

export interface AtCommandOptions {
  timeoutMs?: number;
}

export interface AtTransport {
  readonly label: string;
  open(): Promise<void>;
  close(): Promise<void>;
  sendCommand(command: string, options?: AtCommandOptions): Promise<string[]>;
}

export interface NetworkProfile {
  apn: string;
  cdp?: string;
  operator?: string;
  timeoutMs?: number;
}

export interface SignalStats {
  rawCsq: number;
  rawBer: number;
  rssiDbm: number | null;
  berPercent: number | null;
  attached?: boolean;
  registered?: boolean;
}

export interface ModemAdapter {
  readonly vendor: ModemVendor;
  readonly model: string;
  readonly support: ModemSupportLevel;
  doctor(): Promise<boolean>;
  connect(profile: NetworkProfile): Promise<void>;
  stats(): Promise<SignalStats>;
  ping(host: string, size?: number, timeoutMs?: number): Promise<string[]>;
  sendUdp(options: UdpSendOptions): Promise<void>;
}

export interface UdpSendOptions {
  host: string;
  port: number;
  payload: Uint8Array;
  localPort?: number;
}

export interface WeatherPayload {
  temperatureC: number;
  humidityPercent: number;
  pressureMbar: number;
  latitude?: number;
  longitude?: number;
}

export interface PublishMessage {
  payload: Uint8Array | string | Record<string, unknown>;
  contentType?: string;
  topic?: string;
  asset?: string;
  timestamp?: string;
}

export interface PublishResult {
  provider: string;
  dryRun: boolean;
  ok: boolean;
  detail: string;
  request?: Record<string, unknown>;
}

export interface CloudAdapter {
  readonly provider: string;
  publish(message: PublishMessage, options?: { dryRun?: boolean }): Promise<PublishResult>;
}

export interface FieldReport {
  generatedAt: string;
  target: string;
  modem?: {
    vendor: ModemVendor;
    model: string;
    support: ModemSupportLevel;
    transport: string;
  };
  signal?: SignalStats;
  checks: Array<{
    name: string;
    ok: boolean;
    detail: string;
  }>;
}
