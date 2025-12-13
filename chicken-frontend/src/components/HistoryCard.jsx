export default function HistoryCard({ items = [] }) {
  if (!items.length) {
    return (
      <div className="card-glass p-6 text-center text-slate-800">
        No history yet.
      </div>
    );
  }

  return (
    <div className="card-glass p-6 text-slate-900">
      <h3 className="font-semibold mb-4 text-lg">History</h3>
      <div className="space-y-3">
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-center justify-between p-3 rounded-xl backdrop-blur bg-white/30 border border-white/40"
          >
            <div>
              <div className="font-medium">{it.fileName}</div>
              <div className="text-xs text-slate-600">
                {new Date(it.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="text-sm text-slate-700">
              {it.response?.predictions?.length || 0} detections
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
