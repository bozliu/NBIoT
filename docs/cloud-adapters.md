# Cloud Adapters

## Core Protocols

- UDP: sends raw bytes to host/port.
- TCP: sends raw bytes or serialized JSON/text to host/port.
- HTTP: POST/PUT with JSON, text, or hex payload.
- MQTT: prepares MQTT publish plans without embedding a specific broker client.

## Providers

### AllThingsTalk

Environment:

- `ALLTHINGSTALK_TOKEN`
- `ALLTHINGSTALK_DEVICE_ID`
- `ALLTHINGSTALK_ASSET`
- optional `ALLTHINGSTALK_API_URL`

### ThingsBoard

Environment:

- `THINGSBOARD_ACCESS_TOKEN`
- optional `THINGSBOARD_URL`

### AWS IoT

Environment:

- `AWS_IOT_ENDPOINT`
- `AWS_IOT_THING_NAME`
- optional `AWS_IOT_TOPIC`
- optional `AWS_IOT_MQTT_PORT`

The adapter produces the MQTT topic/connection plan. Production publish should use the deploying company's TLS certificate store and MQTT client.

### Azure IoT

Environment:

- `AZURE_IOT_HUB`
- `AZURE_IOT_DEVICE_ID`
- optional `AZURE_IOT_SAS_TOKEN`

The adapter produces the MQTT topic/connection plan. Production publish should use the deploying company's TLS and SAS-token workflow.

## Safety

Adapters never include sample secrets. Docs use placeholders only.
