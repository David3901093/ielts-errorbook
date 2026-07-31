/* api-push.js — upload files to GitHub via the Contents API (gh), since
   git-over-HTTPS (port 443) is blocked in this environment.
   Usage: node scripts/api-push.js <localPath> <repoPath>
   Reads existing blob sha (if any) so updates work. */
const fs = require('fs');
const { execFileSync } = require('child_process');

const [localPath, repoPath] = process.argv.slice(2);
if (!localPath || !repoPath) {
  console.error('Usage: node scripts/api-push.js <localPath> <repoPath>');
  process.exit(1);
}
const REPO = 'David3901093/ielts-errorbook';
const BRANCH = 'main';

const content = fs.readFileSync(localPath);
const b64 = content.toString('base64');
const message = `Update ${repoPath} (expand word bank to 5,243 words)`;

// 1) get current blob sha (if file exists) — needed for updates
let sha = null;
try {
  const out = execFileSync('gh', ['api', `repos/${REPO}/contents/${repoPath}?ref=${BRANCH}`, '--jq', '.sha'], { encoding: 'utf-8' });
  sha = out.trim() || null;
} catch (e) {
  // file does not exist yet → create (no sha)
}

// 2) build the JSON payload
const payload = {
  message,
  content: b64,
  branch: BRANCH
};
if (sha) payload.sha = sha;

const tmp = require('path').join(require('os').tmpdir(), 'ieb-upload-' + Date.now() + '.json');
fs.writeFileSync(tmp, JSON.stringify(payload));

// 3) PUT via gh api (with retry — network to GitHub is flaky here)
function putWithRetry(tmp, repoPath, attempts) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const out = execFileSync('gh', ['api', '-X', 'PUT', `repos/${REPO}/contents/${repoPath}`, '--input', tmp], { encoding: 'utf-8', timeout: 120000 });
      return JSON.parse(out);
    } catch (e) {
      const msg = e.stderr ? e.stderr.toString().slice(0, 200) : e.message;
      if (i === attempts) throw e;
      console.log(`  (retry ${i + 1}/${attempts} after: ${msg.slice(0, 80)})`);
      // re-fetch sha in case a partial earlier attempt landed
      try {
        const s = execFileSync('gh', ['api', `repos/${REPO}/contents/${repoPath}?ref=${BRANCH}`, '--jq', '.sha'], { encoding: 'utf-8' }).trim();
        if (s) { payload.sha = s; fs.writeFileSync(tmp, JSON.stringify(payload)); }
      } catch (_) {}
      // brief backoff
      execFileSync('node', ['-e', 'setTimeout(()=>{},3000)']);
    }
  }
}
try {
  const parsed = putWithRetry(tmp, repoPath, 6);
  console.log(`✓ ${repoPath}: ${sha ? 'updated' : 'created'} (${(content.length/1024).toFixed(0)} KB) commit ${parsed.commit.sha.slice(0,7)}`);
} catch (e) {
  console.error(`✗ ${repoPath} failed:`, e.stderr ? e.stderr.toString().slice(0,300) : e.message);
  process.exit(1);
} finally {
  fs.unlinkSync(tmp);
}
