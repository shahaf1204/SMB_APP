import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const HAS_EXT = /\.(js|jsx|ts|tsx|json|mjs|cjs)$/i;
const re = /\bfrom\s+['"](\.[^'"]+)['"]/g;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.ts') && !name.endsWith('.d.ts') && !name.includes('.test.')) out.push(full);
  }
  return out;
}

const roots = ['api', 'server', 'src/server', 'src/lib/crm', 'src/types'].map((r) =>
  path.join(ROOT, r),
);
const bad = [];
for (const root of roots) {
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = re.exec(text))) {
      const spec = m[1];
      if (!HAS_EXT.test(spec)) bad.push({ file: path.relative(ROOT, file), spec });
    }
    re.lastIndex = 0;
  }
}
console.log(`extensionless relative imports: ${bad.length}`);
for (const row of bad) console.log(`${row.file}: ${row.spec}`);
process.exit(bad.length ? 1 : 0);
