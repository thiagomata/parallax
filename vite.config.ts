import { defineConfig } from 'vite';

export default defineConfig({
  base: '/parallax/', 
  test: {
    // This ensures your tests run in a browser-like environment if needed
    environment: 'happy-dom', 
    coverage: {
      provider: 'v8',
      // 'text' gives you the terminal table, 'html' gives you the website
      reporter: ['text', 'html', 'json', 'json-summary'],
      // This is the important part for seeing "missing" lines
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/**/*.test.ts'],
    },
  },
});