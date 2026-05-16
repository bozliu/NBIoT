import { createSocket } from "node:dgram";
import { connect as tcpConnect } from "node:net";
import type { CloudAdapter, PublishMessage, PublishResult } from "../types";
import { bytesToHex } from "../utils/hex";

export interface UdpCloudOptions {
  host: string;
  port: number;
}

export interface TcpCloudOptions {
  host: string;
  port: number;
}

export interface HttpCloudOptions {
  url: string;
  method?: "POST" | "PUT";
  headers?: Record<string, string>;
}

export interface MqttCloudOptions {
  host: string;
  port?: number;
  topic: string;
  clientId?: string;
  username?: string;
  password?: string;
}

export function createUdpAdapter(options: UdpCloudOptions): CloudAdapter {
  return {
    provider: "udp",
    async publish(message, publishOptions = {}) {
      const payload = toBuffer(message.payload);
      const request = { protocol: "udp", host: options.host, port: options.port, bytes: payload.length, hex: bytesToHex(payload) };
      if (publishOptions.dryRun) {
        return ok("udp", true, "UDP payload prepared.", request);
      }

      await new Promise<void>((resolve, reject) => {
        const socket = createSocket("udp4");
        socket.send(payload, options.port, options.host, (error) => {
          socket.close();
          if (error) reject(error);
          else resolve();
        });
      });
      return ok("udp", false, "UDP payload sent.", request);
    }
  };
}

export function createTcpAdapter(options: TcpCloudOptions): CloudAdapter {
  return {
    provider: "tcp",
    async publish(message, publishOptions = {}) {
      const payload = toBuffer(message.payload);
      const request = { protocol: "tcp", host: options.host, port: options.port, bytes: payload.length, hex: bytesToHex(payload) };
      if (publishOptions.dryRun) {
        return ok("tcp", true, "TCP payload prepared.", request);
      }

      await new Promise<void>((resolve, reject) => {
        const socket = tcpConnect(options.port, options.host, () => {
          socket.end(payload);
        });
        socket.on("close", () => resolve());
        socket.on("error", reject);
      });
      return ok("tcp", false, "TCP payload sent.", request);
    }
  };
}

export function createHttpAdapter(options: HttpCloudOptions): CloudAdapter {
  return {
    provider: "http",
    async publish(message, publishOptions = {}) {
      const body = serializePayload(message);
      const request = {
        method: options.method ?? "POST",
        url: options.url,
        headers: options.headers ?? {},
        body
      };
      if (publishOptions.dryRun) {
        return ok("http", true, "HTTP request prepared.", request);
      }

      const response = await fetch(options.url, {
        method: options.method ?? "POST",
        headers: {
          "content-type": message.contentType ?? "application/json",
          ...(options.headers ?? {})
        },
        body
      });
      return {
        provider: "http",
        dryRun: false,
        ok: response.ok,
        detail: `HTTP ${response.status} ${response.statusText}`,
        request
      };
    }
  };
}

export function createMqttAdapter(options: MqttCloudOptions): CloudAdapter {
  return {
    provider: "mqtt",
    async publish(message, publishOptions = {}) {
      const payload = serializePayload(message);
      const request = {
        protocol: "mqtt",
        host: options.host,
        port: options.port ?? 1883,
        topic: message.topic ?? options.topic,
        clientId: options.clientId,
        username: options.username ? "<configured>" : undefined,
        password: options.password ? "<configured>" : undefined,
        payload
      };
      if (publishOptions.dryRun) {
        return ok("mqtt", true, "MQTT publish plan prepared.", request);
      }
      throw new Error("Live MQTT publish requires a broker/client integration. Use --dry-run for request validation or wire this adapter to your production MQTT client.");
    }
  };
}

function ok(provider: string, dryRun: boolean, detail: string, request: Record<string, unknown>): PublishResult {
  return { provider, dryRun, ok: true, detail, request };
}

function serializePayload(message: PublishMessage): string {
  if (message.payload instanceof Uint8Array) {
    return bytesToHex(message.payload);
  }
  if (typeof message.payload === "string") {
    return message.payload;
  }
  return JSON.stringify(message.payload);
}

function toBuffer(payload: PublishMessage["payload"]): Buffer {
  if (payload instanceof Uint8Array) {
    return Buffer.from(payload);
  }
  if (typeof payload === "string") {
    return Buffer.from(payload);
  }
  return Buffer.from(JSON.stringify(payload));
}
