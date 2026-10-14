import { cpSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const root = import.meta.dirname;

// Keep public paths unchanged: sprites, docs and the pre-render appearance script.
function copyStaticFiles(): Plugin {
  return {
    name: 'copy-static-files',
    apply: 'build',
    closeBundle() {
      const out = resolve(root, 'dist');
      cpSync(resolve(root, 'assets'), resolve(out, 'assets'), { recursive: true });
      cpSync(resolve(root, 'docs'), resolve(out, 'docs'), { recursive: true });
      cpSync(resolve(root, 'scripts/theme-init.js'), resolve(out, 'scripts/theme-init.js'));
      cpSync(resolve(root, '.nojekyll'), resolve(out, '.nojekyll'));
    },
  };
}

export default defineConfig({
  base: '/stardew-diary/',
  publicDir: false,
  plugins: [react(), copyStaticFiles()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        catalogo: resolve(root, 'catalogo.html'),
        museu: resolve(root, 'museu.html'),
      },
    },
  },
});
