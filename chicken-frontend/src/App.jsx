import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import HistoryCard from './components/HistoryCard';
import Login from './components/Login';
import ModelInfo from './components/ModelInfo';
import Navbar from './components/Navbar';
import Register from './components/Register';
import ResultCard from './components/ResultCard';
import Settings from './components/Settings';
import UploadCard from './components/UploadCard';
import { useAuth } from './contexts/AuthContext';
import useLocalStorage from './hooks/useLocalStorage';

export default function App() {
  const { user } = useAuth();
  const [route, setRoute] = useState(
    () => window.location.hash.replace('#', '') || '/'
  );

  // ✅ RESULT STATE (stable)
  const [result, setResult] = useState(null);

  useEffect(() => {
    const handler = () =>
      setRoute(window.location.hash.replace('#', '') || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const historyKey = (username) => `cf_history_v1:${username || 'guest'}`;
  const [history, setHistory] = useLocalStorage(historyKey(user?.username), []);

  const addHistory = (entry) => {
    setHistory((prev) => [entry, ...(prev || [])].slice(0, 200));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(historyKey(user?.username));
  };

  /* ---------------- ROUTE CONTENT ---------------- */

  let content = null;

  if (route === '/login') {
    content = <Login onSuccess={() => (window.location.hash = '#/')} />;
  } else if (route === '/register') {
    content = <Register />;
  } else if (route === '/model') {
    content = <ModelInfo />;
  } else if (route === '/dashboard') {
    if (!user?.username) {
      window.location.hash = '#/login';
      return null;
    }
    content = <Dashboard history={history} />;
  } else if (route === '/settings') {
    content = <Settings onClearHistory={clearHistory} />;
  } else {
    // ✅ DEFAULT UPLOAD PAGE
    content = (
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-2 space-y-6">
          <UploadCard
            onResult={(d) => {
              console.log('App received result:', d);
              setResult(d);
            }}
            addHistory={addHistory}
          />

          {/* ✅ RESULT NEVER UNMOUNTS */}
          <ResultCard data={result} />
        </section>

        <aside className="space-y-6">
          <HistoryCard items={history} />
        </aside>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      {content}
    </div>
  );
}
