import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { type BaseViewerProps, useFileArrayBuffer } from "./viewer-utils";
import { TabularViewer } from "./TabularViewer";

function buildColumns(columnCount: number) {
  return Array.from({ length: columnCount }, (_, index) => XLSX.utils.encode_col(index));
}

export function XlsxViewer({ filePath, filename, className }: BaseViewerProps) {
  const { data, error, loading } = useFileArrayBuffer(filePath);

  const workbook = useMemo(() => {
    if (!data) {
      return null;
    }

    return XLSX.read(data, { type: "array" });
  }, [data]);

  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const sheetNames = workbook?.SheetNames ?? [];
  const selectedSheetName = activeSheet && sheetNames.includes(activeSheet) ? activeSheet : sheetNames[0] ?? null;
  const sheet = selectedSheetName ? workbook?.Sheets[selectedSheetName] : null;

  const rows = useMemo(() => {
    if (!sheet) {
      return [];
    }

    return XLSX.utils
      .sheet_to_json<(string | number | boolean | null)[]>(sheet, {
        header: 1,
        blankrows: true,
        defval: "",
        raw: false,
      })
      .map((row) => row.map((cell) => `${cell ?? ""}`));
  }, [sheet]);

  const columnCount = Math.max(...rows.map((row) => row.length), 1);

  if (loading) {
    return (
      <div
        className="flex h-full items-center justify-center text-sm"
        style={{ backgroundColor: "var(--vscode-editor-background)", color: "var(--vscode-descriptionForeground)" }}
      >
        Loading workbook...
      </div>
    );
  }

  if (error || !workbook) {
    return (
      <div
        className="flex h-full items-center justify-center px-6 text-sm"
        style={{ backgroundColor: "var(--vscode-editor-background)", color: "var(--vscode-errorForeground)" }}
      >
        {error?.message ?? "Unable to load workbook."}
      </div>
    );
  }

  return (
    <div
      className={cn("flex h-full min-h-0 flex-col", className)}
      style={{ backgroundColor: "var(--vscode-editor-background)" }}
    >
      <div
        className="flex items-center gap-2 overflow-x-auto px-4 py-2"
        style={{
          backgroundColor: "var(--vscode-viewer-header-background)",
          borderBottom: "1px solid var(--vscode-panel-border)",
        }}
      >
        <span
          className="mr-2 text-xs uppercase tracking-[0.08em]"
          style={{ color: "var(--vscode-descriptionForeground)" }}
        >
          {filename}
        </span>
        {sheetNames.map((sheetName) => {
          const isActive = sheetName === selectedSheetName;
          return (
            <button
              key={sheetName}
              className="rounded-md border px-3 py-1 text-xs transition-colors theme-hover-bg"
              style={isActive
                ? { borderColor: "var(--vscode-focus-border)", backgroundColor: "var(--vscode-button-background)", color: "var(--vscode-button-foreground, #ffffff)" }
                : { borderColor: "var(--vscode-panel-border)", color: "var(--vscode-input-foreground)" }
              }
              type="button"
              onClick={() => setActiveSheet(sheetName)}
            >
              {sheetName}
            </button>
          );
        })}
      </div>
      <TabularViewer
        columns={buildColumns(columnCount)}
        rows={rows}
        summary={`${selectedSheetName ?? "Sheet"} · ${rows.length} rows, ${columnCount} columns`}
      />
    </div>
  );
}
