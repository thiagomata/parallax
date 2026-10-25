import { defineConfig, mergeConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import base from './vite.config.ts';

/**
 * The dev server over HTTPS, for the pages that need the camera from another device:
 * getUserMedia only works in a secure context, and http://<ip>:5173 is not one.
 *
 * Local only - the certificate is self-signed, so the browser asks to trust it.
 *   npx vite --config vite.https.config.ts --host 0.0.0.0
 */
export default mergeConfig(base, defineConfig({
    plugins: [basicSsl()],
    server: {
        open: false,
        host: true,
        allowedHosts: true,
    },
}));
