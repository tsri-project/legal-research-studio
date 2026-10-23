import { validateWorkspace, emptyWorkspace } from './model.js';

export function isRecordEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a).filter(k => a[k] !== undefined);
  const keysB = Object.keys(b).filter(k => b[k] !== undefined);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export function diffWorkspaces(local = emptyWorkspace(), remote = emptyWorkspace()) {
  const result = {
    projects: { localOnly: [], remoteOnly: [], identical: [], conflict: [] },
    evidence: { localOnly: [], remoteOnly: [], identical: [], conflict: [] },
    readings: { localOnly: [], remoteOnly: [], identical: [], conflict: [] },
    checks: {
      local: [...(local.checks || [])].sort((a, b) => a - b),
      remote: [...(remote.checks || [])].sort((a, b) => a - b),
      union: Array.from(new Set([...(local.checks || []), ...(remote.checks || [])])).sort((a, b) => a - b)
    },
    hasConflict: false,
    hasDifferences: false
  };

  for (const type of ['projects', 'evidence', 'readings']) {
    const localList = local[type] || [];
    const remoteList = remote[type] || [];
    const localMap = new Map(localList.map(item => [item.id, item]));
    const remoteMap = new Map(remoteList.map(item => [item.id, item]));

    // Local items
    for (const [id, localItem] of localMap.entries()) {
      if (!remoteMap.has(id)) {
        result[type].localOnly.push({ id, item: localItem });
        result.hasDifferences = true;
      } else {
        const remoteItem = remoteMap.get(id);
        if (isRecordEqual(localItem, remoteItem)) {
          result[type].identical.push({ id, item: localItem });
        } else {
          result[type].conflict.push({ id, local: localItem, remote: remoteItem });
          result.hasConflict = true;
          result.hasDifferences = true;
        }
      }
    }

    // Remote-only items
    for (const [id, remoteItem] of remoteMap.entries()) {
      if (!localMap.has(id)) {
        result[type].remoteOnly.push({ id, item: remoteItem });
        result.hasDifferences = true;
      }
    }
  }

  // Check differences in checks
  if (JSON.stringify(result.checks.local) !== JSON.stringify(result.checks.remote)) {
    result.hasDifferences = true;
  }

  return result;
}

export function buildMergedWorkspace({ local = emptyWorkspace(), remote = emptyWorkspace(), selections = {}, checksResolution = 'union' }) {
  const diff = diffWorkspaces(local, remote);
  const merged = {
    schemaVersion: 2,
    projects: [],
    evidence: [],
    readings: [],
    checks: []
  };

  for (const type of ['projects', 'evidence', 'readings']) {
    const typeSelections = selections[type] || {};

    // 1. Identical items are automatically preserved
    for (const entry of diff[type].identical) {
      merged[type].push({ ...entry.item });
    }

    // 2. Local-only items (included unless explicitly set to 'omit' or false)
    for (const entry of diff[type].localOnly) {
      const choice = typeSelections[entry.id];
      if (choice !== 'omit' && choice !== false) {
        merged[type].push({ ...entry.item });
      }
    }

    // 3. Remote-only items (included unless explicitly set to 'omit' or false)
    for (const entry of diff[type].remoteOnly) {
      const choice = typeSelections[entry.id];
      if (choice !== 'omit' && choice !== false) {
        merged[type].push({ ...entry.item });
      }
    }

    // 4. Conflicts (user picks 'local' or 'remote'; defaults to 'local')
    for (const entry of diff[type].conflict) {
      const choice = typeSelections[entry.id];
      if (choice === 'remote') {
        merged[type].push({ ...entry.remote });
      } else if (choice === 'omit') {
        // do not include either
      } else {
        // default to local
        merged[type].push({ ...entry.local });
      }
    }
  }

  // Preserve foreign key invariants: unassign deleted/omitted project links
  const projectIds = new Set(merged.projects.map(p => p.id));
  merged.evidence = merged.evidence.map(e => (e.projectId && !projectIds.has(e.projectId) ? { ...e, projectId: '' } : e));
  merged.readings = merged.readings.map(r => (r.projectId && !projectIds.has(r.projectId) ? { ...r, projectId: '' } : r));

  // Checks resolution
  if (checksResolution === 'local') {
    merged.checks = [...diff.checks.local];
  } else if (checksResolution === 'remote') {
    merged.checks = [...diff.checks.remote];
  } else {
    merged.checks = [...diff.checks.union];
  }

  // Validate resulting workspace to guarantee safety
  const valid = validateWorkspace(merged);
  return valid;
}
