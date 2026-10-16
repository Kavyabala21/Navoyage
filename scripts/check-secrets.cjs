const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const excludedDirectories = new Set(['.git', '.agents', '.vs', '.angular', '.artifacts', 'node_modules', 'bin', 'obj', 'dist', 'coverage', 'out-tsc', 'logs', 'documents', 'uploads']);
const privateName = /(?:^|\/)(?:\.env(?:\..+)?|appsettings(?:\.[^/]*)?\.local\.json|secrets\.json|[^/]+\.secrets\.json|runtime-config\.local\.js|id_rsa|id_ed25519)$/i;
const privateExtension = /\.(?:zip|7z|rar|tar|gz|log|bak|bacpac|mdf|ndf|ldf|db|sqlite3?|pfx|p12|pem|key|user|suo|dll|exe|pdb)$/i;
const textExtensions = /\.(?:cjs|mjs|js|ts|json|html|scss|css|cs|csproj|props|sln|md|txt|sql|ps1|yml|yaml|http|xml|config|example)$/i;
const findings = [];

function isExample(file) {
  return /(?:\.example|\.sample)(?:\.[^/]*)?$/i.test(file);
}

function isPrivate(file) {
  return (privateName.test(file) && !isExample(file)) || privateExtension.test(file);
}

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name.toLowerCase())) continue;
    const file = path.join(directory, entry.name);
    const relative = path.relative(root, file).split(path.sep).join('/');
    if (entry.isDirectory()) files.push(...walk(file));
    else if (!isPrivate(relative)) files.push(relative);
  }
  return files;
}

let files;
try {
  const gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  if (fs.realpathSync(gitRoot) === fs.realpathSync(root)) {
    files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  }
} catch {}
files ??= walk(root);
files = [...new Set(files)];

const patterns = [
  ['provider credential', /(?:AIza[\w-]{25,}|sk-(?:proj-)?[\w-]{20,}|hf_[\w]{20,}|gh[pousr]_[\w]{20,}|glpat-[\w-]{12,}|rzp_(?:test|live)_[\w]{8,}|AKIA[0-9A-Z]{16})/],
  ['JWT token literal', /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ['private key material', /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/],
  ['credential in URL', /[a-z]+:\/\/[^\s:@/]+:[^\s@/]+@/],
  ['literal SQL password', /;\s*(?:Password|Pwd)\s*=\s*(?!\$\{)[^;\s"'}]+/i],
  ['personal machine path', /(?:C:\\\\?Users\\\\?[^\\\s"']+|OneDrive\s*-\s*ENDAVA|ENDAVA\\\\?kbala)/i],
];

function checkConfig(value, keys, file) {
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    const current = [...keys, key];
    if (entry && typeof entry === 'object') checkConfig(entry, current, file);
    else if (typeof entry === 'string' && entry.trim()) {
      const secretField = /^(?:ApiKey|AccessKey|Secret|ClientSecret|Password|SigningKey|PrivateKey|Token)$/i.test(key)
        || /^(?:Jwt|Razorpay):Key$/i.test(current.join(':'));
      if (secretField) findings.push({ file, category: 'nonempty credential setting', field: current.join(':') });
    }
  }
}

for (const file of files) {
  if (isPrivate(file) || file.split('/').some(part => excludedDirectories.has(part.toLowerCase()))) {
    findings.push({ file, category: 'private or generated file included in Git candidates' });
    continue;
  }
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
  if (!textExtensions.test(file) && path.basename(file) !== 'Dockerfile' && !file.endsWith('.gitignore')) continue;
  const text = fs.readFileSync(absolute, 'utf8');
  text.split(/\r?\n/).forEach((line, index) => {
    for (const [category, expression] of patterns) {
      if (expression.test(line)) findings.push({ file, line: index + 1, category });
    }
  });
  if (/appsettings.*\.json$/i.test(file)) {
    try { checkConfig(JSON.parse(text.replace(/^\uFEFF/, '')), [], file); }
    catch { findings.push({ file, category: 'invalid configuration JSON' }); }
  }
}

if (findings.length) {
  console.error('Secret check failed. Values are deliberately omitted:');
  for (const finding of findings) console.error(JSON.stringify(finding));
  process.exitCode = 1;
} else {
  console.log(`Secret check passed for ${files.length} source files. No configured credentials, known token formats, private keys, or personal machine paths detected.`);
}
