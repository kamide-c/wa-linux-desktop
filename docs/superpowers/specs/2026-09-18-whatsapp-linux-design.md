# WhatsApp Linux Desktop — Design

## Objective

Create a personal Linux desktop application for Fedora 44, GNOME and Wayland that hosts the official WhatsApp Web experience in a secure Electron shell. Closing the window keeps the application running in the system tray so WhatsApp Web can receive messages and calls. The application must support the existing WhatsApp Web calling capability, including camera, microphone and system screen sharing.

## Scope

The first release targets the current laptop only: Fedora Linux 44, GNOME and Wayland on x86_64. It is a local application with no backend, analytics, custom messaging protocol or cloud service.

The application loads only `https://web.whatsapp.com`. Its code must not inspect, modify, relay or persist conversation content beyond the Chromium profile that WhatsApp Web itself requires.

## Architecture

Electron provides a single `BrowserWindow` with a persistent session partition dedicated to the application. Chromium loads the official WhatsApp Web URL directly.

The Electron main process owns the lifecycle and native integrations:

- Intercept the normal close action and hide the window instead of quitting.
- Create a tray icon and menu with Open WhatsApp, Start at login, and Quit actions.
- Start hidden after login when autostart is enabled.
- Limit window navigation and popup creation to WhatsApp-owned domains.
- Grant camera, microphone, notification and display-capture access only when the requesting origin is `https://web.whatsapp.com`.
- Use Chromium's native Wayland/PipeWire screen-sharing path; the system portal chooses the screen or window to share.

The renderer is the WhatsApp Web page. The host application exposes no Node.js environment to it and does not inject a preload bridge for app features.

## Privacy and Security

- `nodeIntegration` is disabled.
- `contextIsolation` and Chromium sandboxing are enabled.
- No Electron remote module, arbitrary shell execution, file-system API, custom protocol, telemetry or auto-updater is included.
- Navigation is blocked unless it remains on WhatsApp-owned origins; external links use the default browser only after explicit user action.
- The persistent Chromium profile is stored only in the local Electron user-data directory and is excluded from Git.
- The public repository contains no account data, QR artifacts, session files, access tokens or secrets.

## Runtime Behaviour

On the first launch, the user links the device using WhatsApp's QR code. On later launches, the preserved local profile restores the linked-device session.

When the main window is closed, the application remains alive and hidden. WhatsApp Web stays loaded, allowing its native Notification API and incoming-call UI to operate. A click on the tray icon restores the window. Only the tray menu's Quit command terminates the process.

For calls, the application requests camera and microphone access through the browser permission flow. For screen sharing, Chromium uses the Fedora Wayland portal/PipeWire picker. If the portal or a device permission is denied, the call remains in WhatsApp Web and displays its own failure state; the host does not bypass the operating system.

## Packaging and Distribution

The app is packaged initially as an RPM for the current Fedora laptop. A local development workflow runs from source. Flatpak and other distributions are explicitly out of scope for the first release because their sandbox permissions add a separate compatibility layer for media and sharing.

## Testing and Verification

Unit tests cover pure lifecycle and security-policy functions: close-to-tray decisions, allowed navigation origins, external-link policy, and permission allowlists.

An Electron smoke test verifies that the application launches in a test profile and loads the allowed entry URL. Manual acceptance testing on the laptop verifies login persistence, close-to-tray, autostart, GNOME notifications, incoming-call notification, voice/video calls, and the Wayland portal screen picker. Live WhatsApp calls cannot be fully automated without a second linked account and real media devices.

## Repository Protection

The GitHub repository is public under the personal `kamide-c` account. The default branch is `main`; direct force pushes and branch deletion are prohibited. Pull requests require one approving review and the CI status check to pass before merging, subject to GitHub's plan capabilities. GitHub Actions runs tests, linting and production packaging validation.

## Explicit Non-goals

- Reimplementing WhatsApp's protocol, encryption or calling stack.
- Modifying WhatsApp Web content or injecting message-observation code.
- Supporting non-Linux platforms, multiple Linux desktop environments or X11 in the first release.
- Guaranteeing availability of WhatsApp Web features controlled by Meta.
