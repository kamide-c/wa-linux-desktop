import { WHATSAPP_WEB_ORIGIN } from './navigation-policy';

export type SupportedPermission = 'media' | 'notifications' | 'display-capture';

const ALLOWED_PERMISSIONS = new Set<SupportedPermission>([
  'media',
  'notifications',
  'display-capture',
]);

export function isAllowedWhatsAppPermission(origin: string, permission: string): boolean {
  return origin === WHATSAPP_WEB_ORIGIN && ALLOWED_PERMISSIONS.has(permission as SupportedPermission);
}

export function allowedDisplayMediaOrigin(origin: string): boolean {
  return origin === WHATSAPP_WEB_ORIGIN;
}
