import { useEffect, useMemo, useState } from "react";
import { convertFileSrc, invoke, isTauri } from "@tauri-apps/api/core";

export type ViewerKind =
  | "code"
  | "markdown"
  | "image"
  | "csv"
  | "xlsx"
  | "pdf"
  | "docx"
  | "ppt"
  | "web"
  | "binary";

export interface BaseViewerProps {
  filePath: string;
  filename: string;
  className?: string;
}

export interface ViewerDefinition {
  kind: ViewerKind;
  label: string;
  description: string;
  extensions: string[];
}

interface AsyncFileState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

const VIEWERS: ViewerDefinition[] = [
  {
    kind: "markdown",
    label: "Markdown Preview",
    description: "Rendered markdown with GitHub-flavored tables and code blocks.",
    extensions: ["md", "mdx", "markdown"],
  },
  {
    kind: "image",
    label: "Image Preview",
    description: "Pixel-accurate image preview with dark canvas framing.",
    extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "bmp", "avif"],
  },
  {
    kind: "csv",
    label: "CSV Preview",
    description: "Virtualized table preview for delimited flat files.",
    extensions: ["csv", "tsv"],
  },
  {
    kind: "xlsx",
    label: "Spreadsheet Preview",
    description: "Sheet-aware workbook preview for Excel-compatible files.",
    extensions: ["xlsx", "xls", "xlsm", "xlsb", "ods"],
  },
  {
    kind: "pdf",
    label: "PDF Preview",
    description: "Canvas-rendered, scrollable PDF preview.",
    extensions: ["pdf"],
  },
  {
    kind: "docx",
    label: "Document Preview",
    description: "Structured Word document preview.",
    extensions: ["docx"],
  },
  {
    kind: "ppt",
    label: "Slide Preview",
    description: "Slide-by-slide PowerPoint deck preview.",
    extensions: ["pptx", "ppsx", "potx"],
  },
  {
    kind: "web",
    label: "Web Preview",
    description: "Embedded HTML preview in an isolated frame.",
    extensions: ["html", "htm"],
  },
  {
    kind: "code",
    label: "Code Preview",
    description: "Read-only editor surface for source and plain-text files.",
    extensions: [],
  },
];

const TEXT_EXTENSIONS = new Set([
  "c",
  "cc",
  "cpp",
  "css",
  "go",
  "graphql",
  "h",
  "hpp",
  "html",
  "java",
  "js",
  "json",
  "jsx",
  "md",
  "mdx",
  "markdown",
  "mjs",
  "php",
  "py",
  "rb",
  "rs",
  "scss",
  "sh",
  "sql",
  "svg",
  "toml",
  "ts",
  "tsx",
  "txt",
  "xml",
  "yaml",
  "yml",
  "zsh",
]);

const textCache = new Map<string, Promise<string>>();
const arrayBufferCache = new Map<string, Promise<ArrayBuffer>>();

function getSourceUrl(filePath: string) {
  if (
    filePath.startsWith("blob:") ||
    filePath.startsWith("data:") ||
    filePath.startsWith("http://") ||
    filePath.startsWith("https://") ||
    filePath.startsWith("/assets/")
  ) {
    return filePath;
  }

  return isTauri() ? convertFileSrc(filePath) : filePath;
}

async function fetchText(filePath: string) {
  // Use Tauri's read_file command directly for local paths — more reliable
  // than the asset protocol which requires scope configuration.
  if (
    isTauri() &&
    !filePath.startsWith("blob:") &&
    !filePath.startsWith("data:") &&
    !filePath.startsWith("http://") &&
    !filePath.startsWith("https://") &&
    !filePath.startsWith("/assets/")
  ) {
    return invoke<string>("read_file", { path: filePath });
  }

  const response = await fetch(getSourceUrl(filePath));
  if (!response.ok) {
    throw new Error(`Unable to load ${filePath}`);
  }

  return response.text();
}

