# WA Desktop Linux Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Fedora GNOME/Wayland Electron application that keeps WhatsApp Web active in the tray after its window closes, with secure media permissions for calls and screen sharing.

**Architecture:** Electron's main process owns one persistent Chromium profile, the native window/tray lifecycle, navigation policy, and permission allowlists. WhatsApp Web is loaded directly as an isolated remote page with no preload bridge or Node.js access. Pure TypeScript policy modules hold decisions that can be unit tested without Electron.

**Tech Stack:** Electron 44.4.3, Electron Forge 7.11.2 with the stable Webpack TypeScript template, TypeScript 5.9.3, Vitest 5.0.1, Electron Forge RPM maker, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-18-whatsapp-linux-design.md`

## Global Constraints

- Target only Fedora Linux 44, GNOME, Wayland, and x86_64 in this release.
- Load only `https://web.whatsapp.com`; never reimplement or proxy WhatsApp services.
- Disable Node.js integration; enable `contextIsolation` and Chromium sandboxing.
- Do not add a preload bridge, telemetry, analytics, a backend, or an auto-updater.
- Store the Chromium session in the local Electron user-data directory only; never commit it.
- On close, hide to tray. Only the tray Quit action can terminate the app.
- Permit camera, microphone, notifications, and display capture only for the official WhatsApp Web origin.
- Build a local RPM; Flatpak, X11, and other distributions are not in scope.

---

## File Structure

```text
.
├── .github/workflows/ci.yml                 # install, type-check, unit-test, and RPM build on push/PR
├── .gitignore                               # ignores Node, Electron, and local WhatsApp profile artifacts
├── forge.config.ts                          # hardened Electron Forge + RPM maker configuration
├── package.json                             # scripts and pinned development dependencies
├── tsconfig.json                            # TypeScript compiler settings
├── webpack.main.config.ts                   # bundles Electron main process
├── webpack.renderer.config.ts               # retained Forge renderer configuration
├── src/main/index.ts                        # Electron bootstrap and dependency wiring
├── src/main/lifecycle.ts                    # close-to-tray state transitions
├── src/main/navigation-policy.ts            # allowlist decisions for navigation/popups/external links
├── src/main/permission-policy.ts            # allowlist decisions for requested media permissions
├── src/main/tray.ts                         # tray menu construction and actions
├── src/main/window-config.ts                # pure hardened BrowserWindow options
├── src/main/window.ts                       # Electron-specific WhatsApp loader and event wiring
├── tests/lifecycle.test.ts                  # lifecycle unit tests
├── tests/navigation-policy.test.ts          # origin and link policy unit tests
├── tests/permission-policy.test.ts          # permission allowlist unit tests
├── tests/window-config.test.ts              # secure BrowserWindow option unit tests
└── tests/packaging-config.test.ts           # Fedora RPM maker configuration test
```

### Task 1: Establish the reproducible Electron and test toolchain

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `forge.config.ts`
- Create: `webpack.main.config.ts`
- Create: `webpack.renderer.config.ts`
- Create: `.github/workflows/ci.yml`
- Create: `tests/toolchain.test.ts`

**Interfaces:**
- Produces npm scripts: `start`, `test`, `test:watch`, `typecheck`, `lint`, `package`, and `make`.
- Produces a Vitest environment that imports pure TypeScript modules from `src/main/`.

- [ ] **Step 1: Create the failing toolchain contract test**

