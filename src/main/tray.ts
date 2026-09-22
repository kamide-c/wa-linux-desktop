import { Menu } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';

export type TrayAction = 'show-window' | 'quit-app' | 'ignore';

export function trayAction(id: string): TrayAction {
  if (id === 'open') return 'show-window';
  if (id === 'quit') return 'quit-app';
  return 'ignore';
}

export function buildTrayMenu(
  open: () => void,
  quit: () => void,
  setOpenAtLogin: (enabled: boolean) => void,
  openAtLogin = false,
): Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      id: 'open',
      label: 'Open WhatsApp',
      click: () => open(),
    },
    {
      type: 'checkbox',
      label: 'Start at login',
      checked: openAtLogin,
      click: (item) => setOpenAtLogin(item.checked),
    },
    { type: 'separator' },
    {
      id: 'quit',
      label: 'Quit',
      click: () => quit(),
    },
  ];

  return Menu.buildFromTemplate(template);
}
