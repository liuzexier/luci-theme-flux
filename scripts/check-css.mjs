import fs from 'node:fs/promises';
import { compileCss, cssPaths } from './css-pipeline.mjs';

const css = await compileCss();
const constants = JSON.parse(await fs.readFile(cssPaths.constantsFile, 'utf8'));
const appearance = constants.appearance;
const logoTemplate = await fs.readFile(cssPaths.logoTemplateFile, 'utf8');
const forbidden = ['@tailwind', '@use', '@forward'];
const required = [
  ':root',
  '.flux-header',
  '.flux-bottom-nav',
  '.flux-mobile-drawer',
  '.cbi-dropdown',
  '.cbi-page-actions',
  '@media (max-width: 900px)',
];

for (const token of forbidden) {
  if (css.includes(token)) {
    throw new Error(`Generated CSS still contains ${token}`);
  }
}

for (const selector of required) {
  if (!css.includes(selector)) {
    throw new Error(`Generated CSS is missing ${selector}`);
  }
}

if (css.length < 40000) {
  throw new Error(`Generated CSS is unexpectedly small (${css.length} bytes)`);
}

for (const color of [
  appearance.primary,
  appearance.light.background,
  appearance.light.surface,
  appearance.light.text,
  appearance.dark.background,
  appearance.dark.surface,
  appearance.dark.text,
]) {
  if (!css.includes(color)) {
    throw new Error(`Generated CSS is missing theme constant ${color}`);
  }
}

if (!logoTemplate.includes('__FLUX_PRIMARY__')) {
  throw new Error('Logo template is missing the primary color token');
}

process.stdout.write(`CSS check passed (${css.length} bytes)\n`);
