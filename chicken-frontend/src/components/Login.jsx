import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login({ onSuccess }) {
  const { login, apiBase } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e?.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const data = await login(username.trim(), password);
      // if backend returned token, AuthContext stored it; but also localStorage may have cf_token
      setLoading(false);
      onSuccess && onSuccess();
      window.location.hash = '#/';
    } catch (error) {
      setLoading(false);
      setErr(error?.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="card p-6 rounded-xl space-y-4">
        <h2 className="text-xl font-semibold">Login</h2>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="w-full p-2 border rounded"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="password"
            className="w-full p-2 border rounded"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-gradient px-4 py-2 rounded-md text-white shadow"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <a href="#/register" className="px-4 py-2 rounded-md border">
              Register
            </a>
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <div className="text-xs text-slate-500 mt-2">
            Backend: <code className="break-words text-xs">{apiBase}</code>
          </div>
        </form>
      </div>
    </div>
  );
}
