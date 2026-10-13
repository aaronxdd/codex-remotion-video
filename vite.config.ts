import {defineConfig} from 'vite';
export default defineConfig({
  base: process.env.VITE_PAGES === 'true' ? '/codex-remotion-video/' : '/',
});
