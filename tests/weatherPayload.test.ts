import { describe, expect, test } from "bun:test";
import { decodeWeatherPayload, encodeWeatherPayload } from "../src/codec/weatherPayload";
import { bytesToHex, hexToBytes } from "../src/utils/hex";

describe("weather payload codec", () => {
  test("round trips the 14-byte field payload", () => {
    const encoded = encodeWeatherPayload({
      temperatureC: 23.45,
      humidityPercent: 56.78,
      pressureMbar: 1013,
      latitude: 31.23183,
      longitude: 121.34962
    });

    expect(encoded.byteLength).toBe(14);
    expect(decodeWeatherPayload(encoded)).toEqual({
      temperatureC: 23.45,
      humidityPercent: 56.78,
      pressureMbar: 1013,
      latitude: 31.23183,
      longitude: 121.34962
    });
  });

  test("decodes original demo style hex", () => {
    const decoded = decodeWeatherPayload(hexToBytes("0929152E03F5002FA90F00B928F2"));
    expect(decoded.temperatureC).toBe(23.45);
    expect(decoded.humidityPercent).toBe(54.22);
    expect(decoded.pressureMbar).toBe(1013);
    expect(decoded.latitude).toBe(31.23471);
    expect(decoded.longitude).toBe(121.34642);
  });

  test("encodes missing GPS as zeroes", () => {
    const encoded = encodeWeatherPayload({
      temperatureC: -2.5,
      humidityPercent: 40,
      pressureMbar: 990
    });

    expect(bytesToHex(encoded).slice(12)).toBe("0000000000000000");
    expect(decodeWeatherPayload(encoded).latitude).toBeUndefined();
  });
});
