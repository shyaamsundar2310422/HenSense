// src/components/ResultCard.jsx

function ConfidenceBar({ conf }) {
  const pct = Math.round((conf || 0) * 100);
  return (
    <div className="w-full h-3 rounded-lg overflow-hidden bg-slate-200 border">
      <div
        style={{ width: `${pct}%` }}
        className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400"
      />
    </div>
  );
}

export default function ResultCard({ data }) {
  console.log('ResultCard received data:', data);

  if (!data) {
    return (
      <div className="card p-5 rounded-xl text-center text-slate-500">
        No prediction yet — upload an image to get started.
      </div>
    );
  }

  const predictions = Array.isArray(data.predictions) ? data.predictions : [];
  const annotated = data.annotated_image_base64;

  return (
    <div className="card p-6 rounded-xl space-y-4">
      <h3 className="text-xl font-semibold text-black">Prediction</h3>

      {annotated && (
        <div className="annot-wrap">
          <img
            src={`data:image/png;base64,${annotated}`}
            alt="Annotated"
            className="w-full rounded-lg border shadow-sm"
          />
        </div>
      )}

      <div className="p-4 rounded-lg bg-white/90 border shadow-md">
        {predictions.length === 0 ? (
          <div className="text-slate-600 text-sm">
            No detections above threshold.
          </div>
        ) : (
          predictions.map((p, i) => (
            <div key={i} className="mb-4 p-4 rounded-lg border bg-white">
              <div className="flex justify-between">
                <div>
                  <div className="text-lg font-bold text-black">{p.label}</div>
                  <div className="text-xs text-slate-500">
                    bbox: {p.box.join(', ')}
                  </div>
                </div>
                <div className="font-semibold text-slate-700">
                  {(p.conf * 100).toFixed(1)}%
                </div>
              </div>

              <div className="mt-3">
                <ConfidenceBar conf={p.conf} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
