"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SourceData, SourceKey } from "./types";

interface DatasetState {
  data: SourceData | null;
  loading: boolean;
  error: string | null;
}

/** Fetches a source's dataset from the live API and exposes a reload() to call after a population action. */
export function useDataset(source: SourceKey) {
  const [state, setState] = useState<DatasetState>({ data: null, loading: true, error: null });
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`/api/dataset/${source}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}.`);
      const data = (await res.json()) as SourceData;
      if (mounted.current) setState({ data, loading: false, error: null });
    } catch (err) {
      if (mounted.current) {
        setState({ data: null, loading: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }, [source]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}

export interface JobState {
  id: string;
  status: "running" | "done" | "error";
  log: string[];
  result: unknown;
  error: string | null;
}

/** Polls /api/jobs/[id] until it finishes; calls onDone/onError once, then stops. */
export function pollJob(
  jobId: string,
  onUpdate: (job: JobState) => void,
  intervalMs = 1500,
): () => void {
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Job status request failed (${res.status}).`);
      const job = (await res.json()) as JobState;
      onUpdate(job);
      if (job.status === "running" && !stopped) {
        setTimeout(tick, intervalMs);
      }
    } catch (err) {
      if (!stopped) {
        onUpdate({
          id: jobId,
          status: "error",
          log: [],
          result: null,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  };
  tick();
  return () => {
    stopped = true;
  };
}
