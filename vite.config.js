import { defineConfig } from 'vite';

// The production page may not talk to the network at all: pictures and links never leave the tab.
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'none'",
  "font-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');

const contentSecurityPolicy = {
  name: 'qr-quake-csp',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
  ],
};

export default defineConfig({
  // Relative asset paths so the build works on GitHub Pages under /<repo>/ and from any folder.
  base: './',
  plugins: [contentSecurityPolicy],
  build: { target: 'es2022', sourcemap: false },
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup-env.js'],
    testTimeout: 60000,
  },
});
