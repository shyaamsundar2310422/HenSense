// src/components/UploadCard.jsx
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { sendImage } from '../utils/api';

// Optional Auth context (safe fallback)
let useAuthSafe = null;
try {
  // eslint-disable-next-line
  useAuthSafe = require('../contexts/AuthContext').useAuth;
} catch (e) {
  useAuthSafe = null;
}

export default function UploadCard({ onResult, addHistory }) {
  const storedConf = Number(localStorage.getItem('cf_default_conf') ?? 0.25);
  const SAVE_IMAGES = localStorage.getItem('cf_save_images') !== 'false';

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [conf, setConf] = useState(storedConf);
  const [error, setError] = useState(null);
  const [latestResult, setLatestResult] = useState(null);

  // auth (optional)
  let auth = { user: null };
  try {
    if (useAuthSafe) auth = useAuthSafe() || { user: null };
  } catch (e) {
    try {
      const u = localStorage.getItem('cf_user');
      auth.user = u ? JSON.parse(u) : null;
    } catch {
      auth.user = null;
    }
  }
  const username =
    auth?.user?.username || localStorage.getItem('cf_user_name') || 'guest';

  // cleanup preview URL
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onDrop = useCallback((acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const f = acceptedFiles[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
    setProgress(0);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  const handlePredict = async () => {
    if (!file) {
      setError('Please choose an image first.');
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      const data = await sendImage(file, {
        conf,
        onUploadProgress: (e) => {
          if (!e.lengthComputable) return;
          const p = Math.round((e.loaded * 100) / e.total);
          setProgress(p);
        }
      });

      setLatestResult(data);
      onResult?.(data);

      const entry = {
        id: Date.now(),
        fileName: file.name,
        timestamp: new Date().toISOString(),
        response: SAVE_IMAGES ? data : { predictions: data.predictions || [] }
      };

      if (typeof addHistory === 'function') addHistory(entry);

      setLoading(false);
      setProgress(100);
    } catch (e) {
      setLoading(false);
      const msg = e?.response?.data?.error || e?.message || 'Prediction failed';
      setError(msg);
    }
  };

  const handleDownloadAnnotated = () => {
    const base64 =
      latestResult?.annotated_image_base64 ||
      latestResult?.annotated_image ||
      latestResult?.annotated;

    if (!base64) {
      setError('No annotated image available to download.');
      return;
    }

    try {
      const a = document.createElement('a');
      a.href = `data:image/png;base64,${base64}`;
      a.download = `annotated_${file?.name || 'result'}.png`;
      a.click();
    } catch {
      setError('Download failed.');
    }
  };

  return (
    <div className="upload-glass">
      {/* DROPZONE */}
      <div
        {...getRootProps()}
        className="upload-dropzone cursor-pointer text-center"
      >
        <input {...getInputProps()} capture="environment" />

        {isDragActive ? (
          <p className="text-primary-700 font-medium">Drop the image here...</p>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="text-slate-700 font-semibold">
              Drag & drop or click to select
            </p>
            <p className="text-sm text-slate-500">
              Prefer clear & bright chicken images.
            </p>

            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="max-h-44 mt-3 rounded shadow-lg"
              />
            ) : null}
          </div>
        )}
      </div>

      {/* CONF SLIDER + BUTTON */}
      <div className="mt-5 flex gap-3 items-center">
        <label className="text-sm">Confidence</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={conf}
          onChange={(e) => setConf(Number(e.target.value))}
          className="flex-1"
        />
        <span className="w-12 text-right font-semibold">{conf.toFixed(2)}</span>

        <button
          className="btn-gradient px-4 py-2 rounded-lg shadow-md"
          onClick={handlePredict}
          disabled={loading}
        >
          {loading ? `Uploading ${progress}%` : 'Predict'}
        </button>
      </div>

      {/* PROGRESS BAR */}
      {loading && (
        <div className="mt-4">
          <div className="w-full bg-slate-200 h-2 rounded overflow-hidden">
            <div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-primary-400 to-accent-400"
            />
          </div>
        </div>
      )}

      {/* DOWNLOAD + USER */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleDownloadAnnotated}
          className="px-3 py-1 rounded-md border hover:bg-white/20 text-sm"
        >
          Download annotated
        </button>

        <div className="text-xs text-slate-600 ml-auto">
          Signed in as: <strong>{username}</strong>
        </div>
      </div>

      {/* ERRORS */}
      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {!auth?.user && (
        <div className="mt-3 text-xs text-slate-500">
          For per-user history, please{' '}
          <a href="#/settings" className="underline font-semibold">
            login / register
          </a>
          .
        </div>
      )}
    </div>
  );
}
