import { useEffect, useState } from 'react';

// Safe import loader — prevents crash if AuthContext is missing
let useAuthSafe = null;
try {
  useAuthSafe = require('../contexts/AuthContext').useAuth;
} catch {
  useAuthSafe = null;
}

export default function Navbar({ title = 'HenSense' }) {
  const [dark, setDark] = useState(
    () => localStorage.getItem('cf_dark') === '1'
  );

  // safe user load
  let user = null;
  try {
    if (useAuthSafe) {
      const ctx = useAuthSafe();
      user = ctx?.user || null;
    } else {
      const saved = localStorage.getItem('cf_user');
      user = saved ? JSON.parse(saved) : null;
    }
  } catch {
    user = null;
  }

  // theme handler
  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('cf_dark', dark ? '1' : '0');
  }, [dark]);

  return (
    <header className="nav-glass p-4 flex items-center justify-between shadow-lg border-b">
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="HenSense Logo"
          className="w-12 h-12 rounded-xl shadow-md object-cover"
        />
        <div>
          <div className="text-lg font-bold">{title}</div>
          <div className="text-xs opacity-70">YOLO • FastAPI • React</div>
        </div>
      </div>

      <nav className="flex items-center gap-3">
        <a href="#/" className="btn-gradient">
          Home
        </a>
        <a href="#/model" className="btn-gradient">
          Model
        </a>
        <a href="#/dashboard" className="btn-gradient">
          Dashboard
        </a>
        <a href="#/settings" className="btn-gradient">
          Settings
        </a>

        {/* Working glass toggle */}
        <button
          onClick={() => setDark(!dark)}
          className={`glass-toggle ${dark ? 'active' : ''}`}
        >
          <div className="glass-toggle-circle"></div>
        </button>

        {/* LOGIN / REGISTER SECTION (RESTORED) */}
        {user ? (
          <div className="flex items-center gap-3 ml-2">
            <div className="px-3 py-1 bg-white/20 rounded-lg shadow text-sm">
              {user.username}
            </div>
            <a
              href="#/login"
              onClick={() => {
                localStorage.removeItem('cf_user');
              }}
              className="btn-gradient"
            >
              Logout
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <a href="#/login" className="btn-gradient">
              Login
            </a>
            <a href="#/register" className="btn-gradient">
              Register
            </a>
          </div>
        )}
      </nav>
    </header>
  );
}
