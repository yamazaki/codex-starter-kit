export function validGradingCorrection(record,entry,count){
  const original=record.attempts?.find(a=>a.session===entry.session&&a.verdict==='FAIL');
  if((record.remediations??[]).some(e=>e.failedSession===entry.session))return false;
  return Boolean(original&&entry.kind==='COLLECTOR_OMISSION'&&entry.reviewer&&entry.sourceReview==='CONFIRMED'&&entry.reason&&Array.isArray(entry.evidence)&&entry.evidence.length&&entry.evidence.every(e=>typeof e==='string'&&e.trim())&&entry.proof?.verified===true&&entry.proof.session===entry.session&&entry.proof.callId&&/^[0-9a-f]{64}$/.test(entry.proof.inputSha256??'')&&/^[0-9a-f]{64}$/.test(entry.proof.outputSha256??'')&&original.criteria?.length===count&&original.criteria[3]==='FAIL'&&original.criteria.every((v,i)=>i===3||v==='PASS')&&entry.correctedCriteria?.length===count&&entry.correctedCriteria.every(v=>v==='PASS'));
}

export function correctedAttempts(record,count){
  const entries=record.gradingCorrections??[],valid=entries.filter(e=>validGradingCorrection(record,e,count));
  const corrections=new Map(valid.map(e=>[e.session,e]));
  return {invalid:valid.length!==entries.length||corrections.size!==valid.length,corrected:new Set(corrections.keys()),attempts:(record.attempts??[]).map(a=>{
    const e=corrections.get(a.session);return e?{...a,verdict:'PASS',criteria:e.correctedCriteria,reviewer:e.reviewer,evidence:[...a.evidence,...e.evidence],gradingCorrection:true}:a;
  })};
}
