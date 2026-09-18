# Task 1 Report — Reproducible Electron and Test Toolchain

## Changed paths

- `.gitignore`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `forge.config.ts`
- `webpack.main.config.ts`
- `webpack.renderer.config.ts`
- `.github/workflows/ci.yml`
- `tests/toolchain.test.ts`
- `.superpowers/sdd/2026-09-18-wa-desktop-linux/task-1-report.md`

## Commits

- `d64b471 chore: scaffold hardened Electron application`
- This report is committed separately after it is written.

## TDD evidence

The prescribed test was created before `package.json` existed. Running the prescribed red command produced the expected failure:

```text
$ npm test -- tests/toolchain.test.ts
npm error code ENOENT
npm error enoent Could not read package.json: ENOENT: no such file or directory
```

The failure was caused by the absent manifest and consequently absent `test` script, as required.

## Verification commands and results

```text
$ NPM_CONFIG_LEGACY_PEER_DEPS=true npm ci
added 802 packages; exit 0

$ npm test -- tests/toolchain.test.ts
Test Files  1 passed (1)
Tests       1 passed (1); exit 0

$ npm run typecheck
tsc --noEmit; exit 0

$ npm run lint
eslint . --max-warnings=0; exit 0

$ git diff --check
exit 0
```

The CI workflow runs the required `npm ci`, typecheck, lint, test, and make steps on Ubuntu after installing `rpm`. It sets `NPM_CONFIG_LEGACY_PEER_DEPS=true` only for `npm ci`; see concerns below.

## Self-review

- Preserved the existing `.worktrees/` ignore entry and added every required ignore entry, including `whatsapp-web-profile/`.
- Pinned the requested Electron, Forge, TypeScript, and Vitest versions; added the Forge Webpack, Fuses, and RPM-maker packages, plus required Webpack/Vite support dependencies.
- Kept the RPM maker out of `forge.config.ts`, reserving that configuration for Task 7.
- Configured ASAR and disabled the three required Electron fuses.
- Kept the scope to Task 1 configuration and test files. No `src/main` modules, backend, telemetry, auto-updater, or WhatsApp profile/session data were added.
- Vitest's default Node environment and default `tests/**/*.test.ts` discovery match the specified contract without adding a non-Task-1 config module.

## Concerns

- TypeScript `7.0.2` is currently outside the peer range published by every available `@typescript-eslint` release. Plain `npm ci` rejects that peer conflict; CI therefore uses `NPM_CONFIG_LEGACY_PEER_DEPS=true`. The TypeScript ESLint packages remain installed as required but are not activated, because their parser crashes against TypeScript 7. `tsc --noEmit` remains the TypeScript verification gate.
- `npm ci` reported 30 inherited dependency vulnerabilities (4 low, 3 moderate, 22 high, 1 critical). I did not run `npm audit fix`, because it would change the pinned toolchain outside Task 1.
- The workflow includes `npm run make` exactly as required, but a successful package build is deferred: Task 1 intentionally has no Electron main entrypoint and Task 7 intentionally adds the RPM maker configuration. That workflow step cannot succeed until those tasks are completed.
