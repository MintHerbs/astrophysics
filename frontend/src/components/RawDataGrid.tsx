"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  ModuleRegistry,
  AllCommunityModule,
  IHeaderParams,
} from "ag-grid-community";
import Icon from "./Icon";
import { NASA_HIGHLIGHTS, MAST_HIGHLIGHTS } from "@/lib/rawColumnHighlights";

ModuleRegistry.registerModules([AllCommunityModule]);

interface Props {
  source: "nasa" | "mast";
}

// Custom Header Component to add a highlight toggle
const CustomHeader = (props: IHeaderParams & { toggleHighlight: (colId: string) => void; isHighlighted: boolean }) => {
  const [sortState, setSortState] = useState<string | undefined>();
  
  useEffect(() => {
    const listener = () => {
      if (props.column.isSortAscending()) setSortState("asc");
      else if (props.column.isSortDescending()) setSortState("desc");
      else setSortState(undefined);
    };
    props.column.addEventListener("sortChanged", listener);
    return () => props.column.removeEventListener("sortChanged", listener);
  }, [props.column]);

  const onSortRequested = (event: any) => {
    props.progressSort(event.shiftKey);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <div 
        onClick={onSortRequested} 
        style={{ cursor: "pointer", display: "flex", alignItems: "center", flex: 1, overflow: "hidden" }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{props.displayName}</span>
        {sortState === "asc" && <Icon name="arrow_upward" />}
        {sortState === "desc" && <Icon name="arrow_downward" />}
      </div>
      <button 
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          props.toggleHighlight(props.column.getColId());
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: props.isHighlighted ? "var(--md-sys-color-primary)" : "var(--md-sys-color-on-surface-variant)",
          padding: "2px",
          display: "flex"
        }}
        title="Toggle highlight"
      >
        <Icon name="palette" />
      </button>
    </div>
  );
};


export default function RawDataGrid({ source }: Props) {
  const [rowData, setRowData] = useState<any[]>([]);
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [manualHighlights, setManualHighlights] = useState<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
          setAllColumns(data.headers);
          setVisibleColumns(new Set(data.headers));
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

  const toggleHighlight = useCallback((colId: string) => {
    setManualHighlights((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  }, []);

  const columnDefs = useMemo<ColDef[]>(() => {
    const studyHighlights = source === "nasa" ? NASA_HIGHLIGHTS : MAST_HIGHLIGHTS;
    
    return allColumns.map((h: string) => {
      const isStudyHighlighted = studyHighlights.includes(h);
      const isManualHighlighted = manualHighlights.has(h);
      
      let cellClass = undefined;
      if (isManualHighlighted) {
        cellClass = "manual-highlighted-col";
      } else if (isStudyHighlighted) {
        cellClass = "highlighted-col";
      }

      return {
        field: h,
        headerName: h,
        hide: !visibleColumns.has(h),
        cellClass,
        headerComponent: CustomHeader,
        headerComponentParams: {
          toggleHighlight,
          isHighlighted: isManualHighlighted || isStudyHighlighted
        }
      };
    });
  }, [allColumns, source, manualHighlights, visibleColumns, toggleHighlight]);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      sortable: false, // Custom header handles sorting
      filter: true,
      resizable: true,
      minWidth: 140,
    };
  }, []);

  const onExportClick = useCallback(() => {
    gridRef.current?.api.exportDataAsCsv({
      fileName: `${source}_export.csv`,
    });
  }, [source]);

  const toggleColumnVisibility = (colId: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-secondary">Loading raw dataset...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        
        {/* Column Visibility Dropdown */}
        <div style={{ position: "relative" }}>
          <button 
            className="segmented-btn" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ borderRadius: 8, border: "1px solid var(--md-sys-color-outline)" }}
          >
            <Icon name="view_column" />
            Columns ({visibleColumns.size}/{allColumns.length})
            <Icon name={dropdownOpen ? "expand_less" : "expand_more"} />
          </button>

          {dropdownOpen && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 4,
              backgroundColor: "var(--md-sys-color-surface-container-high)",
              border: "1px solid var(--md-sys-color-outline-variant)",
              borderRadius: 8,
              boxShadow: "var(--md-elevation-2)",
              zIndex: 100,
              maxHeight: 300,
              overflowY: "auto",
              padding: 8,
              minWidth: 200,
              display: "flex",
              flexDirection: "column",
              gap: 4
            }}>
              {allColumns.map((col) => (
                <label key={col} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.85rem" }}>
                  <input 
                    type="checkbox" 
                    checked={visibleColumns.has(col)} 
                    onChange={() => toggleColumnVisibility(col)} 
                  />
                  {col}
                </label>
              ))}
            </div>
          )}
        </div>

        <button className="segmented-btn" onClick={onExportClick} style={{ borderRadius: 8, border: "1px solid var(--md-sys-color-outline)" }}>
          <Icon name="download" />
          Download CSV
        </button>
      </div>

      <div 
        className="ag-theme-quartz"
        style={{ width: "100%", height: "500px" }}
      >
        <AgGridReact
          // The app styles the grid with the imported CSS file themes
          // (ag-grid.css + ag-theme-quartz.css in globals.css, retinted to the
          // Material tokens). AG Grid v33+ defaults to the new Theming API and
          // throws error #239 when it also detects the legacy CSS. "legacy"
          // opts this grid back into CSS-file theming so our .ag-theme-quartz
          // overrides apply. See https://www.ag-grid.com/react-data-grid/theming/
          theme="legacy"
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          rowMultiSelectWithClick={true}
          pagination={true}
          paginationPageSize={100}
          paginationPageSizeSelector={[100, 250, 500]}
          domLayout="normal"
        />
      </div>
    </div>
  );
}
