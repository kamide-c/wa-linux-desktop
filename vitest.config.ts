// eslint-disable-next-line @typescript-eslint/no-require-imports
import vitest = require('vitest/config');

const config = vitest.defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});

export = config;
