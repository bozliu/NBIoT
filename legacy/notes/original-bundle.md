# Original Bundle Notes

The source folder began as an internal/public-demo mix containing:

- `Sodaq_nbIOT`: SODAQ Arduino library for u-blox NB-IoT modules.
- `Sodaq_wdt`: SODAQ watchdog library.
- `Sodaq_NBIoT_examples`: Arduino examples, QCOM/Quectel scripts, and vendor tools.
- `NB_IoT_demo_python_sdk`: AllThingsTalk Python SDK plus demo proxy.

The original directories were moved to a private local backup outside the public release tree.

Reasons:

- hardcoded demo credentials
- internal/private file remotes
- generated docs and caches
- `.DS_Store` and `.omx` runtime files
- Windows binaries, DLLs, CHM help files, RAR archives
- nested git repositories

The public SDK preserves the useful behavior and attribution without publishing unsafe artifacts.
