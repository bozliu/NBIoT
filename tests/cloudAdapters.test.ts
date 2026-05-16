import { describe, expect, test } from "bun:test";
import { createHttpAdapter, createMqttAdapter, createUdpAdapter } from "../src/cloud/adapters";
import { createCloudProviderAdapter } from "../src/cloud/providers";

describe("cloud adapters", () => {
  test("prepares UDP dry-run requests", async () => {
    const result = await createUdpAdapter({ host: "203.0.113.10", port: 9001 }).publish(
      { payload: new Uint8Array([1, 2, 3]) },
      { dryRun: true }
    );

    expect(result.ok).toBe(true);
    expect(result.request?.hex).toBe("010203");
  });

  test("prepares HTTP dry-run requests", async () => {
    const result = await createHttpAdapter({ url: "https://example.test/telemetry" }).publish(
      { payload: { temperature: 23.4 } },
      { dryRun: true }
    );

    expect(result.request?.url).toBe("https://example.test/telemetry");
    expect(result.request?.body).toBe('{"temperature":23.4}');
  });

  test("prepares MQTT request plans without leaking password values", async () => {
    const result = await createMqttAdapter({
      host: "mqtt.example.test",
      topic: "devices/demo/events",
      username: "user",
      password: "secret"
    }).publish({ payload: "hello" }, { dryRun: true });

    expect(result.request?.username).toBe("<configured>");
    expect(result.request?.password).toBe("<configured>");
    expect(result.request?.topic).toBe("devices/demo/events");
  });

  test("builds cloud provider adapters from env", async () => {
    const result = await createCloudProviderAdapter("thingsboard", {
      THINGSBOARD_URL: "https://things.example.test",
      THINGSBOARD_ACCESS_TOKEN: "token"
    }).publish({ payload: { humidity: 55 } }, { dryRun: true });

    expect(result.provider).toBe("thingsboard");
    expect(result.request?.url).toBe("https://things.example.test/api/v1/token/telemetry");
  });
});
