export function normalizeHex(input: string): string {
  const hex = input.replace(/^0x/i, "").replace(/[\s:_-]/g, "").toUpperCase();
  if (hex.length % 2 !== 0) {
    throw new Error("Hex input must have an even number of characters.");
  }
  if (!/^[0-9A-F]*$/.test(hex)) {
    throw new Error("Hex input contains non-hex characters.");
  }
  return hex;
}

export function hexToBytes(input: string): Uint8Array {
  const hex = normalizeHex(input);
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function stringToBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function payloadToBytes(payload: string): Uint8Array {
  if (payload.startsWith("hex:")) {
    return hexToBytes(payload.slice(4));
  }
  return stringToBytes(payload);
}
