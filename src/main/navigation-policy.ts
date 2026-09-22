export const WHATSAPP_WEB_ORIGIN = 'https://web.whatsapp.com';

export function isAllowedWhatsAppNavigation(rawUrl: string): boolean {
  return new URL(rawUrl).origin === WHATSAPP_WEB_ORIGIN;
}

export function shouldOpenExternally(rawUrl: string): boolean {
  return new URL(rawUrl).protocol === 'https:';
}
