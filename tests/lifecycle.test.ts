import { describe, expect, it } from 'vitest';
import { resolveCloseAction, shouldStartHidden } from '../src/main/lifecycle';

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
