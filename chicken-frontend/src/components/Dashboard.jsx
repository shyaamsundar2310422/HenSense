import { useMemo } from 'react';

/**
 * Props:
 * - history: array of { id, fileName, timestamp, response }
 */
export default function Dashboard({ history = [] }) {
  // compute stats
  const stats = useMemo(() => {
    const total = history.length;
    let healthy = 0,
      unhealthy = 0,
      nodetect = 0;
    const byDay = {}; // yyyy-mm-dd -> count

    history.forEach((h) => {
      const preds = h.response?.predictions || [];
      if (!preds.length) nodetect++;
      else {
        // simple mapping: check label or class name for keywords
        const top = preds[0];
        const label = (top?.label || '').toLowerCase();
        if (
          label.includes('healthy') ||
          label.includes('normal') ||
          label.includes('ok')
        )
          healthy++;
        else unhealthy++;
      }

      const d = new Date(h.timestamp);
      const day = d.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    });

    // last 7 days array sorted ascending
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().slice(0, 10);
      days.push({ day: dayKey, count: byDay[dayKey] || 0 });
    }

    return { total, healthy, unhealthy, nodetect, days };
  }, [history]);

  // export CSV (simple)
  const exportCSV = () => {
    const rows = [
      ['id', 'fileName', 'timestamp', 'predictionsCount', 'topLabel'],
      ...history.map((h) => [
        h.id,
        h.fileName,
        h.timestamp,
        (h.response?.predictions?.length || 0).toString(),
        (h.response?.predictions?.[0]?.label || '').replace(/,/g, '')
      ])
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cf_history_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-slate-500">
            Quick stats & recent trends from your local history
          </p>
        </div>
        <div>
          <button
            onClick={exportCSV}
            className="btn-gradient px-4 py-2 rounded-md text-white shadow"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total samples"
          value={stats.total}
          accent="primary"
          text="black"
        />
        <StatCard title="Healthy" value={stats.healthy} accent="success" />
        <StatCard title="Unhealthy" value={stats.unhealthy} accent="danger" />
        <StatCard title="No detection" value={stats.nodetect} accent="slate" />
      </div>

      {/* Trend chart + recent items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-4 rounded-xl col-span-2">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded"></span>
            <span className="text-2xl font-bold">Last 7 days — uploads</span>
          </h3>

          <SmallBarChart data={stats.days} />
        </div>

        <div className="card p-4 rounded-xl">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-5 bg-gradient-to-b from-pink-400 to-rose-600 rounded"></span>
            <span className="text-2xl font-bold">Recent entries</span>
          </h3>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-slate-500">No history yet.</div>
            ) : (
              history.slice(0, 10).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-slate-50"
                >
                  <div>
                    <div className="font-medium">{h.fileName}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(h.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600">
                    {h.response?.predictions?.length || 0} detections
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* small helper components */

function StatCard({ title, value, accent = 'primary', text = 'black' }) {
  const accentMap = {
    primary: 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white',
    success: 'bg-gradient-to-br from-emerald-400 to-green-600 text-white',
    danger: 'bg-gradient-to-br from-rose-400 to-red-600 text-white',
    slate: 'bg-gradient-to-br from-slate-300 to-slate-500 text-white'
  };

  const textClass = text === 'black' ? '!text-black' : 'text-black';

  return (
    <div className="p-5 rounded-xl bg-white/90 shadow-md">
      <div
        className={`inline-flex items-center justify-center w-12 h-12 rounded-md mb-3 ${
          accentMap[accent] || accentMap.primary
        }`}
      />

      {/* Bigger title */}
      <div className={`text-sm font-semibold ${textClass}`}>{title}</div>

      {/* Bigger value */}
      <div className={`text-3xl font-extrabold mt-1 ${textClass}`}>{value}</div>
    </div>
  );
}

/* Simple SVG bar chart */
function SmallBarChart({ data = [] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const w = 600;
  const h = 160;
  const padding = 28;
  const innerW = w - padding * 2;
  const barWidth = innerW / (data.length || 1) - 8;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="160">
        <g transform={`translate(${padding}, 8)`}>
          {data.map((d, i) => {
            const x = i * (barWidth + 8);
            const barH = (d.count / max) * (h - 60);
            const y = h - 60 - barH;
            return (
              <g key={d.day} transform={`translate(${x}, 0)`}>
                <rect
                  x="0"
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="6"
                  fill="url(#gGrad)"
                />
                <text
                  x={barWidth / 2}
                  y={h - 40}
                  fontSize="10"
                  fill="#475569"
                  textAnchor="middle"
                >
                  {d.day.slice(5)}
                </text>
                <text
                  x={barWidth / 2}
                  y={y - 6}
                  fontSize="10"
                  fill="#0f172a"
                  textAnchor="middle"
                >
                  {d.count}
                </text>
              </g>
            );
          })}
          <defs>
            <linearGradient id="gGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
          </defs>
        </g>
      </svg>
    </div>
  );
}
