import type { BrowserWindowConstructorOptions } from 'electron';

export function createWindowOptions(): BrowserWindowConstructorOptions {
  return {
    show: false,
    width: 1280,
    height: 800,
    backgroundColor: '#111b21',
    webPreferences: {
      partition: 'persist:whatsapp-web',
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  };
}
