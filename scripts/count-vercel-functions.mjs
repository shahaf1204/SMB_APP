/**
 * Count Vercel Serverless Functions (api files with export default handler).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const API = path.join(ROOT, 'api');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

const files = walk(API);
const functions = files.filter((f) => /\bexport\s+default\s+/.test(fs.readFileSync(f, 'utf8')));

console.log(`Vercel serverless function count: ${functions.length}`);
for (const f of functions.sort()) {
  console.log(`  ${path.relative(ROOT, f).replace(/\\/g, '/')}`);
}
process.exit(functions.length > 12 ? 1 : 0);
