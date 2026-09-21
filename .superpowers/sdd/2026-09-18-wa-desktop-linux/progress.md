# SDD ledger — plan: docs/superpowers/plans/2026-09-18-wa-desktop-linux.md

## Pre-flight review

| Tasks | Shared file/interface | Finding | Resolution |
|---|---|---|---|
| 1 + 7 | `forge.config.ts`, `.github/workflows/ci.yml`, package scripts | Task 1 establishes the build pipeline; Task 7 adds and verifies the RPM maker and artifact upload. | Compatible: Task 7 extends the configuration after Task 1. |
| 2 + 4 | `WHATSAPP_WEB_ORIGIN` | Task 4 imports the constant that Task 2 exports. | Compatible: exact exported identifier is consistent. |
| 2 + 5 | navigation functions | Task 5 consumes Task 2's URL policy. | Compatible: malformed URLs are denied by the integration caller. |
| 3 + 6 | lifecycle functions | Task 6 consumes Task 3's pure close and startup decisions. | Compatible: exact exported identifiers are consistent. |
| 4 + 5 | permission functions | Task 5 consumes Task 4's allowlist. | Compatible: Electron request data is normalized to its origin before the pure policy call. |
| 5 + 6 | `window.ts` | Task 6 extends the window integration with application lifecycle wiring. | Compatible: Task 6 may modify only the lifecycle wiring added by Task 5. |
| 1 + 6 | Electron main process | Task 1 adds configuration; Task 6 adds the executable bootstrap. | Compatible: the bootstrap begins only after the toolchain exists. |
| 7 + base branch | `README.md` | README originated in PR #1 and is included in this feature branch before Task 7 modifies it. | Compatible: Task 7 updates the existing README rather than creating a duplicate. |
| 1 + base branch | `.gitignore` | The worktree isolation step already added `.worktrees/`, while Task 1 says to create `.gitignore`. | Ruling: Task 1 modifies the existing file and preserves `.worktrees/`; it appends only the planned Electron and profile entries. Cost if wrong: a local worktree could become unignored, so this is a hard preservation requirement. |
| 5 + Fedora Wayland | display sharing | Electron's `useSystemPicker` is macOS-only; forcing it would not implement the Fedora requirement. | Ruling: leave Electron's Linux display-media handler at its Chromium default and validate with the Wayland/PipeWire portal manually. Cost if wrong: screen sharing may need a Fedora-specific compatibility adjustment, but it avoids a knowingly unsupported API. |

Task 1: pending
Task 2: pending
Task 3: pending
Task 4: pending
Task 5: pending
Task 6: pending
Task 7: pending

Task 1: fix round 1/5 started — reviewer found a permanently failing CI `make` step, TypeScript 7 incompatibility hidden by legacy peer-dependency mode, a critical transitive audit finding, and overly broad Vitest discovery.

Task 1: Ruling: replace the plan's TypeScript 7.0.2 pin with the latest TypeScript 5.x compatible with the selected ESLint toolchain; remove `NPM_CONFIG_LEGACY_PEER_DEPS` — the specification requires a reproducible protected pipeline, while the exact compiler version is not a product requirement. Cost if wrong: newer TypeScript syntax is deferred, but the development and CI installation becomes deterministic.

Task 1: Ruling: CI may not run `npm run make` until a runnable Electron entrypoint and RPM maker exist; it will run package validation only in Task 7 — the specification requires CI packaging validation for the completed application, not a known-failing early scaffold. Cost if wrong: packaging regressions are not caught during Tasks 1–6, but a permanently red required check would provide no protection.

Task 1: Ruling: the fix implementer must inspect the audit dependency path and remediate the critical finding with a compatible direct dependency update or npm override, then provide fresh `npm audit --package-lock-only` evidence; no known critical install-time issue is accepted without a documented residual-risk decision. Cost if wrong: an incompatible override could break the package toolchain, so the agent must prove `npm ci`, tests, lint, and typecheck.

Task 1: minor (deferred): the report overstated the remaining audit remediation; Webpack has a non-breaking patch update for one low advisory. Final review must verify the lockfile uses the current compatible Webpack patch.
Task 1: fix round 1/5 (4 addressed, 0 open; commits ace584f..aabb136)
Task 1: complete (commits a52a99c..aabb136, review clean)
Task 2: complete (commits aabb136..ffafa00, review clean)
Task 3: complete (commits ffafa00..d3c2487, review clean)
Task 4: complete (commits d3c2487..0464dab, review clean)
Task 5: fix round 1/5 (2 addressed, 0 open; commits e5fa5ca..5108bc8)
Task 5: complete (commits 0464dab..5108bc8, review clean)
Task 6: fix round 1/5 — the tray used Electron's empty image, which can make the icon invisible. The review helper was unavailable because of the usage limit; the controller applied the minimal bundled SVG fix and added a regression test. Fresh tests, typecheck, lint, and diff checks pass.
Task 6: complete (commits 5108bc8..e586a18, controller verification clean; Fedora acceptance remains part of Task 7)
Task 7: complete — added the Forge RPM target, a Fedora 44 `%mkbuilddir` compatibility maker, package metadata, CI artifact upload, README installation instructions, and packaging regression coverage. `npm run make` produced and `rpm -qip`/`rpm -qlp` validated `out/make/rpm/x64/wa-desktop-linux-0.1.0-1.x86_64.rpm`; full tests, typecheck, lint, and diff checks pass.