```ts
// tests/toolchain.test.ts
import { describe, expect, it } from 'vitest';
import project from '../package.json';

describe('project toolchain', () => {
  it('exposes verification and Fedora packaging scripts', () => {
    expect(project.scripts).toMatchObject({
      test: expect.any(String),
      typecheck: expect.any(String),
      lint: expect.any(String),
      make: expect.any(String),
    });
  });
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `npm test -- tests/toolchain.test.ts`

Expected: FAIL because `package.json` and the test command do not exist yet.

- [ ] **Step 3: Add the minimum reproducible project configuration**

Create `package.json` with exact scripts:

```json
{
  "name": "wa-desktop-linux",
  "version": "0.1.0",
  "private": false,
  "main": ".webpack/main",
  "scripts": {
    "start": "electron-forge start",
    "package": "electron-forge package",
    "make": "electron-forge make",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --max-warnings=0"
  }
}
```

Install Electron `44.4.3`, Electron Forge `7.11.2`, the Forge Webpack plugin, the RPM maker, TypeScript `5.9.3`, Vitest `5.0.1`, ESLint, and the TypeScript ESLint packages as development dependencies. Configure `forge.config.ts` with `asar: true`, and the `FuseV1Options` plugin disabling `RunAsNode`, `EnableNodeOptionsEnvironmentVariable`, and `EnableNodeCliInspectArguments`. Set `productName` to `WA Desktop Linux`, package name to `wa-desktop-linux`, and homepage to the repository URL. The RPM maker itself is added and verified in Task 7.

Create `.gitignore` entries for `node_modules/`, `out/`, `.webpack/`, `.vite/`, `coverage/`, `.eslintcache`, `*.log`, and `whatsapp-web-profile/`. Configure Vitest with Node environment and `tests/**/*.test.ts`. Configure the workflow to run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run make` on Ubuntu after installing `rpm`.

- [ ] **Step 4: Run the toolchain contract test and static checks**

Run: `npm test -- tests/toolchain.test.ts && npm run typecheck && npm run lint`

Expected: PASS with zero TypeScript and lint errors.

- [ ] **Step 5: Commit the scaffolding**

```bash
git add .gitignore package.json package-lock.json tsconfig.json forge.config.ts webpack.main.config.ts webpack.renderer.config.ts .github/workflows/ci.yml tests/toolchain.test.ts
git commit -m "chore: scaffold hardened Electron application"
```

### Task 2: Define the WhatsApp navigation boundary

**Files:**
- Create: `src/main/navigation-policy.ts`
- Create: `tests/navigation-policy.test.ts`

**Interfaces:**
- Produces `WHATSAPP_WEB_ORIGIN: 'https://web.whatsapp.com'`.
- Produces `isAllowedWhatsAppNavigation(url: string): boolean`.
- Produces `shouldOpenExternally(url: string): boolean`.

- [ ] **Step 1: Write failing navigation tests**

```ts
import { describe, expect, it } from 'vitest';
import {
  isAllowedWhatsAppNavigation,
  shouldOpenExternally,
} from '../src/main/navigation-policy';

describe('WhatsApp navigation policy', () => {
  it('allows WhatsApp Web and rejects lookalike origins', () => {
    expect(isAllowedWhatsAppNavigation('https://web.whatsapp.com/')).toBe(true);
    expect(isAllowedWhatsAppNavigation('https://web.whatsapp.com.evil.test/')).toBe(false);
  });

  it('opens an explicit HTTPS link outside the application', () => {
    expect(shouldOpenExternally('https://example.org/help')).toBe(true);
    expect(shouldOpenExternally('javascript:alert(1)')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `npm test -- tests/navigation-policy.test.ts`

Expected: FAIL because `src/main/navigation-policy.ts` is missing.

- [ ] **Step 3: Implement the minimum URL policy**

```ts
export const WHATSAPP_WEB_ORIGIN = 'https://web.whatsapp.com';

export function isAllowedWhatsAppNavigation(rawUrl: string): boolean {
  return new URL(rawUrl).origin === WHATSAPP_WEB_ORIGIN;
}

export function shouldOpenExternally(rawUrl: string): boolean {
  return new URL(rawUrl).protocol === 'https:';
}
```

Callers must catch malformed URLs and treat them as denied.

- [ ] **Step 4: Run the navigation tests**

Run: `npm test -- tests/navigation-policy.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the navigation policy**

```bash
git add src/main/navigation-policy.ts tests/navigation-policy.test.ts
git commit -m "feat: restrict navigation to WhatsApp Web"
```

### Task 3: Model close-to-tray behaviour independently from Electron

