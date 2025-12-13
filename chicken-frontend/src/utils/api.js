// src/utils/api.js
import axios from 'axios';

console.log('api.js loaded!');

export function getApiBase() {
  try {
    console.log('getApiBase RAW =', raw);
    console.log('getApiBase RETURN =', cleaned);

    const env = import.meta.env?.VITE_API_URL;
    const ls = localStorage.getItem('cf_api_url');
    const raw = env ?? ls ?? 'http://127.0.0.1:8000';

    return String(raw).trim().replace(/\/$/, '');
  } catch {
    return 'http://127.0.0.1:8000';
  }
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

  if (!res.ok) throw new Error(`Login failed ${res.status}`);

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
    onUploadProgress: (ev) => {
      if (onUploadProgress) onUploadProgress(ev);
    }
  });

  return resp.data;
}
