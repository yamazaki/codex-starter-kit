import fs from 'node:fs';import path from 'node:path';
export function historical05File(root,relative){const p=path.join(root,'porting/baselines/0.78.1-codex.5',relative);return fs.existsSync(p)?p:path.join(root,relative);}