**Files:**
- Create: `src/main/lifecycle.ts`
- Create: `tests/lifecycle.test.ts`

**Interfaces:**
- Produces `type CloseAction = 'hide' | 'quit'`.
- Produces `resolveCloseAction(isQuitting: boolean): CloseAction`.
- Produces `shouldStartHidden(openAtLogin: boolean): boolean`.

- [ ] **Step 1: Write failing lifecycle tests**

```ts
import { describe, expect, it } from 'vitest';
import { resolveCloseAction, shouldStartHidden } from '../src/main/lifecycle';

describe('application lifecycle', () => {
  it('hides a normal close request so WhatsApp can keep running', () => {
    expect(resolveCloseAction(false)).toBe('hide');
  });

  it('allows termination only after the explicit quit action', () => {
    expect(resolveCloseAction(true)).toBe('quit');
  });

  it('starts hidden only for login launches', () => {
    expect(shouldStartHidden(true)).toBe(true);
    expect(shouldStartHidden(false)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `npm test -- tests/lifecycle.test.ts`

Expected: FAIL because `src/main/lifecycle.ts` is missing.

- [ ] **Step 3: Implement the minimum lifecycle functions**

```ts
export type CloseAction = 'hide' | 'quit';

export function resolveCloseAction(isQuitting: boolean): CloseAction {
  return isQuitting ? 'quit' : 'hide';
}

export function shouldStartHidden(openAtLogin: boolean): boolean {
  return openAtLogin;
}
```

- [ ] **Step 4: Run lifecycle tests**

Run: `npm test -- tests/lifecycle.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the lifecycle model**

```bash
git add src/main/lifecycle.ts tests/lifecycle.test.ts
git commit -m "feat: model close-to-tray lifecycle"
```

### Task 4: Limit WhatsApp media permissions to the official origin

**Files:**
- Create: `src/main/permission-policy.ts`
- Create: `tests/permission-policy.test.ts`

**Interfaces:**
- Produces `type SupportedPermission = 'media' | 'notifications' | 'display-capture'`.
- Produces `isAllowedWhatsAppPermission(origin: string, permission: string): boolean`.
- Produces `allowedDisplayMediaOrigin(origin: string): boolean`.

- [ ] **Step 1: Write failing permission tests**

```ts
import { describe, expect, it } from 'vitest';
import {
  allowedDisplayMediaOrigin,
  isAllowedWhatsAppPermission,
} from '../src/main/permission-policy';

describe('WhatsApp permission policy', () => {
  it('allows media and notification permissions only for WhatsApp Web', () => {
    expect(isAllowedWhatsAppPermission('https://web.whatsapp.com', 'media')).toBe(true);
    expect(isAllowedWhatsAppPermission('https://web.whatsapp.com', 'notifications')).toBe(true);
    expect(isAllowedWhatsAppPermission('https://evil.test', 'media')).toBe(false);
  });

  it('does not allow unrelated browser permissions', () => {
    expect(isAllowedWhatsAppPermission('https://web.whatsapp.com', 'geolocation')).toBe(false);
    expect(allowedDisplayMediaOrigin('https://web.whatsapp.com')).toBe(true);
    expect(allowedDisplayMediaOrigin('https://web.whatsapp.com.evil.test')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `npm test -- tests/permission-policy.test.ts`

Expected: FAIL because `src/main/permission-policy.ts` is missing.

- [ ] **Step 3: Implement the allowlist**

```ts
import { WHATSAPP_WEB_ORIGIN } from './navigation-policy';

const ALLOWED_PERMISSIONS = new Set(['media', 'notifications', 'display-capture']);

export function isAllowedWhatsAppPermission(origin: string, permission: string): boolean {
  return origin === WHATSAPP_WEB_ORIGIN && ALLOWED_PERMISSIONS.has(permission);
}

export function allowedDisplayMediaOrigin(origin: string): boolean {
  return origin === WHATSAPP_WEB_ORIGIN;
}
```

- [ ] **Step 4: Run permission tests**

Run: `npm test -- tests/permission-policy.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the permission policy**

