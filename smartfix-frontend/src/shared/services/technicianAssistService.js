const BASE = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

export async function analyzeAssist(payload) {
  const res = await fetch(`${BASE}/api/technician-assist/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Assist failed (${res.status})`);
  }
  return res.json();
}

export async function fetchRepairTask(id) {
  const res = await fetch(`${BASE}/api/repair-tasks/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function saveRepairCase(body) {
  const res = await fetch(`${BASE}/api/repair-cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Save failed');
  return data;
}

export async function fetchRecentCases(limit = 20) {
  const res = await fetch(`${BASE}/api/repair-cases/recent?limit=${limit}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchAssistAnalytics(params = {}) {
  const months = params.months ?? 12;
  const patternCorpus = params.patternCorpus ?? 400;
  const res = await fetch(
    `${BASE}/api/technician-assist/analytics?months=${encodeURIComponent(months)}&patternCorpus=${encodeURIComponent(patternCorpus)}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Analytics failed (${res.status})`);
  }
  return res.json();
}
