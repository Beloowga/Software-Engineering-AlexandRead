import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const lintTargets = ['server.js', 'db.js'];
const directories = ['controllers', 'routes', 'middleware'];

for (const dir of directories) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    continue;
  }

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.js')) {
      lintTargets.push(join(dir, entry.name));
    }
  }
}

let hasFailures = false;

for (const target of lintTargets) {
  try {
    execFileSync(process.execPath, ['--check', target], { stdio: 'inherit' });
  } catch (err) {
    hasFailures = true;
  }
}

if (hasFailures) {
  console.error('Lint failed: syntax errors detected.');
  process.exit(1);
} else {
  console.log('Lint passed: syntax looks good.');
}
