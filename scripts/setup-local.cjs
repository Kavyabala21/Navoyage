const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const configRoot = path.resolve(__dirname, '../backend/config');
const destination = path.join(configRoot, 'appsettings.local.json');

if (fs.existsSync(destination)) {
  console.log('backend/config/appsettings.local.json already exists; existing local settings were preserved.');
} else {
  const settings = JSON.parse(fs.readFileSync(path.join(configRoot, 'appsettings.local.example.json'), 'utf8'));
  settings.Jwt.Key = crypto.randomBytes(48).toString('base64');
  fs.writeFileSync(destination, JSON.stringify(settings, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log('Created ignored backend/config/appsettings.local.json with a new random JWT signing key.');
  console.log('Enter your own provider keys in that local file to enable AI, images, and payments.');
}
