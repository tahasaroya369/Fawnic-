import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

// Development-only plugin to handle HMR WebSocket gracefully in sandboxed / iframe preview environments
function previewHmrGraceful(): Plugin {
  return {
    name: 'preview-hmr-graceful',
    apply: 'serve',
    enforce: 'post',
    transform(code, id) {
      if (id.includes('vite/dist/client/client.mjs')) {
        let transformed = code;
        // 1. Attach catch handler to prevent Unhandled Promise Rejection when preview proxy closes WebSocket
        transformed = transformed.replace(
          'transport.connect(createHMRHandler(handleMessage))',
          'transport.connect(createHMRHandler(handleMessage)).catch(() => {})'
        );
        // 2. Prevent unhandled throw when WebSocket closes without opening
        transformed = transformed.replace(
          'console.error(`[vite] failed to connect to websocket (${e}). `);\n          throw e;',
          'console.debug("[vite] HMR WebSocket not reachable in preview environment.");'
        );
        // 3. Demote failing direct websocket fallback log from console.error to console.debug
        transformed = transformed.replace(
          'console.error(\n                  `[vite] failed to connect to websocket.',
          'console.debug(\n                  `[vite] failed to connect to websocket.'
        );
        return { code: transformed, map: null };
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), previewHmrGraceful()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // Allow Google AI Studio preview iframe host domains
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
