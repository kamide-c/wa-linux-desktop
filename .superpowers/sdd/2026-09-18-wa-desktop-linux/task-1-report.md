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

## Fix round 1/5

### Changes

- Removed `npm run make` from CI. The workflow retains `npm ci`, typecheck, lint, and test; packaging remains Task 7 work.
- Replaced TypeScript `7.0.2` with compatible TypeScript `5.9.3`, updated both TypeScript ESLint packages to `8.70.0`, removed the legacy-peer-deps CI environment override, and restored the TypeScript ESLint parser and recommended rules.
- Added `vitest.config.ts` with `environment: 'node'` and `include: ['tests/**/*.test.ts']`, and extended the existing toolchain contract test to verify that configuration.
- Updated the Task 1 TypeScript references in `docs/superpowers/plans/2026-09-18-wa-desktop-linux.md` to `5.9.3`.
- Added the safe lockfile override `tar: 7.5.22`. It replaces the vulnerable `tar@6.2.1` from `cacache -> make-fetch-happen -> @electron/node-gyp -> @electron/rebuild`.

### Red-test evidence

The Vitest configuration contract was added before `vitest.config.ts` existed:

```text
$ npm test -- tests/toolchain.test.ts
FAIL tests/toolchain.test.ts
Error: Cannot find module '../vitest.config'
```

After adding the explicit configuration, the focused test passed with two assertions.

### Verification

```text
$ npm ci
added 807 packages; exit 0 (no legacy-peer-deps workaround)

$ npm test -- tests/toolchain.test.ts
1 test file, 2 tests passed; exit 0

$ npm test
1 test file, 2 tests passed; exit 0

$ npm run typecheck
tsc --noEmit; exit 0

$ npm run lint
eslint . --max-warnings=0; exit 0

$ git diff --check
exit 0
```

### Audit

`npm audit --package-lock-only` was run freshly after the override. It exits nonzero because 25 development-tooling findings remain: 18 high, 3 moderate, and 4 low; there are **zero critical** findings.

- High: `extract-zip <- @electron/packager <- Electron Forge`, and `tmp <- external-editor <- @inquirer/editor <- @inquirer/prompts`.
- Moderate: `uuid <- sockjs <- webpack-dev-server <- @electron-forge/plugin-webpack`.
- Low: the remaining `@inquirer`/`external-editor` effects and `webpack` build-time `buildHttp` advisories.

The removed critical was `tar` through `@electron/node-gyp -> @electron/rebuild`. `npm explain tar` now reports `tar@7.5.22 dev overridden`. The remaining audit fixes require breaking downgrades to Forge 6 or an incompatible plugin-webpack package, so they are not applied in this Task 1 fix. They are not critical according to the fresh audit result.
