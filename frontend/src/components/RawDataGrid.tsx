"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  GridReadyEvent,
  ModuleRegistry,
  AllCommunityModule,
} from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

interface Props {
  source: "nasa" | "mast";
}

const NASA_HIGHLIGHTS = [
  "pl_name",
  "pl_trandep",
  "pl_trandur",
  "pl_rade",
  "star_radius_sun",
  "star_temp_k",
  "star_surface_gravity",
  "pl_eqt",
  "star_vmag",
  "star_jmag",
  "star_hmag",
  "star_kmag",
];

const MAST_HIGHLIGHTS = [
  "WAVELENGTH",
  "TRANSIT_DEPTH",
  "FLUX",
  "ERR",
  "FLUX_ERROR",
  "INSTRUMENT",
  "FILTER",
  "GRATING",
];

export default function RawDataGrid({ source }: Props) {
  const [rowData, setRowData] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<AgGridReact>(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dataset/raw?source=${source}`);
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        
        if (!active) return;
        
        if (data.rows && data.headers) {
          setRowData(data.rows);
          
          const highlights = source === "nasa" ? NASA_HIGHLIGHTS : MAST_HIGHLIGHTS;
          
          const cols: ColDef[] = data.headers.map((h: string) => ({
            field: h,
            headerName: h,
            cellClass: highlights.includes(h) ? "highlighted-col" : undefined,
          }));
          
          setColumnDefs(cols);
        }
      } catch (err) {
        console.error("Failed to load raw data", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    
    fetchData();
    return () => { active = false; };
  }, [source]);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 120,
    };
  }, []);

  const onExportClick = useCallback(() => {
    gridRef.current?.api.exportDataAsCsv({
      fileName: `${source}_export.csv`,
    });
  }, [source]);

  if (loading) {
    return <div className="p-8 text-center text-secondary">Loading raw dataset...</div>;
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 className="card-title">Raw Dataset Viewer</h3>
        <button className="button" onClick={onExportClick} style={{ padding: "4px 12px", background: "var(--color-surface-variant)", borderRadius: 4, color: "var(--color-on-surface)" }}>
          Download as CSV
        </button>
      </div>
      <div 
        className="ag-theme-quartz"
        style={{ width: "100%", height: "500px" }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          pagination={true}
          paginationPageSize={100}
          paginationPageSizeSelector={[100, 250, 500]}
          domLayout="normal"
        />
      </div>
    </div>
  );
}
