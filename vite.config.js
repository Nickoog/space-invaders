import { defineConfig } from 'vite';

export default defineConfig({
  base: '/space-invaders/',
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js'],
  },
});
