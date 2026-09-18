import { describe, expect, it } from 'vitest';
import { resolveCloseAction, shouldStartHidden } from '../src/main/lifecycle';
import { trayAction } from '../src/main/tray';

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
