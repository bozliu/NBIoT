import type { WeatherPayload } from "../types";

function readInt16BE(bytes: Uint8Array, offset: number): number {
  const value = (bytes[offset] << 8) | bytes[offset + 1];
  return value & 0x8000 ? value - 0x10000 : value;
}

function writeInt16BE(view: DataView, offset: number, value: number): void {
  view.setInt16(offset, value, false);
}

export function decodeWeatherPayload(bytes: Uint8Array): WeatherPayload {
  if (bytes.byteLength !== 14) {
    throw new Error(`Weather payload must be 14 bytes; received ${bytes.byteLength}.`);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const latitudeRaw = view.getUint32(6, false);
  const longitudeRaw = view.getUint32(10, false);

  return {
    temperatureC: readInt16BE(bytes, 0) / 100,
    humidityPercent: readInt16BE(bytes, 2) / 100,
    pressureMbar: view.getUint16(4, false),
    latitude: latitudeRaw === 0 ? undefined : latitudeRaw / 100000,
    longitude: longitudeRaw === 0 ? undefined : longitudeRaw / 100000
  };
}

export function encodeWeatherPayload(payload: WeatherPayload): Uint8Array {
  const bytes = new Uint8Array(14);
  const view = new DataView(bytes.buffer);

  writeInt16BE(view, 0, Math.round(payload.temperatureC * 100));
  writeInt16BE(view, 2, Math.round(payload.humidityPercent * 100));
  view.setUint16(4, Math.round(payload.pressureMbar), false);
  view.setUint32(6, Math.round((payload.latitude ?? 0) * 100000), false);
  view.setUint32(10, Math.round((payload.longitude ?? 0) * 100000), false);

  return bytes;
}
