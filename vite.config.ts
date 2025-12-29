import { defineConfig } from 'vitest/config'; 
import { codecovVitePlugin } from "@codecov/vite-plugin";

export default defineConfig({
  base: '/parallax/',
  server: {
    open: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        p5_graphic_processor_demo: './src/scene/p5/p5_graphic_processor.demo.html',
        p5_world_demo: './src/scene/p5/p5_world.demo.html'
      }
    }
  },
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
      exclude: ['src/main.ts', 'src/**/*.test.ts', "src/**/*.demo.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },
  },
});