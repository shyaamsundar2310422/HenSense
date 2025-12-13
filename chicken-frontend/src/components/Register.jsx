import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { register, apiBase } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmP, setConfirmP] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e?.preventDefault();
    setMsg('');
    if (password !== confirmP) {
      setMsg('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), password);
      setMsg('Registered — please login.');
      setLoading(false);
      window.location.hash = '#/login';
    } catch (err) {
      setLoading(false);
      setMsg(err.message || 'Register failed');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="card p-6 rounded-xl space-y-4">
        <h2 className="text-xl font-semibold">Register</h2>
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
          <input
            value={confirmP}
            onChange={(e) => setConfirmP(e.target.value)}
            type="password"
            placeholder="confirm password"
            className="w-full p-2 border rounded"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-gradient px-4 py-2 rounded-md text-white shadow"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
            <a href="#/login" className="px-4 py-2 rounded-md border">
              Back to login
            </a>
          </div>
          {msg && <div className="text-sm text-slate-600">{msg}</div>}
          <div className="text-xs text-slate-500 mt-2">
            Backend: <code className="break-words text-xs">{apiBase}</code>
          </div>
        </form>
      </div>
    </div>
  );
}
