# WA Desktop Linux

A personal desktop shell for the official WhatsApp Web experience on Fedora Linux, GNOME, and Wayland.

> **Project status:** planning. The application has not been implemented or released yet.

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

The application is not ready to run yet. Development setup, test commands, and RPM packaging instructions will be added with the first implementation.

## Security

Please report security concerns privately to the repository owner rather than opening a public issue that discloses an exploit.

This project is independent and is not affiliated with, endorsed by, or supported by WhatsApp or Meta. WhatsApp is a trademark of its respective owner.

## License

This project is licensed under the [MIT License](LICENSE).
