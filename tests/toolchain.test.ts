import { describe, expect, it } from 'vitest';
import project from '../package.json';
import vitestConfig from '../vitest.config';

describe('project toolchain', () => {
  it('exposes verification and Fedora packaging scripts', () => {
    expect(project.scripts).toMatchObject({
      test: expect.any(String),
      typecheck: expect.any(String),
      lint: expect.any(String),
      make: expect.any(String),
    });
  });

  it('uses a Node-only Vitest environment for test files', () => {
    expect(vitestConfig.test).toMatchObject({
      environment: 'node',
      include: ['tests/**/*.test.ts'],
    });
  });
});
