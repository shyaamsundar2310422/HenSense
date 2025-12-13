/**
 * ModelInfo page — shows model architecture, dataset, metrics, license and reproduction instructions.
 * Looks best inside the existing layout and uses Tailwind classes consistent with the app.
 */
export default function ModelInfo() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Model Information</h2>
          <p className="text-sm text-slate-500 mt-1">
            Details about the YOLO model used for chicken faeces classification,
            dataset, evaluation and how to reproduce results.
          </p>
        </div>
        <div>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="btn-gradient inline-block px-4 py-2 rounded-md text-white shadow"
          >
            Download model weights
          </a>
        </div>
      </div>

      <section className="p-5 rounded-xl bg-gradient-to-br from-white/90 to-slate-100/90 text-black shadow-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-2 text-black">Model summary</h3>

        <div
          className="p-5 rounded-xl bg-gradient-to-br from-white/95 to-slate-100/90 
                    text-black shadow-lg border border-gray-200"
        >
          <p>
            <strong>Architecture:</strong> YOLO (Ultralytics YOLO family) —
            single-stage object detector with backbone + neck + head.
          </p>
          <p>
            <strong>Task:</strong> detect and classify chicken faeces instances
            in images, then map detection classes to Health labels (Healthy /
            Unhealthy).
          </p>
          <p>
            <strong>Input size:</strong> 640×640 (training / inference default,
            configurable)
          </p>
          <p>
            <strong>Output:</strong> bounding boxes, class id, confidence score.
            API returns JSON and optional annotated image (base64 PNG).
          </p>
        </div>
      </section>

      <section className="p-5 rounded-xl bg-gradient-to-br from-white/90 to-slate-100/90 text-black shadow-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-2 text-black">
          Dataset Information
        </h3>

        <div
          className="p-5 rounded-xl bg-gradient-to-br from-white/95 to-slate-100/90 
                    text-black shadow-lg border border-gray-200"
        >
          <p>
            <strong>Source:</strong> Proprietary / field-collected chicken
            faeces images (labelling performed manually).
          </p>
          <p>
            <strong>Size:</strong> <em>Example:</em> 3,000 labeled images (split
            80/10/10 for train/val/test) — update to your actual numbers in the
            repo.
          </p>
          <p>
            <strong>Annotations:</strong> Bounding boxes per faeces instance
            with class labels. The dataset includes diverse lighting and
            background conditions representative of farm imagery.
          </p>
          <p>
            <strong>Preprocessing:</strong> resizing, random flip, color jitter,
            brightness/contrast augmentation during training.
          </p>
        </div>
      </section>

      <section className="p-5 rounded-xl bg-gradient-to-br from-white/90 to-slate-100/90 text-black shadow-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-2 text-black">
          Evaluation Metrics
        </h3>

        <div
          className="p-5 rounded-xl bg-gradient-to-br from-white/95 to-slate-100/90 
                    text-black shadow-lg border border-gray-200"
        >
          <p>
            <strong>Detection metrics:</strong> mAP@0.5 (mean Average
            Precision), Precision, Recall — computed on validation/test set.
          </p>
          <p>
            <strong>Classification mapping:</strong> Per-detection classes were
            mapped to human-friendly labels: <code>Healthy</code> /{' '}
            <code>Unhealthy</code>.
          </p>
          <p>
            <strong>Example reported results:</strong>
          </p>
          <ul className="list-disc ml-5 text-slate-600">
            <li>mAP@0.5: 0.82</li>
            <li>Precision: 0.79</li>
            <li>Recall: 0.84</li>
            <li>Test set size: 300 images</li>
          </ul>
          <p className="text-xs text-slate-500">
            (Replace the numbers above with actual measured metrics from your
            experiments.)
          </p>
        </div>
      </section>

      <section className="p-5 rounded-xl bg-gradient-to-br from-white/90 to-slate-100/90 text-black shadow-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-2 text-black">
          Limitations & Safety
        </h3>

        <div
          className="p-5 rounded-xl bg-gradient-to-br from-white/95 to-slate-100/90 
                    text-black shadow-lg border border-gray-200"
        >
          <p>
            <strong>Domain shift:</strong> Model performance may degrade on
            images from farms with very different lighting, camera angles, or
            diets not represented in the training data.
          </p>
          <p>
            <strong>Ambiguous cases:</strong> Some faeces types are visually
            similar; model should be used as a screening tool not a medical
            diagnosis.
          </p>
          <p>
            <strong>False negatives:</strong> No-detection doesn't guarantee
            health — advise retake or manual inspection.
          </p>
          <p>
            <strong>Privacy:</strong> Images may contain location or other
            farm-identifying info — obtain consent before storing or sharing.
          </p>
        </div>
      </section>

      <section className="p-5 rounded-xl bg-gradient-to-br from-white/90 to-slate-100/90 text-black shadow-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-2 text-black">
          Reproducibility & Training
        </h3>

        <div
          className="p-5 rounded-xl bg-gradient-to-br from-white/95 to-slate-100/90 
                    text-black shadow-lg border border-gray-200"
        >
          <p>
            <strong>Environment:</strong> Python 3.10+, PyTorch (matching
            Ultralytics requirements), ultralytics package for YOLO
            training/inference.
          </p>
          <p>
            <strong>Suggested steps (summary):</strong>
          </p>
          <ol className="list-decimal ml-5 text-slate-600">
            <li>
              Prepare labeled dataset in YOLO format (images + labels `.txt`
              files).
            </li>
            <li>
              Configure `data.yaml` with class names and paths to train/val
              images.
            </li>
            <li>
              Use Ultralytics training script:{' '}
              <code>
                yolo train model=yolov8n.pt data=data.yaml epochs=50 imgsz=640
              </code>{' '}
              (adjust model and hyperparams).
            </li>
            <li>
              Evaluate:{' '}
              <code>yolo val model=best.pt data=data.yaml imgsz=640</code>.
            </li>
          </ol>
          <p className="text-xs text-slate-500">
            Include your exact training commands, script names and
            hyperparameters in the repository `models/README.md` for full
            reproducibility.
          </p>
        </div>
      </section>

      <section className="p-5 rounded-xl bg-gradient-to-br from-white/90 to-slate-100/90 text-black shadow-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-2 text-black">
          Model Card (Short){' '}
        </h3>

        <div
          className="p-5 rounded-xl bg-gradient-to-br from-white/95 to-slate-100/90 
                    text-black shadow-lg border border-gray-200"
        >
          <pre className="bg-slate-50 p-3 rounded text-xs overflow-auto">
            {`Model: chicken-faeces-yolo
License: MIT (update as appropriate)
Training data: proprietary farm-collected images
Intended use: Assistive screening tool for poultry health monitoring
Limitations: Not a replacement for veterinary diagnosis`}
          </pre>
        </div>
      </section>

      <div className="flex gap-3">
        <a
          className="inline-block px-4 py-2 rounded-md btn-gradient text-white shadow"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            alert('Download instructions in models/README.md');
          }}
        >
          Download weights
        </a>
        <a
          className="inline-block px-4 py-2 rounded-md border hover:bg-slate-50"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigator.clipboard?.writeText('yolo train ...');
            alert('Training snippet copied to clipboard');
          }}
        >
          Copy training snippet
        </a>
      </div>
    </div>
  );
}
