export type CloseAction = 'hide' | 'quit';

export function resolveCloseAction(isQuitting: boolean): CloseAction {
  return isQuitting ? 'quit' : 'hide';
}

export function shouldStartHidden(openAtLogin: boolean): boolean {
  return openAtLogin;
}
