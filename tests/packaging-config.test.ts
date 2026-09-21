import { describe, expect, it } from 'vitest';
import config from '../forge.config';

describe('RPM packaging', () => {
  it('includes the Electron Forge RPM maker', () => {
    expect(config.makers).toHaveLength(1);
    expect(config.makers?.[0]).toBeInstanceOf(Object);
    expect((config.makers?.[0] as { name?: string }).name).toBe('rpm');
  });
});
