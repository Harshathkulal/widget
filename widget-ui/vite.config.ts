import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './dist/widget-ui/browser/main.js',
      formats: ['iife'],
      name: 'Widget',
      fileName: () => 'widget.js',
    },
  },
});