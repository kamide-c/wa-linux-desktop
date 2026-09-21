import { shell } from 'electron';
import type { BrowserWindow } from 'electron';
import {
  isAllowedWhatsAppNavigation,
  shouldOpenExternally,
  WHATSAPP_WEB_ORIGIN,
} from './navigation-policy';
import { isAllowedWhatsAppPermission } from './permission-policy';

export function getWhatsAppUserAgent(chromeVersion: string): string {
  return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

function safelyApplyUrlPolicy(policy: (url: string) => boolean, rawUrl: unknown): boolean {
  if (typeof rawUrl !== 'string') return false;

  try {
    return policy(rawUrl);
  } catch {
    return false;
  }
}

function safelyAllowPermission(requestingUrl: unknown, permission: unknown): boolean {
  if (typeof requestingUrl !== 'string' || typeof permission !== 'string') return false;

  try {
    return isAllowedWhatsAppPermission(new URL(requestingUrl).origin, permission);
  } catch {
    return false;
  }
}

export function configureWhatsAppWindow(window: BrowserWindow): void {
  window.webContents.session.setUserAgent(getWhatsAppUserAgent(process.versions.chrome));
  window.loadURL(WHATSAPP_WEB_ORIGIN);

  window.webContents.on('will-navigate', (event, url) => {
    if (!safelyApplyUrlPolicy(isAllowedWhatsAppNavigation, url)) event.preventDefault();
  });

  window.webContents.on('will-redirect', (event, url) => {
    if (!safelyApplyUrlPolicy(isAllowedWhatsAppNavigation, url)) event.preventDefault();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (safelyApplyUrlPolicy(shouldOpenExternally, url)) {
      void shell.openExternal(url);
    }

    return { action: 'deny' };
  });

  window.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(safelyAllowPermission(webContents.getURL(), permission));
  });

  window.webContents.session.setPermissionCheckHandler((_webContents, permission, requestingOrigin) =>
    safelyAllowPermission(requestingOrigin, permission),
  );
}
