import { app, BrowserWindow, nativeImage, Tray } from 'electron';
import { resolveCloseAction, shouldStartHidden } from './lifecycle';
import { buildTrayMenu } from './tray';
import { createWindowOptions } from './window-config';
import { configureWhatsAppWindow } from './window';
import whatsappIconPng from '../assets/whatsapp-icon.png';

let mainWindow: BrowserWindow | undefined;
let tray: Tray | undefined;
let isQuitting = false;
let shouldShowWindow = false;

function showWindow(): void {
  if (!mainWindow) {
    shouldShowWindow = true;
    return;
  }

  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function quitApplication(): void {
  isQuitting = true;
  app.quit();
}

function setOpenAtLogin(enabled: boolean): void {
  const settings = { openAtLogin: enabled, openAsHidden: enabled } as Parameters<
    typeof app.setLoginItemSettings
  >[0];
  app.setLoginItemSettings(settings);
  tray?.setContextMenu(buildTrayMenu(showWindow, quitApplication, setOpenAtLogin, enabled));
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow(createWindowOptions());
  mainWindow.setIcon(nativeImage.createFromDataURL(whatsappIconPng));
  configureWhatsAppWindow(mainWindow);

  mainWindow.on('close', (event) => {
    if (resolveCloseAction(isQuitting) === 'hide') {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  if (shouldShowWindow || !shouldStartHidden(app.getLoginItemSettings().wasOpenedAtLogin)) {
    showWindow();
  }
}

function createTray(): void {
  tray = new Tray(nativeImage.createFromDataURL(whatsappIconPng));
  tray.setContextMenu(
    buildTrayMenu(
      showWindow,
      quitApplication,
      setOpenAtLogin,
      app.getLoginItemSettings().openAtLogin,
    ),
  );
  tray.on('click', showWindow);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  void app.whenReady().then(() => {
    createMainWindow();
    createTray();
  });
}
