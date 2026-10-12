import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {exportPublicRepository,verifyPublicCandidate} from './export-public-lib.mjs';

// Private CI checks a mechanically generated public candidate. It does not
// waive private-history secret review or claim to inspect destination history.
const root=path.resolve(import.meta.dirname,'..');
const temporary=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-ci-public-export-')));
try{
  const config=JSON.parse(fs.readFileSync(path.join(root,'publication/public-export.json')));
  exportPublicRepository({sourceRoot:root,targetRoot:temporary,config});
  verifyPublicCandidate(root,temporary);
  const result=spawnSync(process.execPath,[path.join(temporary,'scripts/verify-public-content.mjs'),'--no-history'],{cwd:temporary,encoding:'utf8',timeout:60000});
  if(result.status!==0)throw Error('exported public content failed verification');
  console.log('Private CI public-export verification passed; private and destination history audits remain separate.');
}finally{
  fs.rmSync(temporary,{recursive:true,force:true});
}
