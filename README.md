# WA Desktop Linux

A personal desktop shell for the official WhatsApp Web experience on Fedora Linux, GNOME, and Wayland.

> **Project status:** early development. Fedora RPM builds are available from the local build output; the first release is not yet published.

## Goals

- Keep WhatsApp Web running in the background after the window is closed.
- Provide a system tray icon, autostart, and GNOME notifications.
- Preserve the locally linked WhatsApp Web session.
- Support WhatsApp Web voice calls, video calls, and Wayland screen sharing when those features are enabled for the linked account.
- Keep all data local: no backend, telemetry, message relay, or custom WhatsApp protocol.

## Technical direction

The app will be built from scratch with a current Electron and Chromium runtime. It loads only [WhatsApp Web](https://web.whatsapp.com) and uses a dedicated local browser profile.

The host application will not inspect, modify, or transmit WhatsApp conversations. It will run with Node.js disabled in the web page, context isolation enabled, Chromium sandboxing enabled, and navigation limited to WhatsApp-owned pages.

## Platform

The first release targets:

- Fedora Linux 44
- GNOME on Wayland
- x86_64

Other distributions, X11, Flatpak packaging, and non-Linux platforms are out of scope for the first release.

## Development

Requirements: Fedora 44 or newer, GNOME on Wayland, x86_64, Node.js 24, and npm.

```bash
npm ci
npm start
```

Run the checks and create a Fedora RPM:

```bash
npm test
npm run typecheck
npm run lint
npm run make
sudo dnf install ./out/make/*/wa-desktop-linux-*.rpm
```

The application is designed to remain active in the system tray when its window is closed. Use the tray menu to show the window, enable autostart, or quit completely. The first launch opens WhatsApp Web and requires the normal QR-code linking flow.

The RPM is deliberately built locally or by the repository's CI; no third-party WhatsApp binary is downloaded. The app itself loads only `https://web.whatsapp.com` and stores its Chromium session in Electron's local persistent profile.

## Security

Please report security concerns privately to the repository owner rather than opening a public issue that discloses an exploit. Do not paste WhatsApp session data, QR codes, logs containing message content, or profile directories into an issue.

This project is independent and is not affiliated with, endorsed by, or supported by WhatsApp or Meta. WhatsApp is a trademark of its respective owner.

## License

This project is licensed under the [MIT License](LICENSE).