```bash
git add src/main/permission-policy.ts tests/permission-policy.test.ts
git commit -m "feat: allow media only for WhatsApp Web"
```

### Task 5: Build and test hardened BrowserWindow configuration

**Files:**
- Create: `src/main/window-config.ts`
- Create: `src/main/window.ts`
- Create: `tests/window-config.test.ts`

**Interfaces:**
- Produces `createWindowOptions(): Electron.BrowserWindowConstructorOptions` from `window-config.ts`.
- Produces `configureWhatsAppWindow(window: Electron.BrowserWindow): void`.
- Consumes `isAllowedWhatsAppNavigation` and `shouldOpenExternally` from Task 2.

- [ ] **Step 1: Write the failing window configuration test**

```ts
import { describe, expect, it } from 'vitest';
import { createWindowOptions } from '../src/main/window-config';

describe('WhatsApp window configuration', () => {
  it('creates a sandboxed isolated window without Node.js integration', () => {
    const options = createWindowOptions();

    expect(options.show).toBe(false);
    expect(options.webPreferences).toMatchObject({
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    });
  });
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `npm test -- tests/window-config.test.ts`

Expected: FAIL because `src/main/window.ts` is missing.

- [ ] **Step 3: Implement secure window construction and wiring**

Implement `createWindowOptions()` in `window-config.ts` with a hidden 1280×800 window, `backgroundColor: '#111b21'`, and a `partition: 'persist:whatsapp-web'` web preference. Import Electron types with `import type` only, so this module remains executable in Vitest. Implement `configureWhatsAppWindow()` in `window.ts` to:

1. call `window.loadURL(WHATSAPP_WEB_ORIGIN)`;
2. prevent `will-navigate` unless `isAllowedWhatsAppNavigation()` returns true;
3. deny every `setWindowOpenHandler` request and call `shell.openExternal()` only when `shouldOpenExternally()` returns true;
4. use `session.setPermissionRequestHandler()` and `session.setPermissionCheckHandler()` with `isAllowedWhatsAppPermission()`;
5. do not set a custom `setDisplayMediaRequestHandler()` on Linux. Preserve Electron/Chromium's default `getDisplayMedia()` path so Wayland/PipeWire and the desktop portal provide the source picker. The navigation boundary and permission allowlist ensure only WhatsApp Web can reach this browser session.

- [ ] **Step 4: Run window and dependent policy tests**

Run: `npm test -- tests/window-config.test.ts tests/navigation-policy.test.ts tests/permission-policy.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit secure window support**

```bash
git add src/main/window-config.ts src/main/window.ts tests/window-config.test.ts
git commit -m "feat: create hardened WhatsApp window"
```

### Task 6: Integrate the native tray, autostart, and application lifecycle

**Files:**
- Create: `src/main/tray.ts`
- Create: `src/main/index.ts`
- Modify: `src/main/window.ts`
- Modify: `tests/lifecycle.test.ts`

**Interfaces:**
- Produces `buildTrayMenu(open: () => void, quit: () => void, setOpenAtLogin: (enabled: boolean) => void): Electron.Menu`.
- Consumes `resolveCloseAction`, `shouldStartHidden`, `createWindowOptions`, `configureWhatsAppWindow`, and the permission/navigation policies.

- [ ] **Step 1: Extend lifecycle tests with tray action behaviour**

