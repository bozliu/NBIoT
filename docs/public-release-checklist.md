# Public Release Checklist

Before publishing:

- [ ] `bun install` succeeds.
- [ ] `bun run typecheck` passes.
- [ ] `bun test` passes.
- [ ] `git ls-files` contains no `.DS_Store`, `.omx`, `.private`, nested `.git`, durable-memory docs, or vendor binaries.
- [ ] Secret scan finds no live tokens, internal Bosch remotes, or hardcoded public demo endpoints from the original bundle.
- [ ] README quickstart works from a fresh clone.
- [ ] `gh repo view bozliu/NBIoT` confirms the target repository is public after push.
- [ ] Git author email uses GitHub noreply identity.

Hardware release note:

- u-blox SARA N2/N3 command path is implemented.
- Physical modem acceptance requires a connected device and carrier/SIM credentials.
- Quectel/SIMCom are roadmap adapters until hardware-backed tests exist.
