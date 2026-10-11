import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';

const text = fs.readFileSync(new URL('../distribution/files/common/agents/security-reviewer.toml', import.meta.url), 'utf8');

test('security reviewer preserves pinned upstream body and read-only role', () => {
  const body = text.split('developer_instructions = """\n')[1].split('\n## Codex integration constraints')[0].trimEnd() + '\n';
  assert.equal(crypto.createHash('sha256').update(body).digest('hex'), 'a5a18b91b56e9a308e210bb19f0b8ef56de1bb080f19ab2d27d7226829c41b70');
  assert.match(text, /^sandbox_mode = "read-only"$/m);
  assert.ok(text.includes('Do not edit files and do not claim an exhaustive scan.'));
});

test('authorization proposals require present validated identities and explicit missing-case verification', () => {
  for (const requirement of [
    'Reject missing or invalid authenticated identity and missing resource ownership information',
    'two absent values comparing equal must never grant access',
    'Do not treat caller-supplied identity as authenticated without evidence',
    'Preserve valid identifiers such as 0',
    'authorized owner, different user, missing user, missing owner, and both missing',
    'If execution is unavailable, label the proposal unverified',
  ]) assert.ok(text.includes(requirement), `Missing reviewed authorization requirement: ${requirement}`);
});
