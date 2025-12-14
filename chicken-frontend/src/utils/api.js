import axios from 'axios';

// Force rebuild marker
console.log('FORCED VERCEL REBUILD');
console.log('api.js loaded');

// ✅ Resolve API base ONCE at module load time
const API_BASE = (() => {
  try {
    // Vite env (works only at build time)
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch (e) {}

  // Browser override
  const ls =
    typeof window !== 'undefined' ? localStorage.getItem('cf_api_url') : null;

  return ls || 'http://127.0.0.1:8000';
})().replace(/\/$/, '');

// ---------------- HELPERS ----------------

export function getApiBase() {
  return API_BASE;
}

// ---------------- AUTH ----------------

export async function registerRequest(username, password) {
  const api = getApiBase();

  const form = new FormData();
  form.append('username', username);
  form.append('password', password);

  const res = await fetch(`${api}/auth/register`, {
    method: 'POST',
    body: form
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Register failed: ${res.status} ${t}`);
  }

  return res.json();
}

export async function loginRequest(username, password) {
  const api = getApiBase();

  const form = new FormData();
  form.append('username', username);
  form.append('password', password);

  const res = await fetch(`${api}/auth/login`, {
    method: 'POST',
    body: form
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Login failed: ${res.status} ${t}`);
  }

  return res.json();
}

export function setAuthToken(t) {
  if (t) localStorage.setItem('cf_token', t);
  else localStorage.removeItem('cf_token');
}

export function getAuthHeaders() {
  const t = localStorage.getItem('cf_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ---------------- PREDICT ----------------

export async function sendImage(file, { conf = 0.25, onUploadProgress } = {}) {
  const api = getApiBase();
  const url = `${api}/predict`;

  const form = new FormData();
  form.append('file', file);
  form.append('conf', String(conf));

  const resp = await axios.post(url, form, {
    headers: { ...getAuthHeaders() },
    onUploadProgress
  });

  return resp.data;
}
