import test from 'node:test';
import assert from 'node:assert/strict';
import {handleApi,authenticate} from '../worker/index.js';
import {emptyWorkspace} from '../src/lib/model.js';
import {diffWorkspaces,buildMergedWorkspace} from '../src/lib/merge.js';
const url='https://app.example/api/workspace';
const put=(revision=0,origin='https://app.example')=>new Request(url,{method:'PUT',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({workspace:emptyWorkspace(),revision})});
const auth=async()=>({sub:'user-a',email:'user-a@example.invalid'});
function fakeDb(changes=1){let bound=[];return {get bound(){return bound},prepare(sql){return {bind(...args){bound.push({sql,args});return {first:async()=>null,run:async()=>({meta:{changes}})}}}}}}
test('missing Access configuration fails closed',async()=>{const r=await handleApi(new Request(url),{DB:fakeDb()});assert.equal(r.status,503)});
test('spoofed identity headers do not bypass authentication',async()=>{await assert.rejects(()=>authenticate(new Request(url,{headers:{'Cf-Access-Authenticated-User-Email':'admin@example.com'}}),{ACCESS_TEAM_DOMAIN:'test.cloudflareaccess.com',ACCESS_AUD:'aud'}),e=>e.status===401)});
test('local auth bypass cannot run on production hostname',async()=>{await assert.rejects(()=>authenticate(new Request(url),{LOCAL_DEV_USER:'dev'}),e=>e.status===503)});
test('cross-origin write rejected before DB use',async()=>{assert.equal((await handleApi(put(0,'https://evil.invalid'),{},auth)).status,403)});
test('owner comes from verified identity, initial insert and stale update',async()=>{const db=fakeDb();const r=await handleApi(put(),{DB:db},auth);assert.equal(r.status,200);assert.equal(db.bound[0].args[0],'user-a');assert.equal((await r.json()).revision,1);assert.equal((await handleApi(put(1),{DB:fakeDb(0)},auth)).status,409)});
test('reconciliation workflow recovers from 409 conflict and pushes merged workspace', async () => {
  let stored = {
    body: JSON.stringify({
      schemaVersion: 2,
      projects: [{ id: 'p_remote', title: 'โครงการรีโมต', question: 'คำถาม', method: 'Doctrinal Legal Research', weeks: '12' }],
      evidence: [],
      readings: [],
      checks: [0]
    }),
    revision: 2
  };

  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            first: async () => stored,
            run: async () => {
              if (sql.includes('UPDATE')) {
                const [body, now, sub, expectedRev] = args;
                if (expectedRev === stored.revision) {
                  stored = { body, revision: stored.revision + 1 };
                  return { meta: { changes: 1 } };
                }
              }
              return { meta: { changes: 0 } };
            }
          };
        }
      };
    }
  };

  const localWorkspace = {
    schemaVersion: 2,
    projects: [{ id: 'p_local', title: 'โครงการในเครื่อง', question: 'คำถาม', method: 'Doctrinal Legal Research', weeks: '12' }],
    evidence: [],
    readings: [],
    checks: [1]
  };

  // Stale update returns 409
  const staleReq = new Request(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Origin: 'https://app.example' },
    body: JSON.stringify({ workspace: localWorkspace, revision: 1 })
  });
  const staleRes = await handleApi(staleReq, { DB: db }, auth);
  assert.equal(staleRes.status, 409);

  // Pull latest remote
  const getRes = await handleApi(new Request(url), { DB: db }, auth);
  assert.equal(getRes.status, 200);
  const { workspace: remoteWorkspace, revision: latestRev } = await getRes.json();
  assert.equal(latestRev, 2);

  // Diff and merge
  const diff = diffWorkspaces(localWorkspace, remoteWorkspace);
  assert.equal(diff.projects.localOnly.length, 1);
  assert.equal(diff.projects.remoteOnly.length, 1);
  const merged = buildMergedWorkspace({ local: localWorkspace, remote: remoteWorkspace });
  assert.equal(merged.projects.length, 2);

  // Push merged with latest revision -> 200 and revision increments to 3
  const pushMergedReq = new Request(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Origin: 'https://app.example' },
    body: JSON.stringify({ workspace: merged, revision: latestRev })
  });
  const pushMergedRes = await handleApi(pushMergedReq, { DB: db }, auth);
  assert.equal(pushMergedRes.status, 200);
  const pushData = await pushMergedRes.json();
  assert.equal(pushData.revision, 3);
  assert.equal(stored.revision, 3);
});
