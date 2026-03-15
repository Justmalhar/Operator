import Papa from "papaparse";
import { type BaseViewerProps, getFileExtension, useFileText } from "./viewer-utils";
import { TabularViewer } from "./TabularViewer";

function buildColumns(columnCount: number) {
  return Array.from({ length: columnCount }, (_, index) => `Column ${index + 1}`);
}

export function CsvViewer({ filePath, filename, className }: BaseViewerProps) {
  const { data, error, loading } = useFileText(filePath);

  if (loading) {
    return (
      <div
        className="flex h-full items-center justify-center text-sm"
        style={{ backgroundColor: "var(--vscode-editor-background)", color: "var(--vscode-descriptionForeground)" }}
      >
        Loading table preview...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="flex h-full items-center justify-center px-6 text-sm"
        style={{ backgroundColor: "var(--vscode-editor-background)", color: "var(--vscode-errorForeground)" }}
      >
        {error?.message ?? "Unable to load table preview."}
      </div>
    );
  }

  const delimiter = getFileExtension(filename) === "tsv" ? "\t" : undefined;
  const parsed = Papa.parse<string[]>(data, {
    delimiter,
    skipEmptyLines: false,
  });
  const rows = parsed.data.map((row: string[]) => row.map((cell: string) => `${cell ?? ""}`));
  const columnCount = Math.max(...rows.map((row) => row.length), 1);

  return (
    <TabularViewer
      className={className}
      columns={buildColumns(columnCount)}
      rows={rows}
      summary={`${rows.length} rows, ${columnCount} columns`}
    />
  );
}
