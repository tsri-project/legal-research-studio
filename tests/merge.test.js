import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyWorkspace, validateWorkspace } from '../src/lib/model.js';
import { isRecordEqual, diffWorkspaces, buildMergedWorkspace } from '../src/lib/merge.js';

test('isRecordEqual compares simple objects properly', () => {
  assert.equal(isRecordEqual({ a: '1', b: '2' }, { b: '2', a: '1' }), true);
  assert.equal(isRecordEqual({ a: '1', b: '2' }, { a: '1', b: '3' }), false);
  assert.equal(isRecordEqual({ a: '1' }, { a: '1', b: '2' }), false);
});

test('diffWorkspaces identifies localOnly, remoteOnly, identical, and conflict', () => {
  const p1 = { id: 'p1', title: 'โครงการ 1', question: 'คำถาม 1', method: 'Doctrinal Legal Research', weeks: '12' };
  const p2Local = { id: 'p2', title: 'โครงการ 2 ในเครื่อง', question: 'คำถาม 2', method: 'Comparative Legal Research', weeks: '24' };
  const p2Remote = { id: 'p2', title: 'โครงการ 2 บนคลาวด์', question: 'คำถาม 2', method: 'Comparative Legal Research', weeks: '24' };
  const p3Remote = { id: 'p3', title: 'โครงการ 3 บนคลาวด์เท่านั้น', question: 'คำถาม 3', method: 'Socio-legal Research', weeks: '12' };

  const local = { ...emptyWorkspace(), projects: [p1, p2Local], checks: [0, 1] };
  const remote = { ...emptyWorkspace(), projects: [p1, p2Remote, p3Remote], checks: [1, 2] };

  const diff = diffWorkspaces(local, remote);

  assert.equal(diff.hasConflict, true);
  assert.equal(diff.hasDifferences, true);
  assert.equal(diff.projects.identical.length, 1);
  assert.equal(diff.projects.identical[0].id, 'p1');
  assert.equal(diff.projects.conflict.length, 1);
  assert.equal(diff.projects.conflict[0].id, 'p2');
  assert.equal(diff.projects.localOnly.length, 0);
  assert.equal(diff.projects.remoteOnly.length, 1);
  assert.equal(diff.projects.remoteOnly[0].id, 'p3');
  assert.deepEqual(diff.checks.union, [0, 1, 2]);
});

test('buildMergedWorkspace merges with custom selections and unlinks missing projects', () => {
  const p1 = { id: 'p1', title: 'โครงการ 1', question: 'คำถาม 1', method: 'Doctrinal Legal Research', weeks: '12' };
  const p2Local = { id: 'p2', title: 'โครงการ 2 ในเครื่อง', question: 'คำถาม 2', method: 'Comparative Legal Research', weeks: '24' };
  const p2Remote = { id: 'p2', title: 'โครงการ 2 บนคลาวด์', question: 'คำถาม 2', method: 'Comparative Legal Research', weeks: '24' };
  const p3Remote = { id: 'p3', title: 'โครงการ 3', question: 'คำถาม 3', method: 'Socio-legal Research', weeks: '12' };

  // e1 links to p3Remote
  const e1 = { id: 'e1', name: 'หลักฐาน 1', type: 'กฎหมายแม่บท', version: '2540', section: 'ม. 9', url: '', work: '', finding: '', status: 'รอตรวจต้นทาง', projectId: 'p3' };

  const local = { ...emptyWorkspace(), projects: [p1, p2Local], checks: [0] };
  const remote = { ...emptyWorkspace(), projects: [p1, p2Remote, p3Remote], evidence: [e1], checks: [2] };

  // Selection: Pick remote version for p2 conflict, omit p3 project, but include e1 evidence
  const selections = {
    projects: {
      p2: 'remote',
      p3: 'omit' // omit project p3
    },
    evidence: {
      e1: 'remote'
    }
  };

  const merged = buildMergedWorkspace({ local, remote, selections, checksResolution: 'union' });

  assert.doesNotThrow(() => validateWorkspace(merged));
  assert.equal(merged.projects.length, 2);
  const p2 = merged.projects.find(p => p.id === 'p2');
  assert.equal(p2.title, 'โครงการ 2 บนคลาวด์');
  assert.equal(merged.projects.some(p => p.id === 'p3'), false);

  // Evidence e1 had projectId 'p3', which was omitted, so its projectId must be unassigned to ''
  assert.equal(merged.evidence.length, 1);
  assert.equal(merged.evidence[0].id, 'e1');
  assert.equal(merged.evidence[0].projectId, '');

  // Checks should be union [0, 2]
  assert.deepEqual(merged.checks, [0, 2]);
});
