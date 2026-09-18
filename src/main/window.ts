import { shell } from 'electron';
import type { BrowserWindow } from 'electron';
import {
  isAllowedWhatsAppNavigation,
  shouldOpenExternally,
  WHATSAPP_WEB_ORIGIN,
} from './navigation-policy';
import { isAllowedWhatsAppPermission } from './permission-policy';

function safelyApplyUrlPolicy(policy: (url: string) => boolean, rawUrl: unknown): boolean {
  if (typeof rawUrl !== 'string') return false;

  try {
    return policy(rawUrl);
  } catch {
    return false;
  }
}

function safelyAllowPermission(origin: unknown, permission: unknown): boolean {
  if (typeof origin !== 'string' || typeof permission !== 'string') return false;

  try {
    return isAllowedWhatsAppPermission(origin, permission);
  } catch {
    return false;
  }
}

export function configureWhatsAppWindow(window: BrowserWindow): void {
  window.loadURL(WHATSAPP_WEB_ORIGIN);

  window.webContents.on('will-navigate', (event, url) => {
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
