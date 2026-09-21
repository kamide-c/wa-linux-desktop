import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveCloseAction, shouldStartHidden } from '../src/main/lifecycle';
import { trayAction } from '../src/main/tray';

const { createFromDataURL, trayInstances } = vi.hoisted(() => ({
  createFromDataURL: vi.fn(() => ({ isEmpty: () => false })),
  trayInstances: [] as Array<{ setContextMenu: ReturnType<typeof vi.fn>; on: ReturnType<typeof vi.fn> }>,
}));

vi.mock('electron', () => ({
  app: {
    getLoginItemSettings: () => ({ openAtLogin: false, wasOpenedAtLogin: false }),
    on: vi.fn(),
    quit: vi.fn(),
    requestSingleInstanceLock: () => true,
    setLoginItemSettings: vi.fn(),
    whenReady: () => Promise.resolve(),
  },
  BrowserWindow: class {
    isMinimized = () => false;
    focus = vi.fn();
    hide = vi.fn();
    on = vi.fn();
    restore = vi.fn();
    show = vi.fn();
    loadURL = vi.fn();
    setIcon = vi.fn();
    webContents = { on: vi.fn(), setWindowOpenHandler: vi.fn(), setUserAgent: vi.fn(), session: { setPermissionRequestHandler: vi.fn(), setPermissionCheckHandler: vi.fn() } };
  },
  Menu: { buildFromTemplate: vi.fn() },
  nativeImage: { createFromDataURL },
  Tray: class {
    setContextMenu = vi.fn();
    on = vi.fn();

    constructor(image: unknown) {
      void image;
      trayInstances.push(this);
    }
  },
}));

afterEach(() => {
  createFromDataURL.mockClear();
  trayInstances.length = 0;
  vi.resetModules();
});

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

describe('tray action routing', () => {
  it('maps menu identifiers to explicit application actions', () => {
    expect(trayAction('open')).toBe('show-window');
    expect(trayAction('quit')).toBe('quit-app');
  });

  it('rejects unknown tray menu identifiers', () => {
    expect(trayAction('delete-account')).toBe('ignore');
  });
});

describe('tray icon', () => {
  it('creates the tray from the bundled monochrome chat-bubble asset', async () => {
    await import('../src/main/index.js');
    await Promise.resolve();

    expect(createFromDataURL).toHaveBeenCalledWith(
      expect.stringMatching(/^(data:image\/png;base64,|\/src\/assets\/whatsapp-icon\.png$)/),
    );
    expect(trayInstances).toHaveLength(1);
  });
});
