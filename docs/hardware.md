# Hardware Support

## Implemented: u-blox SARA N2/N3

The v1 implementation follows the SODAQ/u-blox NB-IoT AT-command path:

- `AT` modem liveness.
- `AT+CFUN` radio mode control.
- `AT+NCONFIG?` and `AT+NCONFIG=...` configuration checks.
- `AT+CGDCONT` APN setup.
- `AT+NCDP` CDP configuration when required by the network.
- `AT+COPS` optional operator forcing.
- `AT+CGATT` attach.
- `AT+CSQ`, `AT+CGATT?`, `AT+CEREG?` stats.
- `AT+NPING` ping.
- `AT+NSOCR`, `AT+NSOST`, `AT+NSOCL` UDP socket send.

## Planned: Quectel and SIMCom

Adapter contracts are included for:

- Quectel BC95/BC66/BG95.
- SIMCom SIM7020/SIM7070 family.

They are marked `planned-unverified` until hardware-backed command traces and tests are added. This avoids overclaiming support before field validation.

## Firmware Example

See `firmware/sodaq-ublox-weather/SodaqUbloxWeather.ino`.

The example packs:

- temperature x100 as signed int16
- humidity x100 as signed int16
- pressure mbar as uint16
- latitude x100000 as uint32
- longitude x100000 as uint32

This preserves the original 14-byte payload shape without hardcoded cloud credentials.
