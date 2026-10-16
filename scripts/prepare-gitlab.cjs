const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const source = path.resolve(__dirname, '..');
const destination = path.resolve(source, '../NavoyageGitLab');
const parent = path.dirname(source);
if (path.dirname(destination) !== parent || destination === source) throw new Error('Export must be a separate sibling application folder.');
if (fs.existsSync(destination)) throw new Error('NavoyageGitLab already exists. Preserve or move it before creating another export.');

execFileSync(process.execPath, [path.join(__dirname, 'check-secrets.cjs')], { stdio: 'inherit' });

const excludedDirectories = new Set(['.git', '.agents', '.github', '.vs', '.angular', '.artifacts', 'node_modules', 'bin', 'obj', 'dist', 'coverage', 'out-tsc', 'logs', 'documents', 'uploads']);
const excludedFile = /(?:\.(?:zip|7z|rar|tar|gz|log|bak|bacpac|mdf|ndf|ldf|db|sqlite3?|pfx|p12|pem|key|user|suo|dll|exe|pdb|tsbuildinfo)$|^id_rsa$|^id_ed25519$|^secrets\.json$|\.secrets\.json$|^runtime-config\.local\.js$|^appsettings(?:\..*)?\.local\.json$)/i;
let copied = 0;
function copy(from, to) {
  const name = path.basename(from);
  const info = fs.lstatSync(from);
  if (info.isSymbolicLink()) throw new Error(`Refusing to export a filesystem link: ${path.relative(source, from)}`);
  if (info.isDirectory()) {
    if (excludedDirectories.has(name.toLowerCase())) return;
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from)) copy(path.join(from, entry), path.join(to, entry));
  } else {
    if (excludedFile.test(name) || (/^\.env(?:\..+)?$/i.test(name) && !/^\.env\.(?:example|sample)$/i.test(name))) return;
    fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL);
    copied++;
  }
}

fs.mkdirSync(destination);
for (const folder of ['frontend', 'backend', 'database', 'scripts']) copy(path.join(source, folder), path.join(destination, folder));
for (const file of ['README.md', '.gitignore', '.env.example', '.gitlab-ci.yml', 'docker-compose.yml']) copy(path.join(source, file), path.join(destination, file));
execFileSync('git', ['init', '--initial-branch=main', destination], { stdio: 'inherit' });
execFileSync(process.execPath, [path.join(destination, 'scripts/check-secrets.cjs')], { stdio: 'inherit' });
console.log(`Prepared ${copied} files in ${destination}. No previous Git history or private local settings were copied.`);
