/** Directory entry (matches Rust commands::file::FileEntry). */
export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number | null;
  extension: string | null;
}
