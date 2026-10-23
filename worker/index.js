import {createRemoteJWKSet,jwtVerify} from 'jose';
import {validateWorkspace,emptyWorkspace} from '../src/lib/model.js';
const jwksCache=new Map();
export function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}})}
export async function authenticate(request,env){
 const url=new URL(request.url);
 // Local testing only. Production wrangler.jsonc leaves LOCAL_DEV_USER unset.
 if(env.LOCAL_DEV_USER&&['127.0.0.1','localhost','[::1]'].includes(url.hostname))return {sub:'local-developer',email:env.LOCAL_DEV_USER};
 if(!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD)throw Object.assign(Error('ยังไม่ได้ตั้งค่า Cloudflare Access'),{status:503});
 const issuer='https://'+env.ACCESS_TEAM_DOMAIN;
 if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN))throw Object.assign(Error('Access team domain ไม่ถูกต้อง'),{status:503});
 const token=request.headers.get('Cf-Access-Jwt-Assertion');
 if(!token)throw Object.assign(Error('กรุณาเข้าสู่ระบบผ่าน Cloudflare Access'),{status:401});
 if(!jwksCache.has(issuer))jwksCache.set(issuer,createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs')));
 try{const {payload}=await jwtVerify(token,jwksCache.get(issuer),{issuer,audience:env.ACCESS_AUD,algorithms:['RS256'],requiredClaims:['sub','exp','iat']});if(typeof payload.sub!=='string'||!payload.sub)throw Error();return {sub:payload.sub,email:typeof payload.email==='string'?payload.email:payload.sub};}catch{throw Object.assign(Error('เซสชันไม่ถูกต้องหรือหมดอายุ'),{status:401})}
}
async function readJson(request){if(!request.headers.get('content-type')?.startsWith('application/json'))throw Object.assign(Error('ต้องส่ง application/json'),{status:415});const reader=request.body?.getReader();if(!reader)throw Object.assign(Error('ไม่มีข้อมูล'),{status:400});let size=0;const chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>900000){await reader.cancel();throw Object.assign(Error('ข้อมูลเกินขีดจำกัด'),{status:413})}chunks.push(value)}const bytes=new Uint8Array(size);let off=0;for(const c of chunks){bytes.set(c,off);off+=c.length}try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw Object.assign(Error('JSON ไม่ถูกต้อง'),{status:400})}}
export async function handleApi(request,env,authenticateUser=authenticate){
 try{
 const path=new URL(request.url).pathname;if(path!=='/api/workspace')return json({error:'ไม่พบ API'},404);
 if(!['GET','PUT'].includes(request.method))return json({error:'Method not allowed'},405);
 if(request.method==='PUT'&&request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Origin ไม่ถูกต้อง'},403);
 const user=await authenticateUser(request,env);
 if(!env.DB)return json({error:'ยังไม่ได้ผูกฐานข้อมูล D1'},503);
 if(request.method==='GET'){const row=await env.DB.prepare('SELECT body, revision FROM workspaces WHERE owner_id = ?').bind(user.sub).first();return json({workspace:row?JSON.parse(row.body):emptyWorkspace(),revision:row?.revision||0,owner:user.email})}
 const input=await readJson(request);let workspace;try{workspace=validateWorkspace(input.workspace)}catch(e){return json({error:e.message},400)}
 if(!Number.isInteger(input.revision)||input.revision<0)return json({error:'Revision ไม่ถูกต้อง'},400);
 const body=JSON.stringify(workspace),now=new Date().toISOString();
 const result=input.revision===0?await env.DB.prepare('INSERT INTO workspaces (owner_id, body, revision, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(owner_id) DO NOTHING').bind(user.sub,body,now).run():await env.DB.prepare('UPDATE workspaces SET body = ?, revision = revision + 1, updated_at = ? WHERE owner_id = ? AND revision = ?').bind(body,now,user.sub,input.revision).run();
 if(result.meta.changes!==1)return json({error:'Revision conflict: มีข้อมูลใหม่บนคลาวด์ สำรองข้อมูลในเครื่อง แล้วดาวน์โหลดล่าสุดก่อนรวมข้อมูล'},409);
 return json({revision:input.revision+1,owner:user.email});
 }catch(e){return json({error:e.status?e.message:'ระบบขัดข้อง กรุณาตรวจ D1 migrations และ Worker logs (อย่าบันทึกเนื้อหาหรือ token)'},e.status||500)}
}
export default {async fetch(request,env){if(new URL(request.url).pathname.startsWith('/api/'))return handleApi(request,env);const response=await env.ASSETS.fetch(request);const headers=new Headers(response.headers);headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','strict-origin-when-cross-origin');headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");return new Response(response.body,{status:response.status,headers});}};
