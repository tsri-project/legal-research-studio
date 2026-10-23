export const STORAGE_KEY='legal-research-react-v2';
export const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
export const emptyWorkspace=()=>({schemaVersion:2,projects:[],evidence:[],readings:[],checks:[]});
const str=(v,max=30000)=>typeof v==='string'&&v.length<=max;
export function validateWorkspace(d){
 if(!d||d.schemaVersion!==2||!['projects','evidence','readings','checks'].every(k=>Array.isArray(d[k])))throw Error('รูปแบบไฟล์ไม่ถูกต้อง ต้องเป็นข้อมูลรุ่น 2');
 for(const type of ['projects','evidence','readings']){
  if(d[type].length>1000)throw Error('ข้อมูลเกินขีดจำกัด 1,000 รายการต่อประเภท');
  const ids=new Set();
  for(const row of d[type]){
   if(!row||typeof row!=='object'||!str(row.id,100)||!/^[a-zA-Z0-9_-]+$/.test(row.id)||ids.has(row.id))throw Error('รหัสรายการไม่ถูกต้องหรือซ้ำ');
   ids.add(row.id);
   if(Object.values(row).some(v=>!str(v)))throw Error('ทุกช่องข้อมูลต้องเป็นข้อความไม่เกิน 30,000 อักขระ');
   if(type==='projects'&&(!row.title?.trim()||!row.question?.trim()||!row.method))throw Error('ชื่อและคำถามวิจัยต้องไม่ว่าง');
   if(type==='projects'&&(!Number.isInteger(Number(row.weeks))||+row.weeks<6||+row.weeks>104))throw Error('ระยะเวลาต้องอยู่ระหว่าง 6–104 สัปดาห์');
   if(type==='evidence'&&!row.name?.trim())throw Error('ชื่อหลักฐานต้องไม่ว่าง');
   if(type==='readings'&&!row.citation?.trim())throw Error('ชื่อบทความต้องไม่ว่าง');
   if(row.url&&!isHttpUrl(row.url))throw Error('URL ต้องขึ้นต้นด้วย http:// หรือ https://');
  }
 }
 if(d.checks.some(x=>!Number.isInteger(x)||x<0||x>=12)||new Set(d.checks).size!==d.checks.length)throw Error('รายการตรวจคุณภาพไม่ถูกต้อง');
 const projects=new Set(d.projects.map(p=>p.id));
 if([...d.evidence,...d.readings].some(r=>r.projectId&&!projects.has(r.projectId)))throw Error('มีข้อมูลที่เชื่อมกับโครงการที่ไม่พบ');
 if(new TextEncoder().encode(JSON.stringify(d)).length>800000)throw Error('ข้อมูลเกิน 800 KB กรุณาแยกพื้นที่ทำงาน');
 return {schemaVersion:2,projects:d.projects,evidence:d.evidence,readings:d.readings,checks:d.checks};
}
export function isHttpUrl(url){try{return ['https:','http:'].includes(new URL(url).protocol)}catch{return false}}
export function saveWorkspace(storage,data){const d=validateWorkspace(data);storage.setItem(STORAGE_KEY,JSON.stringify(d));return d;}
export function loadWorkspace(storage){const raw=storage.getItem(STORAGE_KEY);return raw?validateWorkspace(JSON.parse(raw)):emptyWorkspace();}
export function csvCell(v){let s=String(v??'');if(/^[\s]*[=+@-]/.test(s)||/^[\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function evidenceCsv(rows){return '\ufeff'+[['เอกสาร','ประเภท','ฉบับ','มาตรา/หน้า','URL','ภารกิจ','ข้อค้นพบ','สถานะ'],...rows.map(e=>['name','type','version','section','url','work','finding','status'].map(k=>e[k]))].map(r=>r.map(csvCell).join(',')).join('\r\n');}
export function timeline(weeks){return Array.from({length:6},(_,i)=>({start:Math.floor(i*weeks/6)+1,end:Math.floor((i+1)*weeks/6)}));}
export function download(name,content,type='text/plain;charset=utf-8'){const a=document.createElement('a');const url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function deleteProject(d,id){return {...d,projects:d.projects.filter(p=>p.id!==id),evidence:d.evidence.map(e=>e.projectId===id?{...e,projectId:''}:e),readings:d.readings.map(e=>e.projectId===id?{...e,projectId:''}:e)};}
