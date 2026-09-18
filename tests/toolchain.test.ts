import { describe, expect, it } from 'vitest';
import project from '../package.json';

describe('project toolchain', () => {
  it('exposes verification and Fedora packaging scripts', () => {
    expect(project.scripts).toMatchObject({
      test: expect.any(String),
      typecheck: expect.any(String),
      lint: expect.any(String),
      make: expect.any(String),
    });
  });
});
