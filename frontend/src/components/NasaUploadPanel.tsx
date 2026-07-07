"use client";

import { useCallback, useRef, useState } from "react";
import Icon from "./Icon";

const ARCHIVE_URL =
  "https://exoplanetarchive.ipac.caltech.edu/cgi-bin/atmospheres/nph-firefly?atmospheres";

interface Props {
  defaultOpen: boolean;
  onDone: () => void;
}

interface Pending {
  file: File;
}

interface Result {
  ok: boolean;
  log?: string[];
  saved?: string[];
  skipped?: string[];
  error?: string;
}

function isTbl(name: string): boolean {
  return /\.tbl$/i.test(name);
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NasaUploadPanel({ defaultOpen, onDone }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [showLog, setShowLog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const incoming = Array.from(fileList).filter((f) => isTbl(f.name));
    const rejected = Array.from(fileList).length - incoming.length;
    setPending((prev) => {
      const seen = new Set(prev.map((p) => p.file.name));
      const merged = [...prev];
      for (const f of incoming) {
        if (!seen.has(f.name)) {
          merged.push({ file: f });
          seen.add(f.name);
        }
      }
      return merged;
    });
    if (rejected > 0) {
      setResult({ ok: false, error: `${rejected} file(s) were skipped: only .tbl files are accepted.` });
    }
  }, []);

  const removeFile = (name: string) => {
    setPending((prev) => prev.filter((p) => p.file.name !== name));
  };

  const upload = async () => {
    if (pending.length === 0) return;
    setBusy(true);
    setResult(null);
    try {
      const form = new FormData();
      for (const p of pending) form.append("files", p.file, p.file.name);
      const res = await fetch("/api/nasa/upload", { method: "POST", body: form });
      const body = (await res.json()) as Result;
      setResult(body);
      if (body.ok) {
        setPending([]);
        onDone();
      }
    } catch (err) {
      setResult({ ok: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <button
        type="button"
        className="disclosure-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="row" style={{ gap: 10 }}>
          <Icon name="upload_file" />
          <span className="type-title" style={{ margin: 0 }}>
            Populate NASA spectra
          </span>
        </span>
        <Icon name={open ? "expand_less" : "expand_more"} />
      </button>

      {open ? (
        <div className="stack" style={{ marginTop: 16 }}>
          <ol className="steps" style={{ margin: 0 }}>
            <li className="step">
              <span className="step-num">1</span>
              <span className="step-body">
                Open the archive, filter to Instrument contains MIRI and Type of Spectrum =
                Transmission, check the rows, then use &quot;Download All Checked Spectra&quot;
                (keep IPAC Table Format, .tbl).
                <div style={{ marginTop: 8 }}>
                  <a
                    className="segmented-btn"
                    style={{ border: "1px solid var(--md-sys-color-outline)", borderRadius: "var(--md-shape-full)" }}
                    href={ARCHIVE_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon name="open_in_new" />
                    Open NASA Exoplanet Archive
                  </a>
                </div>
              </span>
            </li>
            <li className="step">
              <span className="step-num">2</span>
              <span className="step-body">Drop the downloaded .tbl files below, or choose them.</span>
            </li>
          </ol>

          <div
            className={`dropzone${dragOver ? " active" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            aria-label="Drop .tbl files here or click to choose files"
          >
            <Icon name="cloud_upload" size={32} />
            <p className="type-body" style={{ margin: "8px 0 0" }}>
              Drag .tbl files here, or click to choose
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".tbl"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {pending.length > 0 ? (
            <div className="file-chip-list">
              {pending.map((p) => (
                <span className="file-chip" key={p.file.name}>
                  <Icon name="description" size={16} />
                  {p.file.name}
                  <span className="muted">({fmtBytes(p.file.size)})</span>
                  <button
                    type="button"
                    className="file-chip-remove"
                    onClick={() => removeFile(p.file.name)}
                    aria-label={`Remove ${p.file.name}`}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="row">
            <button
              type="button"
              className="segmented-btn filled"
              disabled={pending.length === 0 || busy}
              onClick={upload}
            >
              {busy ? <Icon name="progress_activity" className="spin-icon" /> : <Icon name="build" />}
              {busy ? "Uploading and building..." : `Upload and build (${pending.length})`}
            </button>
          </div>

          {result ? (
            <div className={`banner ${result.ok ? "info" : "caution"}`} role="status">
              <Icon name={result.ok ? "check_circle" : "error"} />
              <div style={{ flex: 1 }}>
                <p>
                  {result.ok
                    ? `Saved ${result.saved?.length ?? 0} file(s) and rebuilt the points CSV.`
                    : result.error || "The upload failed."}
                </p>
                {result.skipped && result.skipped.length > 0 ? (
                  <p className="muted" style={{ marginTop: 4 }}>
                    Skipped: {result.skipped.join(", ")}
                  </p>
                ) : null}
                {result.log && result.log.length > 0 ? (
                  <>
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ width: "auto", height: "auto", padding: "2px 0" }}
                      onClick={() => setShowLog((s) => !s)}
                    >
                      <span className="type-label" style={{ textDecoration: "underline" }}>
                        {showLog ? "Hide" : "Show"} build log
                      </span>
                    </button>
                    {showLog ? <code className="code" style={{ marginTop: 6 }}>{result.log.join("\n")}</code> : null}
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
