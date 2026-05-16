# Commercial Positioning

## Position

NBIoT Field SDK is a B2B field validation and integration toolkit.

It sells to teams that already have or plan to deploy NB-IoT hardware. The buyer is not buying a consumer app; they are buying reduced integration risk, repeatable field evidence, and a faster path from prototype to deployed telemetry.

## Buyer

- IoT device vendors validating modem firmware and telemetry behavior.
- System integrators deploying smart meters, trackers, sensors, and industrial monitors.
- Telecom/operator field teams debugging SIM, APN, attach, registration, and coverage issues.
- Utilities and industrial customers that need defensible site-readiness reports.

## Why They Buy

- Avoid failed site visits caused by bad coverage, wrong APN, or cloud ingestion mistakes.
- Produce repeatable proof that a modem attached, registered, saw acceptable signal, and transmitted payloads.
- Isolate whether failure is hardware, operator, transport, or cloud-side.
- Shorten onboarding for new NB-IoT developers and field engineers.

## Practitioner Workflows

- Run `nbiot doctor` to check serial and modem responsiveness.
- Run `nbiot connect` to apply APN/CDP/operator settings and attach.
- Run `nbiot stats` to capture RSSI, BER, attach, and registration state.
- Run `nbiot send udp` or protocol commands to validate payload transport.
- Run `nbiot cloud test` to validate cloud request shape before live credentials are used.
- Run `nbiot report` to produce a field evidence bundle.

## Business Model Options

- Open-source SDK as lead generation for paid field integration support.
- Paid enterprise support for carrier profiles, hardware qualification, and custom cloud adapters.
- Paid certification package for device makers that need repeatable deployment reports.

## Market Context

NB-IoT is attractive because it targets low-power, wide-area telemetry, but field deployments still fail on practical details: coverage, attach/registration behavior, carrier profile differences, SIM/APN configuration, PSM/eDRX behavior, and cloud ingestion shape.

Reference material:

- SODAQ u-blox NB-IoT library: https://github.com/SodaqMoja/Sodaq_nbIOT
- AllThingsTalk Python SDK: https://github.com/allthingstalk/python-sdk
- SODAQ SARA AFF N211 setup: https://docs.iotcreators.com/docs/_-setup-sodaq-sara-aff-n211
- NB-IoT scanner precedent: https://pypi.org/project/nbiot/
- R&S coverage measurement note: https://www.rohde-schwarz.com/ca/solutions/critical-infrastructure/mobile-network-testing/stories-insights/article-nb-iot-scanners-are-a-must-for-coverage-measurements-part-2_253484.html
- emnify NB-IoT coverage overview: https://www.emnify.com/nb-iot-coverage