async function fetchArrayBuffer(filePath: string) {
  // Use Tauri's read_file_bytes command for local paths to get binary data.
  if (
    isTauri() &&
    !filePath.startsWith("blob:") &&
    !filePath.startsWith("data:") &&
    !filePath.startsWith("http://") &&
    !filePath.startsWith("https://") &&
    !filePath.startsWith("/assets/")
  ) {
    const bytes = await invoke<number[]>("read_file_bytes", { path: filePath });
    return new Uint8Array(bytes).buffer;
  }

  const response = await fetch(getSourceUrl(filePath));
  if (!response.ok) {
    throw new Error(`Unable to load ${filePath}`);
  }

  return response.arrayBuffer();
}

function useAsyncFile<T>(key: string, loader: () => Promise<T>): AsyncFileState<T> {
  const [state, setState] = useState<AsyncFileState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    setState({
      data: null,
      error: null,
      loading: true,
    });

    loader()
      .then((data) => {
        if (!cancelled) {
          setState({
            data,
            error: null,
            loading: false,
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error : new Error("Failed to load file."),
            loading: false,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, loader]);

  return state;
}

export function useFileText(filePath: string) {
  const loader = useMemo(
    () => () => {
      let pending = textCache.get(filePath);
      if (!pending) {
        pending = fetchText(filePath);
        textCache.set(filePath, pending);
      }
      return pending;
    },
    [filePath],
  );

  return useAsyncFile(filePath, loader);
}

export function useFileArrayBuffer(filePath: string) {
  const loader = useMemo(
    () => () => {
      let pending = arrayBufferCache.get(filePath);
      if (!pending) {
        pending = fetchArrayBuffer(filePath);
        arrayBufferCache.set(filePath, pending);
      }
      return pending;
    },
    [filePath],
  );

  return useAsyncFile(filePath, loader);
}

export function useFileObjectUrl(filePath: string) {
  const [state, setState] = useState<AsyncFileState<string>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    setState({
      data: null,
      error: null,
      loading: true,
    });

    const fetchBlob = async (): Promise<Blob> => {
      if (
        isTauri() &&
        !filePath.startsWith("blob:") &&
        !filePath.startsWith("data:") &&
        !filePath.startsWith("http://") &&
        !filePath.startsWith("https://") &&
        !filePath.startsWith("/assets/")
      ) {
        const bytes = await invoke<number[]>("read_file_bytes", { path: filePath });
        return new Blob([new Uint8Array(bytes)]);
      }
      const response = await fetch(getSourceUrl(filePath));
      if (!response.ok) throw new Error(`Unable to load ${filePath}`);
      return response.blob();
    };

    fetchBlob()
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setState({
            data: objectUrl,
            error: null,
            loading: false,
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error : new Error("Failed to load file."),
            loading: false,
          });
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [filePath]);

  return state;
}

export function getFileExtension(filename: string) {
  const lastSegment = filename.split("/").pop() ?? filename;
  const lastDotIndex = lastSegment.lastIndexOf(".");
  if (lastDotIndex < 0) {
    return "";
  }

  return lastSegment.slice(lastDotIndex + 1).toLowerCase();
}

export function getViewerKind(filename: string): ViewerKind {
  const extension = getFileExtension(filename);

  const matched = VIEWERS.find((viewer) => viewer.extensions.includes(extension));
  if (matched) {
    return matched.kind;
  }

  if (TEXT_EXTENSIONS.has(extension) || extension === "") {
    return "code";
  }

  return "binary";
}

export function getViewerDefinition(filename: string) {
  const kind = getViewerKind(filename);
  return VIEWERS.find((viewer) => viewer.kind === kind) ?? VIEWERS[VIEWERS.length - 1];
}

export function getViewerLabel(filename: string) {
  return getViewerDefinition(filename).label;
}

export function getFileSourceUrl(filePath: string) {
  return getSourceUrl(filePath);
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;
  return `${value.toFixed(value >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function isTextLikeFile(filename: string) {
  return getViewerKind(filename) === "code" || getViewerKind(filename) === "markdown";
}

export const supportedViewerKinds = VIEWERS;
