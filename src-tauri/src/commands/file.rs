//! Tauri commands for file-system access.
//!
//! Exposes read/write/list operations used by the file-tree panel and editor.
//! Hidden files are shown (useful for dotfiles like .env, .eslintrc) except
//! the `.git/` directory itself, which is always filtered from directory listings.

use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::error::AppError;

// ── Types ─────────────────────────────────────────────────────────────────────

/// Metadata for a single file or directory entry.
#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    /// Basename of the entry (e.g. `"main.rs"`).
    pub name: String,
    /// Absolute path to the entry.
    pub path: String,
    /// `true` for directories, `false` for regular files.
    pub is_dir: bool,
    /// File size in bytes; `None` for directories.
    pub size: Option<u64>,
    /// Lowercase file extension without leading dot; `None` if absent.
    pub extension: Option<String>,
}

// ── Commands ──────────────────────────────────────────────────────────────────

/// Read a text file and return its contents as a UTF-8 string.
///
/// Returns an error if the file contains invalid UTF-8 (i.e. binary files).
#[tauri::command]
pub fn read_file(path: String) -> Result<String, AppError> {
    std::fs::read_to_string(&path).map_err(AppError::Io)
}

/// Write `content` to the file at `path`, creating it if necessary.
#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), AppError> {
    // Ensure parent directories exist.
    if let Some(parent) = Path::new(&path).parent() {
        std::fs::create_dir_all(parent).map_err(AppError::Io)?;
    }
    std::fs::write(&path, content).map_err(AppError::Io)
}

/// List the immediate children of a directory.
///
/// Entries are sorted: directories first (alphabetical), then files
/// (alphabetical).  The `.git` directory is excluded; all other hidden files
/// and directories are included.
#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<FileEntry>, AppError> {
    let dir = Path::new(&path);
    let read_dir = std::fs::read_dir(dir).map_err(AppError::Io)?;

    let mut dirs: Vec<FileEntry> = Vec::new();
    let mut files: Vec<FileEntry> = Vec::new();

    for entry in read_dir {
        let entry = entry.map_err(AppError::Io)?;
        let name = entry.file_name().to_string_lossy().into_owned();

        // Skip only the `.git` directory; keep all other hidden entries.
        if name == ".git" {
            continue;
        }

        let entry_path = entry.path();
        let abs_path = entry_path
            .to_str()
            .ok_or_else(|| AppError::msg("directory entry path contains non-UTF-8"))?
            .to_owned();

        let metadata = entry.metadata().map_err(AppError::Io)?;
        let is_dir = metadata.is_dir();

        let size = if is_dir { None } else { Some(metadata.len()) };

        let extension = if is_dir {
            None
        } else {
            entry_path
                .extension()
                .map(|e| e.to_string_lossy().to_lowercase())
        };

        let fe = FileEntry {
            name: name.clone(),
            path: abs_path,
            is_dir,
            size,
            extension,
        };

        if is_dir {
            dirs.push(fe);
        } else {
            files.push(fe);
        }
    }

    // Sort each group alphabetically (case-insensitive).
    dirs.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    dirs.extend(files);
    Ok(dirs)
}

/// Return `true` if the path exists (file or directory).
#[tauri::command]
pub fn file_exists(path: String) -> Result<bool, AppError> {
    Ok(Path::new(&path).exists())
}

/// Delete a file or empty directory at `path`.
///
/// For non-empty directories use the shell command instead.
#[tauri::command]
pub fn delete_file(path: String) -> Result<(), AppError> {
    let p = Path::new(&path);
    if p.is_dir() {
        std::fs::remove_dir_all(p).map_err(AppError::Io)
    } else {
        std::fs::remove_file(p).map_err(AppError::Io)
    }
}
