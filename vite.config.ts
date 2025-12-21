import { defineConfig } from 'vitest/config'; 
import { codecovVitePlugin } from "@codecov/vite-plugin";

export default defineConfig({
  base: '/parallax/', 
  plugins: [
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: "parallax-camera",
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],
  test: {
    environment: 'happy-dom', 
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/**/*.test.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },
  },
});