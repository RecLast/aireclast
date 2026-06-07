/**
 * Merge wrangler.json with deploy-only settings (KV binding from env).
 * Keeps secrets and KV IDs out of the committed wrangler.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const basePath = path.join(rootDir, 'wrangler.json');
const outPath = path.join(rootDir, 'wrangler.generated.json');

const config = JSON.parse(fs.readFileSync(basePath, 'utf8'));
const kvId = process.env.AUTH_STORE_KV_ID?.trim();

if (kvId) {
  config.kv_namespaces = [
    {
      binding: 'AUTH_STORE',
      id: kvId,
    },
  ];
  console.log('AUTH_STORE KV binding added for deploy.');
} else {
  delete config.kv_namespaces;
  console.warn(
    'AUTH_STORE_KV_ID is not set. Deploy will omit KV binding (Dashboard-only bindings may be removed on deploy).'
  );
}

fs.writeFileSync(outPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Wrote ${path.relative(rootDir, outPath)}`);
