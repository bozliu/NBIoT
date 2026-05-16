# NBIoT Field SDK

B2B NB-IoT field SDK and CLI for bringing up cellular IoT devices, validating SIM/APN and radio attach, sending telemetry over UDP/TCP/MQTT/HTTP, and checking cloud ingestion paths before a deployment reaches customers.

This repository turns an old Arduino + Python NB-IoT weather-station demo into a public, product-oriented toolkit. The commercial value is **B2B**: IoT solution vendors, system integrators, utilities, industrial teams, and telecom field teams can use it to reduce deployment risk and shorten the time from device prototype to validated field telemetry.

## What It Does

- Talks to u-blox SARA N2/N3 NB-IoT modems through AT commands.
- Validates modem responsiveness, attach state, registration state, signal quality, ping, and UDP send path.
- Provides dry-run and mockable cloud adapters for UDP, TCP, MQTT, HTTP, AllThingsTalk, AWS IoT, Azure IoT, and ThingsBoard.
- Decodes the original 14-byte weather-station payload: temperature, humidity, pressure, latitude, longitude.
- Generates field reports that can be attached to customer, operator, or deployment debugging tickets.
- Includes an Arduino firmware example with no hardcoded credentials or internal endpoints.

## Who Buys It

- **IoT device companies** use it to validate hardware and modem firmware before shipping devices.
- **System integrators** use it to prove that a customer site has NB-IoT coverage and working telemetry before committing installation labor.
- **Telecom/operator teams** use it as a repeatable field test harness for SIM/APN/profile issues.
- **Industrial and utility teams** use it to de-risk smart meter, asset tracker, environmental sensing, and remote monitoring rollouts.

It is not a consumer app. A normal consumer does not have the required modem, SIM, APN, firmware, and cloud ingestion setup.

## Quick Start

Install dependencies:

```bash
bun install
```

Run the mock doctor check:

```bash
bun run nbiot doctor --mock
```

Decode a weather payload:

```bash
bun run nbiot decode --hex 0929152E03F5002FA90F00B928F2
```

Dry-run a UDP payload:

```bash
bun run nbiot send udp --host 203.0.113.10 --port 9001 --payload hex:010203 --dry-run
```

Run against a serial modem:

```bash
bun run nbiot doctor --port /dev/tty.usbmodem14101 --baud 9600
bun run nbiot connect --port /dev/tty.usbmodem14101 --apn YOUR_APN --cdp YOUR_CDP_HOST --operator YOUR_MCCMNC
bun run nbiot stats --port /dev/tty.usbmodem14101
bun run nbiot ping --port /dev/tty.usbmodem14101 --host 8.8.8.8
bun run nbiot send udp --port-device /dev/tty.usbmodem14101 --host 203.0.113.10 --port 9001 --payload hex:010203
```

## Cloud Examples

ThingsBoard dry run:

```bash
THINGSBOARD_URL=https://demo.thingsboard.io \
THINGSBOARD_ACCESS_TOKEN=YOUR_TOKEN \
bun run nbiot cloud test --provider thingsboard --payload '{"temperature":23.4}' --dry-run
```

AllThingsTalk dry run:

```bash
ALLTHINGSTALK_TOKEN=YOUR_TOKEN \
ALLTHINGSTALK_DEVICE_ID=YOUR_DEVICE_ID \
ALLTHINGSTALK_ASSET=temperature \
bun run nbiot cloud test --provider allthingstalk --payload '{"value":23.4}' --dry-run
```

AWS IoT and Azure IoT adapters prepare MQTT connection plans. Live production publish should be wired to the enterprise MQTT/TLS client and credential store used by the deploying company.

## Hardware Support

- Implemented: u-blox SARA N2/N3 AT-command path.
- Planned/unverified: Quectel BC95/BC66/BG95 and SIMCom SIM7020/SIM7070 families.

See [docs/hardware.md](docs/hardware.md).

## Development

```bash
bun run typecheck
bun test
```

The historical source bundle was moved out of the public tree during cleanup because it contained internal remotes, generated files, vendor binaries, and hardcoded demo credentials. Third-party attribution is preserved under [third_party/notices](third_party/notices).

## License

Apache-2.0 for new repository code. Third-party material retains its original license.
