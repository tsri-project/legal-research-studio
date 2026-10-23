async function request(method,body){const r=await fetch('/api/workspace',{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});let data;try{data=await r.json()}catch{throw Error('ไม่พบ API หรือยังไม่ได้เข้าสู่ Cloudflare Access เปิดผ่าน URL ของ Worker แล้วเข้าสู่ระบบ')};if(!r.ok)throw Error(data.error||`API ${r.status}`);return data;}
export const pullWorkspace=()=>request('GET');
export const pushWorkspace=(workspace,revision)=>request('PUT',{workspace,revision});
