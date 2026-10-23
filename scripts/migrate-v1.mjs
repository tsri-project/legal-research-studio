import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {validateWorkspace} from '../src/lib/model.js';
const [input,output]=process.argv.slice(2);
if(!input||!output||input===output){console.error('Usage: node scripts/migrate-v1.mjs old.json new-v2.json (use different files)');process.exit(1)}
const old=JSON.parse(await readFile(input,'utf8'));const textRows=(rows=[])=>rows.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,String(v??'')])));
const projects=textRows(old.projects).map(p=>({...p,id:p.id||randomUUID(),weeks:p.weeks||'12'}));
const evidence=textRows(old.evidence).map(e=>({...e,id:e.id||randomUUID(),projectId:''}));
const readings=old.reader?.citation?[{...Object.fromEntries(Object.entries(old.reader).map(([k,v])=>[k,String(v??'')])),id:randomUUID(),projectId:''}]:[];
const converted=validateWorkspace({schemaVersion:2,projects,evidence,readings,checks:[...new Set(old.checks||[])]});
await writeFile(output,JSON.stringify(converted,null,2),{flag:'wx'});console.log('Created v2 backup. Original file unchanged.');
