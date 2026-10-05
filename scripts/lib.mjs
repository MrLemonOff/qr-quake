import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

export async function startApp(port = 4173) {
  const executablePath = CANDIDATES.find((p) => fs.existsSync(p));
  if (!executablePath) throw new Error('No Chrome, Edge or Chromium found. Set CHROME_PATH.');

  const build = spawnSync(process.execPath, [vite, 'build'], { cwd: root, stdio: 'ignore' });
  if (build.status !== 0) throw new Error('Build failed.');

  const server = spawn(process.execPath, [vite, 'preview', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
  const url = `http://localhost:${port}/`;
  for (let i = 0; i < 80; i += 1) {
    try {
      if ((await fetch(url)).ok) break;
    } catch (err) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] });

  const stop = async () => {
    await browser.close();
    server.kill();
  };
  return { browser, url, stop };
}
