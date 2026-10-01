/**
 * Add .js extensions to extensionless relative ESM imports (NodeNext / Vercel).
 * Idempotent: skips specifiers that already have a file extension.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const HAS_EXT = /\.(js|jsx|ts|tsx|mjs|cjs|json|css)$/i;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.ts') && !name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

function shouldProcess(file) {
  if (file.includes('.test.ts')) return false;
  return true;
}

function patchSpec(spec) {
  if (!spec.startsWith('.')) return spec;
  if (HAS_EXT.test(spec)) return spec;
  return `${spec}.js`;
}

function patchFile(content) {
  const patterns = [
    /(\bfrom\s+['"])(\.[^'"]+)(['"])/g,
    /(\bexport\s+\*\s+from\s+['"])(\.[^'"]+)(['"])/g,
    /(\bexport\s+\{[^}]*\}\s+from\s+['"])(\.[^'"]+)(['"])/g,
    /(\bimport\s*\(\s*['"])(\.[^'"]+)(['"]\s*\))/g,
  ];
  let next = content;
  for (const re of patterns) {
    next = next.replace(re, (_, pre, spec, post) => `${pre}${patchSpec(spec)}${post}`);
  }
  return next;
}

const dirs = [
  path.join(ROOT, 'api'),
  path.join(ROOT, 'server'),
  path.join(ROOT, 'src', 'server'),
  path.join(ROOT, 'src', 'lib', 'crm'),
  path.join(ROOT, 'src', 'types'),
];

const files = dirs.flatMap((d) => walk(d)).filter(shouldProcess);
let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  const after = patchFile(before);
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed++;
  }
}
console.log(`Patched ${changed} files (${files.length} scanned).`);
