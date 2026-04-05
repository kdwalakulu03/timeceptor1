import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // Vite project root is client/ — index.html lives there
    root: 'client',

    // .env lives at project root, not inside client/
    envDir: path.resolve(__dirname),

    plugins: [react(), tailwindcss()],

    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
    },

    resolve: {
      alias: {
        // @ maps to client/src/ for clean imports inside the frontend
        '@': path.resolve(__dirname, 'client/src'),
      },
    },

    build: {
      // Output goes to <project-root>/dist/ so Express can serve it
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            // Split heavy lib so landing page loads fast
            'astronomy': ['astronomy-engine'],
          },
        },
      },
    },

    server: {
      port: 47000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      // In dev, proxy API calls to Express running on a different port
      proxy: {
        '/api': 'http://localhost:47001',
      },
    },
  };
});

