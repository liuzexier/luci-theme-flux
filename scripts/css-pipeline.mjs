import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import * as sass from 'sass';
import tailwindcss from 'tailwindcss';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputFile = path.join(rootDir, 'src/styles/main.scss');
const outputFile = path.join(rootDir, 'htdocs/luci-static/flux/cascade.css');
const constantsFile = path.join(rootDir, 'htdocs/luci-static/flux/constants.json');
const logoTemplateFile = path.join(rootDir, 'src/assets/logo.svg');
const logoOutputFile = path.join(rootDir, 'htdocs/luci-static/flux/logo.svg');

function hexRgb(value) {
  const hex = value.replace('#', '');
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)).join(', ');
}

export async function compileCss({ write = false } = {}) {
  const constants = JSON.parse(await fs.readFile(constantsFile, 'utf8'));
  const appearance = constants.appearance;
  const sassResult = sass.compileString(`
    @use "main" with (
      $flux-primary: ${appearance.primary},
      $flux-primary-rgb: "${hexRgb(appearance.primary)}",
      $flux-light-background: ${appearance.light.background},
      $flux-light-background-rgb: "${hexRgb(appearance.light.background)}",
      $flux-light-surface: ${appearance.light.surface},
      $flux-light-surface-rgb: "${hexRgb(appearance.light.surface)}",
      $flux-light-surface-strong: ${appearance.light.surfaceStrong},
      $flux-light-text: ${appearance.light.text},
      $flux-light-muted: ${appearance.light.muted},
      $flux-light-border: ${appearance.light.border},
      $flux-light-danger: ${appearance.light.danger},
      $flux-dark-background: ${appearance.dark.background},
      $flux-dark-background-rgb: "${hexRgb(appearance.dark.background)}",
      $flux-dark-surface: ${appearance.dark.surface},
      $flux-dark-surface-rgb: "${hexRgb(appearance.dark.surface)}",
      $flux-dark-surface-strong: ${appearance.dark.surfaceStrong},
      $flux-dark-text: ${appearance.dark.text},
      $flux-dark-muted: ${appearance.dark.muted},
      $flux-dark-border: ${appearance.dark.border},
      $flux-dark-danger: ${appearance.dark.danger},
      $flux-glass-opacity: ${appearance.glassOpacity}
    );
  `, {
    loadPaths: [path.dirname(inputFile)],
    style: 'expanded',
  });
  const result = await postcss([
    tailwindcss(path.join(rootDir, 'tailwind.config.cjs')),
    autoprefixer(),
  ]).process(sassResult.css, {
    from: inputFile,
    map: false,
    to: outputFile,
  });

  if (write) {
    const logoTemplate = await fs.readFile(logoTemplateFile, 'utf8');

    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, result.css);
    await fs.writeFile(logoOutputFile, logoTemplate.replaceAll('__FLUX_PRIMARY__', appearance.primary));
  }

  return result.css;
}

export const cssPaths = { constantsFile, inputFile, logoOutputFile, logoTemplateFile, outputFile, rootDir };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  compileCss({ write: true })
    .then(() => {
      process.stdout.write(`Built ${path.relative(rootDir, outputFile)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error.stack || error.message}\n`);
      process.exitCode = 1;
    });
}
