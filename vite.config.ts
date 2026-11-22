import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const buildTime = Date.now().toString();

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        '__BUILD_TIME__': mode === 'development' ? '"dev"' : JSON.stringify(buildTime)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 3000
      }
    };
});
