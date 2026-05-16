/*
  NBIoT Field SDK - SODAQ/u-blox weather payload example

  Configure APN/CDP/operator and endpoint before flashing.
  No tokens or production endpoints are embedded in this example.
*/

#include <Arduino.h>
#include <Wire.h>
#include <Sodaq_nbIOT.h>

#if defined(ARDUINO_AVR_LEONARDO)
#define DEBUG_STREAM Serial
#define MODEM_STREAM Serial1
#elif defined(ARDUINO_SODAQ_EXPLORER)
#define DEBUG_STREAM SerialUSB
#define MODEM_STREAM Serial
#elif defined(ARDUINO_SAM_ZERO)
#define DEBUG_STREAM SerialUSB
#define MODEM_STREAM Serial1
#else
#error "Select SODAQ ExpLoRer, Arduino Leonardo, Arduino M0/SAM Zero, or add your board mapping."
#endif

const char* NB_APN = "YOUR_APN";
const char* NB_CDP = "YOUR_CDP_HOST";
const char* NB_OPERATOR = "YOUR_MCCMNC";
Sodaq_nbIOT nbiot;

static void putInt16BE(byte* buffer, uint8_t* cursor, int16_t value) {
  buffer[(*cursor)++] = value >> 8;
  buffer[(*cursor)++] = value & 0xFF;
}

static void putUint16BE(byte* buffer, uint8_t* cursor, uint16_t value) {
  buffer[(*cursor)++] = value >> 8;
  buffer[(*cursor)++] = value & 0xFF;
}

static void putUint32BE(byte* buffer, uint8_t* cursor, uint32_t value) {
  buffer[(*cursor)++] = value >> 24;
  buffer[(*cursor)++] = value >> 16;
  buffer[(*cursor)++] = value >> 8;
  buffer[(*cursor)++] = value & 0xFF;
}

void setup() {
  DEBUG_STREAM.begin(9600);
  MODEM_STREAM.begin(nbiot.getDefaultBaudrate());

  nbiot.init(MODEM_STREAM, 7);
  nbiot.setDiag(DEBUG_STREAM);

  if (!nbiot.connect(NB_APN, NB_CDP, NB_OPERATOR)) {
    DEBUG_STREAM.println("NB-IoT connect failed.");
    return;
  }

  DEBUG_STREAM.println("NB-IoT connected.");
}

void loop() {
  byte payload[14];
  uint8_t cursor = 0;

  // Replace these sample values with real sensor reads.
  putInt16BE(payload, &cursor, 2345);      // 23.45 C
  putInt16BE(payload, &cursor, 5678);      // 56.78 %
  putUint16BE(payload, &cursor, 1013);     // 1013 mbar
  putUint32BE(payload, &cursor, 3123183);  // 31.23183
  putUint32BE(payload, &cursor, 12134962); // 121.34962

  // Sends via the configured NB-IoT CDP path. For UDP host/port testing,
  // use the host-side CLI `nbiot send udp --port-device ...`.
  if (nbiot.sendMessage(payload, sizeof(payload))) {
    DEBUG_STREAM.println("Payload queued.");
  } else {
    DEBUG_STREAM.println("Payload send failed.");
  }

  delay(5UL * 60UL * 1000UL);
}