```ts
import { describe, expect, it } from 'vitest';
import { trayAction } from '../src/main/tray';

describe('tray action routing', () => {
  it('maps menu identifiers to explicit application actions', () => {
    expect(trayAction('open')).toBe('show-window');
    expect(trayAction('quit')).toBe('quit-app');
  });

  it('rejects unknown tray menu identifiers', () => {
    expect(trayAction('delete-account')).toBe('ignore');
  });
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `npm test -- tests/lifecycle.test.ts`

Expected: FAIL because `trayAction` is not exported.

- [ ] **Step 3: Implement tray module and Electron bootstrap**

Implement pure `trayAction(id: string): 'show-window' | 'quit-app' | 'ignore'`. Build the tray menu with Open WhatsApp, a checked Start at login checkbox, and Quit.

In `index.ts`, acquire Electron's single-instance lock, call `app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: enabled })`, create the hardened window/tray after `app.whenReady()`, restore the hidden window on tray click or second-instance event, and use `resolveCloseAction()` in the `close` handler. Set `isQuitting = true` only from the Quit action, then call `app.quit()`.

- [ ] **Step 4: Run the complete unit suite and type check**

Run: `npm test && npm run typecheck && npm run lint`

Expected: PASS with zero failures, TypeScript errors, or lint warnings.

- [ ] **Step 5: Commit lifecycle integration**

```bash
git add src/main/index.ts src/main/tray.ts src/main/window.ts tests/lifecycle.test.ts
git commit -m "feat: keep WhatsApp active in the system tray"
```

### Task 7: Configure RPM packaging and execute Fedora acceptance checks

**Files:**
- Modify: `README.md`
- Modify: `forge.config.ts`
- Modify: `.github/workflows/ci.yml`
- Create: `tests/packaging-config.test.ts`

**Interfaces:**
- Produces an x86_64 Fedora RPM in `out/make/rpm/x64/`.
- Documents local development, RPM installation, explicit quit behavior, and required permissions.

- [ ] **Step 1: Add the failing RPM maker configuration test**

```ts
import { describe, expect, it } from 'vitest';
import forgeConfig from '../forge.config';

describe('Fedora distribution', () => {
  it('includes an RPM maker for Linux', () => {
    expect(forgeConfig.makers).toContainEqual(
      expect.objectContaining({ name: '@electron-forge/maker-rpm' }),
    );
  });
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `npm test -- tests/packaging-config.test.ts`

Expected: FAIL because the Forge configuration does not yet include the RPM maker.

- [ ] **Step 3: Add the RPM maker, usage documentation, and artifact upload**

Add `{ name: '@electron-forge/maker-rpm', platforms: ['linux'] }` to `forge.config.ts`. Document these commands in `README.md`:

```bash
npm ci
npm start
npm test
npm run make
sudo dnf install ./out/make/rpm/x64/wa-desktop-linux-0.1.0-1.x86_64.rpm
```

Document that closing hides to the tray, Quit terminates, WhatsApp must be linked by QR code, and camera/microphone/screen sharing require desktop permission. Make the CI workflow upload RPM artifacts after successful `npm run make`.

- [ ] **Step 4: Run production verification**

Run: `npm test && npm run typecheck && npm run lint && npm run make`

Expected: PASS and an RPM exists below `out/make/rpm/x64/`.

Manual Fedora acceptance checklist:

1. Launch the packaged application and link WhatsApp Web with QR code.
2. Close the window; verify its tray icon remains and WhatsApp Web stays linked.
3. Send a message from a second device; verify a GNOME notification appears while the window is hidden.
4. Receive a WhatsApp Web call; verify the hidden application can be restored and the call notification/UI is present.
5. Complete an audio call, then a video call, accepting microphone and camera permissions.
6. Start screen sharing in a video call; verify the Wayland portal picker appears and the chosen screen/window is shared.
7. Select Quit from the tray; verify the process ends and no notification is received until it is launched again.

- [ ] **Step 5: Commit release readiness changes**

```bash
git add README.md forge.config.ts .github/workflows/ci.yml tests/packaging-config.test.ts
git commit -m "docs: document Fedora packaging and verification"
```

## Plan Self-Review

- Spec coverage: Tasks 2, 4, and 5 implement origin and permission boundaries; Tasks 3 and 6 implement persistent background execution; Task 7 verifies notifications/calls/screen share and produces the Fedora RPM; Task 1 and Task 7 add CI and reproducible tooling.
- Placeholder scan: no deferred tasks or undefined interfaces remain.
- Type consistency: all main-process integration depends only on the named pure policy functions from Tasks 2–4.
