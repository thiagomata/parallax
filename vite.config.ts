import {defineConfig} from 'vitest/config';
import {codecovVitePlugin} from "@codecov/vite-plugin";
// import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
    base: '/parallax/',
    server: {
        open: true,
        host: true,
        allowedHosts: true,
    },
    build: {
        sourcemap: true,
        rollupOptions: {
            input: {
                main: './index.html',
                'docs/tutorial': './docs/tutorial/index.html',
                'docs/tutorial/tutorial-1': './docs/tutorial/tutorial-1/index.html',
                'docs/tutorial/tutorial-2': './docs/tutorial/tutorial-2/index.html',
                'docs/tutorial/tutorial-3': './docs/tutorial/tutorial-3/index.html',
                'docs/tutorial/tutorial-4': './docs/tutorial/tutorial-4/index.html',
                'docs/tutorial/tutorial-5': './docs/tutorial/tutorial-5/index.html',
                'docs/tutorial/tutorial-6': './docs/tutorial/tutorial-6/index.html',
                'docs/tutorial/tutorial-7': './docs/tutorial/tutorial-7/index.html',
                'docs/tutorial/tutorial-8': './docs/tutorial/tutorial-8/index.html',
                'docs/tutorial/tutorial-9': './docs/tutorial/tutorial-9/index.html',
            }
        }
    },
    plugins: [
        // basicSsl(),
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
            exclude: [
                'src/main.ts',
                'src/**/*.test.ts',
                'src/**/*.mock.ts',
                'src/**/*.demo.ts',
                'src/**/*.template.ts',
                'src/**/*_test_utils.ts',
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80
            }
        },
    },
});