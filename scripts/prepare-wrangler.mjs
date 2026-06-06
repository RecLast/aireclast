import fs from 'fs';
import path from 'path';

const root = process.cwd();
const examplePath = path.join(root, 'wrangler.example.json');
const targetPath = path.join(root, 'wrangler.json');

const kvId = process.env.AUTH_STORE_KV_ID;

if (kvId) {
  const config = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
  config.kv_namespaces[0].id = kvId;
  fs.writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log('Generated wrangler.json from AUTH_STORE_KV_ID');
  process.exit(0);
}

if (fs.existsSync(targetPath)) {
  console.log('Using wrangler.json from repository');
  process.exit(0);
}

console.error(
  'Missing wrangler.json. Either commit wrangler.json (copy from wrangler.example.json) or set AUTH_STORE_KV_ID in Cloudflare Build variables (Workers KV → AUTH_STORE → Namespace ID).'
);
process.exit(1);
