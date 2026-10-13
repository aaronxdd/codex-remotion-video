import {defineConfig} from 'vite';
export default defineConfig({
  base: process.env.VITE_PAGES === 'true' ? '/current-news/' : '/',
});
