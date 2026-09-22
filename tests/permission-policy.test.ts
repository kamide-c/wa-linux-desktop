import { describe, expect, it } from 'vitest';
import {
  allowedDisplayMediaOrigin,
  isAllowedWhatsAppPermission,
} from '../src/main/permission-policy';

describe('WhatsApp permission policy', () => {
  it('allows media, notification, and display-capture permissions only for WhatsApp Web', () => {
    expect(isAllowedWhatsAppPermission('https://web.whatsapp.com', 'media')).toBe(true);
    expect(isAllowedWhatsAppPermission('https://web.whatsapp.com', 'notifications')).toBe(true);
    expect(isAllowedWhatsAppPermission('https://web.whatsapp.com', 'display-capture')).toBe(true);
    expect(isAllowedWhatsAppPermission('https://evil.test', 'media')).toBe(false);
  });

  it('does not allow unrelated browser permissions', () => {
    expect(isAllowedWhatsAppPermission('https://web.whatsapp.com', 'geolocation')).toBe(false);
  });

  it('allows display-media selection only for the exact WhatsApp Web origin', () => {
    expect(allowedDisplayMediaOrigin('https://web.whatsapp.com')).toBe(true);
    expect(allowedDisplayMediaOrigin('https://web.whatsapp.com.evil.test')).toBe(false);
  });
});
