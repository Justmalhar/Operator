/** Per-file status from git status (matches Rust git::index::FileStatus). */
export interface FileStatus {
  path: string;
  staged: boolean;
  unstaged: boolean;
  untracked: boolean;
  conflicted: boolean;
  xy: string;
}

/** Single file in a diff result (matches Rust git::diff::DiffFileStat). */
export interface DiffFileStat {
  path: string;
  old_path: string | null;
  status: "added" | "deleted" | "modified" | "renamed" | "copied" | "untracked" | "ignored" | "conflicted" | "unknown";
  insertions: number;
  deletions: number;
}

/** Full diff result (matches Rust git::diff::DiffResult). */
export interface DiffResult {
  files: DiffFileStat[];
  total_insertions: number;
  total_deletions: number;
  patch: string | null;
}

/** Compact commit record (matches Rust commands::git::CommitInfo). */
export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
}
