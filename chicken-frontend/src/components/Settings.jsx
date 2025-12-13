import { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

/**
 * Settings.jsx — Glassmorphism Version
 * Works 100% with your theme + navbar + routing.
 */
export default function Settings({ onClearHistory }) {
  const [apiUrl, setApiUrl] = useLocalStorage(
    'cf_api_url',
    import.meta.env.VITE_API_URL || ''
  );
  const [saveImages, setSaveImages] = useLocalStorage('cf_save_images', true);
  const [defaultConf, setDefaultConf] = useLocalStorage(
    'cf_default_conf',
    0.25
  );

  const [localApi, setLocalApi] = useState(apiUrl);
  const [localConf, setLocalConf] = useState(defaultConf);
  const [status, setStatus] = useState('');

  const handleSave = () => {
    try {
      setApiUrl(localApi.trim());
      setDefaultConf(Number(localConf));
      setStatus('Saved ✓');
      setTimeout(() => setStatus(''), 1500);
    } catch {
      setStatus('Failed');
    }
  };

  const handleClearHistory = () => {
    if (!confirm('Clear all saved history? This cannot be undone.')) return;

    if (typeof onClearHistory === 'function') {
      onClearHistory();
    } else {
      localStorage.removeItem('cf_history_v1');
    }

    setStatus('History cleared');
    setTimeout(() => setStatus(''), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Title */}
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* API URL */}
      <div className="settings-glass space-y-3">
        <label className="text-sm font-semibold">Backend API URL</label>
        <input
          className="w-full p-3 rounded-xl bg-white/30 border border-white/40 backdrop-blur-md shadow-md"
          value={localApi}
          onChange={(e) => setLocalApi(e.target.value)}
          placeholder="http://127.0.0.1:8000"
        />
        <p className="text-xs text-slate-700 opacity-80">
          The frontend will send requests to this URL.
        </p>
      </div>

      {/* Save Images */}
      <div className="settings-glass space-y-3">
        <label className="text-sm font-semibold">Save Images to History</label>
        <div className="flex gap-3">
          <button
            onClick={() => setSaveImages(true)}
            className={`px-4 py-2 rounded-xl shadow-md ${
              saveImages
                ? 'bg-primary-500 text-white'
                : 'bg-white/40 border border-white/50'
            }`}
          >
            On
          </button>
          <button
            onClick={() => setSaveImages(false)}
            className={`px-4 py-2 rounded-xl shadow-md ${
              !saveImages
                ? 'bg-primary-500 text-white'
                : 'bg-white/40 border border-white/50'
            }`}
          >
            Off
          </button>
        </div>
      </div>

      {/* Default Confidence */}
      <div className="settings-glass space-y-4">
        <label className="text-sm font-semibold">Default Min Confidence</label>

        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={localConf}
            onChange={(e) => setLocalConf(e.target.value)}
            className="flex-1 accent-primary-500"
          />
          <span className="font-semibold text-lg w-14 text-right">
            {Number(localConf).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleSave}
          className="btn-gradient px-6 py-2 rounded-xl shadow-md"
        >
          Save
        </button>

        <button
          onClick={handleClearHistory}
          className="px-5 py-2 rounded-xl bg-white/30 border border-white/50 backdrop-blur-md shadow"
        >
          Clear History
        </button>

        <div className="ml-auto text-sm text-slate-700">{status}</div>
      </div>
    </div>
  );
}
