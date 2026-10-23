import { useState, useMemo } from 'react';
import { Card, Heading, Notice } from './UI.jsx';
import { diffWorkspaces, buildMergedWorkspace, isRecordEqual } from '../lib/merge.js';

export function ConflictResolver({
  localWorkspace,
  remoteWorkspace,
  remoteRevision = null,
  sourceName = 'Cloudflare D1',
  onApplyMerge,
  onCancel
}) {
  const diff = useMemo(() => diffWorkspaces(localWorkspace, remoteWorkspace), [localWorkspace, remoteWorkspace]);

  // Selections state: { [type]: { [id]: 'local' | 'remote' | 'omit' } }
  const [selections, setSelections] = useState(() => {
    const init = { projects: {}, evidence: {}, readings: {} };
    for (const type of ['projects', 'evidence', 'readings']) {
      // Local-only default to included
      for (const entry of diff[type].localOnly) {
        init[type][entry.id] = 'local';
      }
      // Remote-only default to included
      for (const entry of diff[type].remoteOnly) {
        init[type][entry.id] = 'remote';
      }
      // Conflicts default to 'local'
      for (const entry of diff[type].conflict) {
        init[type][entry.id] = 'local';
      }
    }
    return init;
  });

  const [checksResolution, setChecksResolution] = useState('union');
  const [activeTab, setActiveTab] = useState('all');

  // Compute preview of merged result
  const preview = useMemo(() => {
    try {
      const merged = buildMergedWorkspace({
        local: localWorkspace,
        remote: remoteWorkspace,
        selections,
        checksResolution
      });
      return { success: true, data: merged, error: null };
    } catch (e) {
      return { success: false, data: null, error: e.message };
    }
  }, [localWorkspace, remoteWorkspace, selections, checksResolution]);

  function setItemChoice(type, id, choice) {
    setSelections(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [id]: choice
      }
    }));
  }

  function handleSelectAll(choice) {
    setSelections(prev => {
      const next = { projects: {}, evidence: {}, readings: {} };
      for (const type of ['projects', 'evidence', 'readings']) {
        for (const entry of diff[type].localOnly) {
          next[type][entry.id] = choice === 'remote' ? 'omit' : 'local';
        }
        for (const entry of diff[type].remoteOnly) {
          next[type][entry.id] = choice === 'local' ? 'omit' : 'remote';
        }
        for (const entry of diff[type].conflict) {
          next[type][entry.id] = choice;
        }
      }
      return next;
    });
  }

  function handleAutoMerge() {
    setSelections(() => {
      const next = { projects: {}, evidence: {}, readings: {} };
      for (const type of ['projects', 'evidence', 'readings']) {
        for (const entry of diff[type].localOnly) next[type][entry.id] = 'local';
        for (const entry of diff[type].remoteOnly) next[type][entry.id] = 'remote';
        for (const entry of diff[type].conflict) next[type][entry.id] = 'local'; // keep local on conflict
      }
      return next;
    });
    setChecksResolution('union');
  }

  const totalConflicts = diff.projects.conflict.length + diff.evidence.conflict.length + diff.readings.conflict.length;
  const totalLocalOnly = diff.projects.localOnly.length + diff.evidence.localOnly.length + diff.readings.localOnly.length;
  const totalRemoteOnly = diff.projects.remoteOnly.length + diff.evidence.remoteOnly.length + diff.readings.remoteOnly.length;
  const totalIdentical = diff.projects.identical.length + diff.evidence.identical.length + diff.readings.identical.length;

  return (
    <div className="conflict-resolver">
      <Heading
        tag="DATA RECONCILIATION"
        title="เปรียบเทียบและผสานข้อมูล (Merge & Conflict Resolver)"
        action={
          <div className="actions">
            <button type="button" className="btn light" onClick={onCancel}>
              ✕ ยกเลิก
            </button>
          </div>
        }
      >
        จัดการความแตกต่างระหว่างข้อมูลในเครื่อง (Local) กับ {sourceName} โดยไม่ทับข้อมูลทิ้งอย่างเงียบงัน
      </Heading>

      {/* Summary Status Badges */}
      <div className="stats">
        <div className="stat">
          รายการตรงกัน
          <b>{totalIdentical}</b>
          <small>รวมให้อัตโนมัติ</small>
        </div>
        <div className="stat">
          ใหม่เฉพาะในเครื่อง
          <b>{totalLocalOnly}</b>
          <small>Local only</small>
        </div>
        <div className="stat">
          ใหม่เฉพาะในเป้าหมาย
          <b>{totalRemoteOnly}</b>
          <small>{sourceName}</small>
        </div>
        <div className="stat" style={{ borderColor: totalConflicts > 0 ? 'var(--gold)' : 'var(--line)' }}>
          ข้อขัดแย้ง (แก้ไขทั้งคู่)
          <b style={{ color: totalConflicts > 0 ? '#b35d25' : 'inherit' }}>{totalConflicts}</b>
          <small>{totalConflicts > 0 ? 'ต้องเลือกเวอร์ชัน' : 'ไม่มีข้อขัดแย้ง'}</small>
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <Card>
        <div className="sectionline">
          <div>
            <h3>ตัวช่วยเลือกอัตโนมัติ</h3>
            <p style={{ margin: 0 }}>เลือกแนวทางผสานข้อมูลตามความต้องการ</p>
          </div>
          <div className="actions">
            <button type="button" className="btn light" onClick={handleAutoMerge}>
              ⚡ รวมข้อมูลใหม่ทั้งหมด (เก็บข้อมูลในเครื่องเมื่อขัดแย้ง)
            </button>
            <button type="button" className="btn light" onClick={() => handleSelectAll('local')}>
              เลือกข้อมูลในเครื่องทั้งหมด
            </button>
            <button type="button" className="btn light" onClick={() => handleSelectAll('remote')}>
              เลือกข้อมูลจาก {sourceName} ทั้งหมด
            </button>
          </div>
        </div>
      </Card>

      {/* Tab Filter */}
      <div className="filters" style={{ marginTop: 20 }}>
        {[
          ['all', 'แสดงทั้งหมด'],
          ['projects', `โครงการ (${diff.projects.conflict.length + diff.projects.localOnly.length + diff.projects.remoteOnly.length})`],
          ['evidence', `หลักฐาน (${diff.evidence.conflict.length + diff.evidence.localOnly.length + diff.evidence.remoteOnly.length})`],
          ['readings', `บันทึกการอ่าน (${diff.readings.conflict.length + diff.readings.localOnly.length + diff.readings.remoteOnly.length})`],
          ['checks', 'รายการตรวจคุณภาพ']
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={activeTab === k ? 'active' : ''}
            onClick={() => setActiveTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sections */}
      {(activeTab === 'all' || activeTab === 'projects') && (
        <SectionDiff
          title="แผนงานวิจัย (Projects)"
          type="projects"
          diffGroup={diff.projects}
          selections={selections.projects}
          onChoice={(id, choice) => setItemChoice('projects', id, choice)}
          sourceName={sourceName}
          renderDetails={p => (
            <>
              <strong>{p.title}</strong>
              <small>{p.method} · {p.weeks} สัปดาห์</small>
              <p style={{ fontSize: 12, margin: '4px 0 0' }}>คำถาม: {p.question}</p>
            </>
          )}
        />
      )}

      {(activeTab === 'all' || activeTab === 'evidence') && (
        <SectionDiff
          title="บัญชีกฎหมายและหลักฐาน (Evidence)"
          type="evidence"
          diffGroup={diff.evidence}
          selections={selections.evidence}
          onChoice={(id, choice) => setItemChoice('evidence', id, choice)}
          sourceName={sourceName}
          renderDetails={e => (
            <>
              <strong>{e.name}</strong>
              <small>{e.type} · {e.version} · {e.section}</small>
              <p style={{ fontSize: 12, margin: '4px 0 0' }}>ภารกิจ/ข้อค้นพบ: {e.work} {e.finding}</p>
              <span className="tag" style={{ marginTop: 4 }}>{e.status}</span>
            </>
          )}
        />
      )}

      {(activeTab === 'all' || activeTab === 'readings') && (
        <SectionDiff
          title="บันทึกการอ่านและวิเคราะห์ (Critical Readings)"
          type="readings"
          diffGroup={diff.readings}
          selections={selections.readings}
          onChoice={(id, choice) => setItemChoice('readings', id, choice)}
          sourceName={sourceName}
          renderDetails={r => (
            <>
              <strong>{r.citation}</strong>
              <p style={{ fontSize: 12, margin: '4px 0 0' }}>ปัญหา: {r.problem}</p>
              <p style={{ fontSize: 12, margin: '4px 0 0' }}>วิธีวิจัย: {r.method}</p>
            </>
          )}
        />
      )}

      {(activeTab === 'all' || activeTab === 'checks') && (
        <Card>
          <h2>รายการตรวจคุณภาพ (Quality Checklist)</h2>
          <p>
            ในเครื่องตรวจแล้ว {diff.checks.local.length}/12 · ใน {sourceName} ตรวจแล้ว {diff.checks.remote.length}/12
          </p>
          <div style={{ display: 'flex', gap: 15, margin: '15px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
              <input
                type="radio"
                name="checksResolution"
                checked={checksResolution === 'union'}
                onChange={() => setChecksResolution('union')}
              />
              <span>รวมทุกข้อที่ตรวจแล้ว (Union: {diff.checks.union.length}/12) — แนะนำ</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
              <input
                type="radio"
                name="checksResolution"
                checked={checksResolution === 'local'}
                onChange={() => setChecksResolution('local')}
              />
              <span>ใช้เฉพาะข้อที่ตรวจในเครื่อง ({diff.checks.local.length}/12)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
              <input
                type="radio"
                name="checksResolution"
                checked={checksResolution === 'remote'}
                onChange={() => setChecksResolution('remote')}
              />
              <span>ใช้เฉพาะข้อที่ตรวจใน {sourceName} ({diff.checks.remote.length}/12)</span>
            </label>
          </div>
        </Card>
      )}

      {/* Footer Preview & Apply Actions */}
      <Card style={{ marginTop: 25, border: '2px solid var(--green)' }}>
        <div className="sectionline">
          <div>
            <h2>สรุปผลการผสานข้อมูล</h2>
            {preview.success ? (
              <p style={{ color: 'var(--green)', margin: 0 }}>
                ✓ พร้อมบันทึก: {preview.data.projects.length} โครงการ · {preview.data.evidence.length} หลักฐาน ·{' '}
                {preview.data.readings.length} บันทึกการอ่าน · {preview.data.checks.length} รายการตรวจ
              </p>
            ) : (
              <p style={{ color: '#b35d25', margin: 0 }}>
                ⚠️ ไม่สามารถบันทึกได้: {preview.error}
              </p>
            )}
          </div>
          <div className="actions">
            <button type="button" className="btn light" onClick={onCancel}>
              ยกเลิก
            </button>
            <button
              type="button"
              className="btn light"
              disabled={!preview.success}
              onClick={() => onApplyMerge(preview.data, false, remoteRevision)}
            >
              บันทึกลงในเครื่องเท่านั้น
            </button>
            {remoteRevision !== null && (
              <button
                type="button"
                className="btn"
                disabled={!preview.success}
                onClick={() => onApplyMerge(preview.data, true, remoteRevision)}
              >
                บันทึกและอัปโหลดขึ้นคลาวด์ทันที (Revision {remoteRevision})
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function SectionDiff({ title, type, diffGroup, selections, onChoice, sourceName, renderDetails }) {
  const { conflict, localOnly, remoteOnly, identical } = diffGroup;
  const count = conflict.length + localOnly.length + remoteOnly.length;

  if (count === 0 && identical.length === 0) {
    return (
      <Card style={{ marginBottom: 20 }}>
        <h2>{title}</h2>
        <div className="empty">ไม่มีข้อมูลในหมวดนี้</div>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 20 }}>
      <div className="sectionline">
        <h2>{title}</h2>
        <small style={{ color: 'var(--muted)' }}>
          ขัดแย้ง: {conflict.length} · เฉพาะในเครื่อง: {localOnly.length} · เฉพาะใน {sourceName}: {remoteOnly.length} · ตรงกัน: {identical.length}
        </small>
      </div>

      {identical.length > 0 && (
        <Notice>
          ✓ มี {identical.length} รายการที่ข้อมูลตรงกันทุกช่อง ระบบจะรวมเข้าผลลัพธ์โดยอัตโนมัติ
        </Notice>
      )}

      {/* Conflict Items (Side by Side) */}
      {conflict.map(({ id, local, remote }) => {
        const choice = selections[id] || 'local';
        return (
          <div key={id} className="diff-conflict-card">
            <div className="diff-conflict-header">
              <span className="badge" style={{ borderColor: 'var(--gold)', color: '#976f25' }}>
                ⚠️ ข้อขัดแย้ง (แก้ไขทั้งคู่)
              </span>
              <span className="small">ID: {id}</span>
            </div>
            <div className="diff-grid">
              {/* Local Column */}
              <div
                className={`diff-pane ${choice === 'local' ? 'selected' : ''}`}
                onClick={() => onChoice(id, 'local')}
              >
                <div className="diff-pane-title">
                  <input
                    type="radio"
                    name={`choice-${type}-${id}`}
                    checked={choice === 'local'}
                    onChange={() => onChoice(id, 'local')}
                  />
                  <span>ข้อมูลในเครื่อง (Local)</span>
                </div>
                <div className="diff-pane-body">{renderDetails(local)}</div>
              </div>

              {/* Remote Column */}
              <div
                className={`diff-pane ${choice === 'remote' ? 'selected' : ''}`}
                onClick={() => onChoice(id, 'remote')}
              >
                <div className="diff-pane-title">
                  <input
                    type="radio"
                    name={`choice-${type}-${id}`}
                    checked={choice === 'remote'}
                    onChange={() => onChoice(id, 'remote')}
                  />
                  <span>ข้อมูลจาก {sourceName}</span>
                </div>
                <div className="diff-pane-body">{renderDetails(remote)}</div>
              </div>
            </div>
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <button
                type="button"
                className="linkbtn delete"
                style={{ fontSize: 11 }}
                onClick={() => onChoice(id, 'omit')}
              >
                {choice === 'omit' ? '✓ ข้ามรายการนี้แล้ว' : '✕ ไม่รวมรายการนี้ (ข้าม)'}
              </button>
            </div>
          </div>
        );
      })}

      {/* Local Only Items */}
      {localOnly.map(({ id, item }) => {
        const isIncluded = selections[id] !== 'omit' && selections[id] !== false;
        return (
          <div key={id} className="diff-single-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <input
                type="checkbox"
                id={`local-${type}-${id}`}
                checked={isIncluded}
                onChange={e => onChoice(id, e.target.checked ? 'local' : 'omit')}
                style={{ marginTop: 4 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label htmlFor={`local-${type}-${id}`} style={{ margin: 0, cursor: 'pointer' }}>
                    <span className="tag" style={{ background: '#eaf4ee', color: 'var(--green)' }}>
                      มีเฉพาะในเครื่อง (Local only)
                    </span>
                  </label>
                  <small className="small">ID: {id}</small>
                </div>
                <div style={{ marginTop: 6 }}>{renderDetails(item)}</div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Remote Only Items */}
      {remoteOnly.map(({ id, item }) => {
        const isIncluded = selections[id] !== 'omit' && selections[id] !== false;
        return (
          <div key={id} className="diff-single-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <input
                type="checkbox"
                id={`remote-${type}-${id}`}
                checked={isIncluded}
                onChange={e => onChoice(id, e.target.checked ? 'remote' : 'omit')}
                style={{ marginTop: 4 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label htmlFor={`remote-${type}-${id}`} style={{ margin: 0, cursor: 'pointer' }}>
                    <span className="tag" style={{ background: '#e8edf5', color: '#2b5282' }}>
                      มีเฉพาะใน {sourceName}
                    </span>
                  </label>
                  <small className="small">ID: {id}</small>
                </div>
                <div style={{ marginTop: 6 }}>{renderDetails(item)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
