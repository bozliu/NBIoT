Measured on 2026-05-16 with Bun 1.3.11 on Apple Silicon local development machine. These are local SDK checks only; real RF/network numbers require physical hardware, SIM/APN, operator coverage, and cloud credentials.

### Results At A Glance

| Check | Result | Evidence |
| --- | --- | --- |
| Public file hygiene | PASS | Public scan passed. |
| Unit tests | PASS | bun test completed in the local benchmark run |
| Typecheck/lint gate | PASS | bun run typecheck completed; lint uses the same tsc gate |
| CLI command surface | PASS | doctor, connect, stats, ping, send, cloud test, decode, report, passthrough |
| Cloud adapter surface | PASS | UDP, TCP, MQTT, HTTP, AllThingsTalk, AWS IoT, Azure IoT, ThingsBoard |
| Hero visual | PASS | Generated docs/assets/hero-workflow.gif from synthetic workflow frames |

### Local SDK Benchmark

| Task | Command | Runs | Median | Range | Claim Scope |
| --- | --- | --- | --- | --- | --- |
| Mock modem doctor | `nbiot doctor --mock` | 5 | 23.3 ms | 21.9-27.9 ms | Mock AT transport, no modem required |
| Weather payload decode | `nbiot decode --hex <14-byte sample>` | 5 | 20.6 ms | 19.9-21.9 ms | Local codec only |
| UDP request construction | `nbiot send udp --dry-run` | 5 | 19.1 ms | 18.5-19.9 ms | Local dry run, TEST-NET endpoint |
| Cloud adapter dry run | `nbiot cloud test --provider thingsboard --dry-run` | 5 | 18.6 ms | 17.9-19.7 ms | Local request planning, no publish |
| Unit test suite | `bun test` | 1 | 54 ms | 54-54 ms | Local test suite |
| TypeScript validation | `bun run typecheck` | 1 | 496.2 ms | 496.2-496.2 ms | Static validation |

### Hardware Acceptance Matrix

| Metric | Status | Evidence Needed Before Claiming |
| --- | --- | --- |
| Serial modem detection | Pending hardware validation | u-blox SARA N2/N3 connected over serial and responding to AT |
| Network attach latency | Pending hardware validation | SIM/APN/operator attach run with timestamped field report |
| Signal quality | Pending hardware validation | RSRP, RSRQ, RSSI, registration, and ECL captured at field site |
| UDP RTT / delivery | Pending hardware validation | Real network UDP send and server receipt log |
| Cloud ingestion latency | Pending hardware validation | Live AllThingsTalk/AWS/Azure/ThingsBoard credentialed publish |
| Power draw / PSM/eDRX | Pending hardware validation | External power measurement and modem power-mode trace |

### SOTA / Ecosystem Comparison

| Tool | Public Scope | Hardware Scope | Honest Comparison |
| --- | --- | --- | --- |
| [NBIoT Field SDK](https://github.com/bozliu/NBIoT) | B2B field SDK/CLI for bring-up, dry-run transports, cloud adapters, reports | Implemented u-blox SARA N2/N3 path; Quectel/SIMCom planned | This repo: local tests, scans, generated benchmark |
| [SODAQ nbIOT](https://www.arduinolibraries.info/libraries/sodaq_nb-iot) | Arduino library for uBlox NB-IoT modules | u-blox NB-IoT module family | Strong firmware precedent; not a host-side B2B report/benchmark CLI |
| [AllThingsTalk Python SDK](https://docs.allthingstalk.com/developers/sdk/python/) | Python SDK for AllThingsTalk device/platform access | Cloud SDK, not modem field diagnostics | Good cloud target; narrower than multi-cloud field validation |
| [PyPI nbiot](https://pypi.org/project/nbiot/) | NB-IoT scanner and coverage tool for rollout troubleshooting | u-blox SARA N211 serial module | Closest open field-diagnostics precedent; narrower cloud adapter surface |
| [SimpleNB](https://github.com/techstudio-design/SimpleNB) | Arduino NB-IoT/CAT-M1 AT-command library | SIMCom, Quectel, u-blox SARA-R/N families; not SARA-N2 | Broader firmware module list; not host-side evidence/report workflow |
| [SparkFun SARA-R5 Arduino Library](https://github.com/sparkfun/SparkFun_u-blox_SARA-R5_Arduino_Library) | Arduino library for SARA-R5 LTE-M/NB-IoT with secure cloud examples | u-blox SARA-R5 boards | Modern firmware library; different modem generation than SARA N2/N3 |
| [Scanner-class RF tools](https://www.rohde-schwarz.com/ca/solutions/critical-infrastructure/mobile-network-testing/stories-insights/article-nb-iot-scanners-are-a-must-for-coverage-measurements-part-2_253484.html) | Passive RF coverage measurement and operator benchmarking | Dedicated scanner hardware | True RF benchmark class; this SDK is active device-side validation, not a scanner replacement |
