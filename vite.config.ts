import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY works in the production build
      // by replacing it with the value from your hosting provider's environment variables
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});