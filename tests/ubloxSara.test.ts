import { describe, expect, test } from "bun:test";
import { UbloxSaraModem, convertCsqToRssi, parseCsq } from "../src/modems/ubloxSara";
import { MockAtTransport } from "../src/transports/MockAtTransport";

describe("u-blox SARA modem adapter", () => {
  test("parses CSQ into RSSI", () => {
    expect(convertCsqToRssi(18)).toBe(-77);
    expect(convertCsqToRssi(99)).toBeNull();
    expect(parseCsq(["+CSQ: 18,0", "OK"])).toEqual({
      rawCsq: 18,
      rawBer: 0,
      rssiDbm: -77,
      berPercent: 49
    });
  });

  test("runs a configurable connection sequence", async () => {
    const transport = new MockAtTransport();
    const modem = new UbloxSaraModem(transport);

    await modem.connect({
      apn: "internet.example",
      cdp: "203.0.113.10",
      operator: "00101"
    });

    expect(transport.commands).toContain('AT+CGDCONT=1,"IP","internet.example"');
    expect(transport.commands).toContain("AT+NCDP=203.0.113.10");
    expect(transport.commands).toContain('AT+COPS=1,2,"00101"');
    expect(transport.commands.every((command) => !command.startsWith("AT+NSOST="))).toBe(true);
  });

  test("sends UDP without hardcoded endpoint", async () => {
    const transport = new MockAtTransport();
    const modem = new UbloxSaraModem(transport);

    await modem.sendUdp({
      host: "203.0.113.20",
      port: 9001,
      payload: new Uint8Array([1, 2, 3])
    });

    expect(transport.commands).toContain("AT+NSOCR=DGRAM,17,5683,1");
    expect(transport.commands).toContain("AT+NSOST=0,203.0.113.20,9001,3,010203");
    expect(transport.commands).toContain("AT+NSOCL=0");
  });
});
