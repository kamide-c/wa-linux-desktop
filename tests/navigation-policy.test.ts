import { describe, expect, it } from 'vitest';
import {
  isAllowedWhatsAppNavigation,
  shouldOpenExternally,
} from '../src/main/navigation-policy';

describe('WhatsApp navigation policy', () => {
  it('allows WhatsApp Web and rejects lookalike origins', () => {
    expect(isAllowedWhatsAppNavigation('https://web.whatsapp.com/')).toBe(true);
    expect(isAllowedWhatsAppNavigation('https://web.whatsapp.com.evil.test/')).toBe(false);
  });

  it('opens an explicit HTTPS link outside the application', () => {
    expect(shouldOpenExternally('https://example.org/help')).toBe(true);
    expect(shouldOpenExternally('javascript:alert(1)')).toBe(false);
  });
});
