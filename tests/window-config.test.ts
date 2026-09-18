import type { BrowserWindow } from 'electron';
import { describe, expect, it, vi } from 'vitest';
import { createWindowOptions } from '../src/main/window-config';
import { configureWhatsAppWindow } from '../src/main/window';

const { openExternal } = vi.hoisted(() => ({
  openExternal: vi.fn(),
}));

vi.mock('electron', () => ({
  shell: { openExternal },
}));

type NavigationHandler = (event: { preventDefault: () => void }, url: string) => void;
type WindowOpenHandler = (details: { url: string }) => { action: 'deny' };
type PermissionRequestHandler = (
  webContents: { getURL: () => string },
  permission: string,
  callback: (granted: boolean) => void,
) => void;
type PermissionCheckHandler = (
  webContents: unknown,
  permission: string,
  requestingOrigin: string,
) => boolean;

function createWindowDouble() {
  let navigationHandler: NavigationHandler | undefined;
  let windowOpenHandler: WindowOpenHandler | undefined;
  let permissionRequestHandler: PermissionRequestHandler | undefined;
  let permissionCheckHandler: PermissionCheckHandler | undefined;
  const setDisplayMediaRequestHandler = vi.fn();

  const window = {
    loadURL: vi.fn(),
    webContents: {
      on: vi.fn((event: string, handler: NavigationHandler) => {
        if (event === 'will-navigate') navigationHandler = handler;
      }),
      setWindowOpenHandler: vi.fn((handler: WindowOpenHandler) => {
        windowOpenHandler = handler;
      }),
      session: {
        setPermissionRequestHandler: vi.fn((handler: PermissionRequestHandler) => {
          permissionRequestHandler = handler;
        }),
        setPermissionCheckHandler: vi.fn((handler: PermissionCheckHandler) => {
          permissionCheckHandler = handler;
        }),
        setDisplayMediaRequestHandler,
      },
    },
  } as unknown as BrowserWindow;

  return {
    window,
    handlers: {
      navigation: () => navigationHandler,
      windowOpen: () => windowOpenHandler,
      permissionRequest: () => permissionRequestHandler,
      permissionCheck: () => permissionCheckHandler,
    },
    setDisplayMediaRequestHandler,
  };
}

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

  it('uses the dedicated WhatsApp Web browser session', () => {
    expect(createWindowOptions()).toMatchObject({
      width: 1280,
      height: 800,
      backgroundColor: '#111b21',
      webPreferences: {
        partition: 'persist:whatsapp-web',
      },
    });
  });

  it('wires hardened navigation, external links, and permission policies', () => {
    const { handlers, setDisplayMediaRequestHandler, window } = createWindowDouble();
    configureWhatsAppWindow(window);

    expect(window.loadURL).toHaveBeenCalledWith('https://web.whatsapp.com');

    const event = { preventDefault: vi.fn() };
    handlers.navigation()?.(event, 'notaurl');
    expect(event.preventDefault).toHaveBeenCalledOnce();

    expect(handlers.windowOpen()?.({ url: 'notaurl' })).toEqual({ action: 'deny' });
    expect(openExternal).not.toHaveBeenCalled();
    expect(handlers.windowOpen()?.({ url: 'https://example.org/help' })).toEqual({ action: 'deny' });
    expect(openExternal).toHaveBeenCalledWith('https://example.org/help');

    const requestPermission = vi.fn();
    handlers.permissionRequest()?.(
      { getURL: () => 'https://web.whatsapp.com' },
      'media',
      requestPermission,
    );
    expect(requestPermission).toHaveBeenCalledWith(true);
    expect(handlers.permissionCheck()?.(null, 'geolocation', 'https://web.whatsapp.com')).toBe(false);
    expect(setDisplayMediaRequestHandler).not.toHaveBeenCalled();
  });
});
