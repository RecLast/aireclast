import fs from 'fs';
import path from 'path';

const root = process.cwd();
const examplePath = path.join(root, 'wrangler.example.json');
const targetPath = path.join(root, 'wrangler.json');

if (fs.existsSync(targetPath)) {
  console.log('Using existing wrangler.json');
  process.exit(0);
}

const kvId = process.env.AUTH_STORE_KV_ID;
if (!kvId) {
  console.error(
    'Missing wrangler.json. For CI deploy, set the AUTH_STORE_KV_ID build variable in Cloudflare (Workers KV → AUTH_STORE → Namespace ID). For local deploy, copy wrangler.example.json to wrangler.json and set the KV id.'
  );
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
config.kv_namespaces[0].id = kvId;

fs.writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`);
console.log('Generated wrangler.json from wrangler.example.json');
