// src/components/ThemeToggle.jsx

export default function ThemeToggle({ dark, setDark }) {
  return (
    <div
      onClick={() => setDark(!dark)}
      className={`
        glass-toggle
        ${dark ? 'active' : ''}
        cursor-pointer
      `}
      title="Toggle theme"
    >
      <div className="glass-toggle-circle flex items-center justify-center text-xs">
        {dark ? '☾' : '☀'}
      </div>
    </div>
  );
}
