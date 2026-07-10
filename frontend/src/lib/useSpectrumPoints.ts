"use client";

import { useCallback, useState } from "react";
import type { SourceKey, SpectrumPoint } from "./types";

/** Points fetched on demand for a single spectrum, plus what the source said. */
export interface LoadedPoints {
  points: SpectrumPoint[];
  depthColumn: string | null;
  depthUnit: string | null;
  totalPoints: number;
}

interface ApiPoint {
  wavelength_um: number;
  depth: number;
  errLow: number | null;
  errHigh: number | null;
}

interface ApiResponse {
  points: ApiPoint[];
  depthColumn: string | null;
  depthUnit: string | null;
  totalPoints: number;
  error?: string;
}

/**
 * Fetches a catalogued spectrum's points from the archive on demand (the
 * "no points loaded" case) and caches them by spectrum id for the session.
 * Nothing is persisted; a reload of the page clears the cache.
 */
export function useSpectrumPoints(source: SourceKey) {
  const [loaded, setLoaded] = useState<Record<string, LoadedPoints>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  const load = useCallback(
    async (id: string) => {
      setLoadingId(id);
      setErrorById((e) => {
        if (!(id in e)) return e;
        const next = { ...e };
        delete next[id];
        return next;
      });
      try {
        const res = await fetch(
          `/api/spectrum/points?source=${source}&id=${encodeURIComponent(id)}`,
          { cache: "no-store" },
        );
        const body = (await res.json()) as ApiResponse;
        if (!res.ok) throw new Error(body.error || `Request failed (${res.status}).`);
        const points: SpectrumPoint[] = body.points.map((p) => ({
          x: p.wavelength_um,
          y: p.depth,
          errLow: p.errLow,
          errHigh: p.errHigh,
        }));
        setLoaded((prev) => ({
          ...prev,
          [id]: {
            points,
            depthColumn: body.depthColumn,
            depthUnit: body.depthUnit,
            totalPoints: body.totalPoints,
          },
        }));
      } catch (err) {
        setErrorById((e) => ({ ...e, [id]: err instanceof Error ? err.message : String(err) }));
      } finally {
        setLoadingId((cur) => (cur === id ? null : cur));
      }
    },
    [source],
  );

  return { loaded, loadingId, errorById, load };
}
