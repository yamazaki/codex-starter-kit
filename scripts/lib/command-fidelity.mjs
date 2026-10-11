// A structural guard only; behavioral/source review is still required.
export function missingCommandSections(entry, text){
  if(entry.disposition!=='ADAPT'||!entry.verifyRequiredSections)return [];
  return (entry.requiredSections??[]).filter(section=>!text.includes(`## ${section}\n`));
}
