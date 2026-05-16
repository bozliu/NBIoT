import type { CloudAdapter, PublishMessage, PublishResult } from "../types";
import { createHttpAdapter, createMqttAdapter } from "./adapters";

export type CloudProviderName = "allthingstalk" | "aws" | "azure" | "thingsboard";

export function createCloudProviderAdapter(provider: CloudProviderName, env: NodeJS.ProcessEnv = process.env): CloudAdapter {
  switch (provider) {
    case "allthingstalk":
      return createAllThingsTalkAdapter(env);
    case "aws":
      return createAwsIotAdapter(env);
    case "azure":
      return createAzureIotAdapter(env);
    case "thingsboard":
      return createThingsBoardAdapter(env);
  }
}

function createAllThingsTalkAdapter(env: NodeJS.ProcessEnv): CloudAdapter {
  const token = requiredEnv(env, "ALLTHINGSTALK_TOKEN");
  const deviceId = requiredEnv(env, "ALLTHINGSTALK_DEVICE_ID");
  const asset = env.ALLTHINGSTALK_ASSET ?? "telemetry";
  const baseUrl = env.ALLTHINGSTALK_API_URL ?? "https://api.allthingstalk.io";
  const url = `${baseUrl}/device/${deviceId}/asset/${asset}/state`;
  return named("allthingstalk", createHttpAdapter({
    url,
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  }), { url, asset, deviceId });
}

function createThingsBoardAdapter(env: NodeJS.ProcessEnv): CloudAdapter {
  const baseUrl = env.THINGSBOARD_URL ?? "https://demo.thingsboard.io";
  const accessToken = requiredEnv(env, "THINGSBOARD_ACCESS_TOKEN");
  const url = `${baseUrl}/api/v1/${accessToken}/telemetry`;
  return named("thingsboard", createHttpAdapter({ url, method: "POST" }), { url });
}

function createAwsIotAdapter(env: NodeJS.ProcessEnv): CloudAdapter {
  const endpoint = requiredEnv(env, "AWS_IOT_ENDPOINT");
  const thingName = requiredEnv(env, "AWS_IOT_THING_NAME");
  const topic = env.AWS_IOT_TOPIC ?? `$aws/things/${thingName}/shadow/update`;
  return named("aws", createMqttAdapter({
    host: endpoint,
    port: Number(env.AWS_IOT_MQTT_PORT ?? 8883),
    topic,
    clientId: thingName
  }), { endpoint, topic, thingName });
}

function createAzureIotAdapter(env: NodeJS.ProcessEnv): CloudAdapter {
  const hub = requiredEnv(env, "AZURE_IOT_HUB");
  const deviceId = requiredEnv(env, "AZURE_IOT_DEVICE_ID");
  const sasToken = env.AZURE_IOT_SAS_TOKEN;
  const host = `${hub}.azure-devices.net`;
  return named("azure", createMqttAdapter({
    host,
    port: 8883,
    topic: `devices/${deviceId}/messages/events/`,
    clientId: deviceId,
    username: `${host}/${deviceId}/?api-version=2021-04-12`,
    password: sasToken
  }), { host, deviceId });
}

function named(provider: CloudProviderName, adapter: CloudAdapter, baseRequest: Record<string, unknown>): CloudAdapter {
  return {
    provider,
    async publish(message: PublishMessage, options = {}): Promise<PublishResult> {
      const result = await adapter.publish(message, options);
      return {
        ...result,
        provider,
        request: {
          ...baseRequest,
          ...(result.request ?? {})
        }
      };
    }
  };
}

function requiredEnv(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}.`);
  }
  return value;
}
