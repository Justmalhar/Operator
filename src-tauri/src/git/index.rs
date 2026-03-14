//! Git index (staging area) operations and working-tree status.
//!
//! Provides typed wrappers around `git2` status and index operations that
//! mirror the behaviour of common porcelain commands:
//!   `git status`, `git add`, `git restore --staged`, `git checkout --`.

use std::path::Path;

use git2::{IndexAddOption, Repository, ResetType, StatusOptions, StatusShow};
use serde::{Deserialize, Serialize};

use crate::error::AppError;

// ── Public types ─────────────────────────────────────────────────────────────

/// Per-file status entry from `git status`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileStatus {
    /// Repository-relative path of the file.
    pub path: String,
    /// File has staged changes (index differs from HEAD).
    pub staged: bool,
    /// File has unstaged changes (working tree differs from index).
    pub unstaged: bool,
    /// File is untracked.
    pub untracked: bool,
    /// File is in a conflicted state.
    pub conflicted: bool,
    /// Two-letter porcelain v1 status code, e.g. "M ", " M", "??", "UU".
    pub xy: String,
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Return the working-tree status for every tracked / untracked file.
///
/// Equivalent to `git status --porcelain`.
pub fn status(repo_path: &Path) -> Result<Vec<FileStatus>, AppError> {
    let repo = Repository::open(repo_path)?;

    let mut opts = StatusOptions::new();
    opts.show(StatusShow::IndexAndWorkdir)
        .include_untracked(true)
        .recurse_untracked_dirs(true)
        .include_ignored(false)
        .renames_head_to_index(true)
        .renames_index_to_workdir(true);

    let statuses = repo.statuses(Some(&mut opts))?;

    let mut result = Vec::with_capacity(statuses.len());

    for entry in statuses.iter() {
        let s = entry.status();
        let path = entry
            .path()
            .unwrap_or("")
            .to_owned();

        let staged = s.intersects(
            git2::Status::INDEX_NEW
                | git2::Status::INDEX_MODIFIED
                | git2::Status::INDEX_DELETED
                | git2::Status::INDEX_RENAMED
                | git2::Status::INDEX_TYPECHANGE,
        );
        let unstaged = s.intersects(
            git2::Status::WT_MODIFIED
                | git2::Status::WT_DELETED
                | git2::Status::WT_TYPECHANGE
                | git2::Status::WT_RENAMED,
        );
        let untracked = s.contains(git2::Status::WT_NEW);
        let conflicted = s.contains(git2::Status::CONFLICTED);

        let xy = status_to_xy(s);

        result.push(FileStatus {
            path,
            staged,
            unstaged,
            untracked,
            conflicted,
            xy,
        });
    }

    Ok(result)
}

/// Stage specific paths — equivalent to `git add <paths...>`.
///
/// Handles deleted files by removing the index entry rather than trying to
/// add a non-existent file.
pub fn stage(repo_path: &Path, paths: &[&str]) -> Result<(), AppError> {
    let repo = Repository::open(repo_path)?;
    let mut index = repo.index()?;

    for path in paths {
        let abs = repo_path.join(path);
        if abs.exists() {
            index.add_path(Path::new(path))?;
        } else {
            // File was deleted — stage the removal.
            index.remove_path(Path::new(path))?;
        }
    }

    index.write()?;
    Ok(())
}

/// Stage all changes — equivalent to `git add -A`.
pub fn stage_all(repo_path: &Path) -> Result<(), AppError> {
    let repo = Repository::open(repo_path)?;
    let mut index = repo.index()?;

    index.add_all(
        ["*"].iter(),
        IndexAddOption::DEFAULT | IndexAddOption::FORCE,
        None,
    )?;
    index.write()?;
    Ok(())
}

/// Unstage specific paths — equivalent to `git restore --staged <paths...>`.
///
/// For files already known to HEAD the index entry is reset to the HEAD blob.
/// For brand-new files (not in HEAD) the entry is simply removed from the
/// index, leaving the file as untracked.
pub fn unstage(repo_path: &Path, paths: &[&str]) -> Result<(), AppError> {
    let repo = Repository::open(repo_path)?;

    // Attempt to resolve HEAD; may fail on a freshly-initialised repo.
    let head_commit = repo.head().ok().and_then(|h| h.peel_to_commit().ok());

    let mut index = repo.index()?;

    match head_commit {
        Some(commit) => {
            let tree = commit.tree()?;

            for path in paths {
                let p = Path::new(path);
                match tree.get_path(p) {
                    Ok(_) => {
                        // Path exists in HEAD — reset the index entry.
                        // We do this by performing a mixed reset scoped to the
                        // individual path using Repository::reset_default which
                        // takes pathspecs.
                        // reset_default resets index entries to match the tree
                        // associated with the given object (HEAD commit here).
                        repo.reset_default(
                            Some(commit.as_object()),
                            std::iter::once(path),
                        )?;
                    }
                    Err(_) => {
                        // New file added but not in HEAD — just remove from index.
                        index.remove_path(p)?;
                        index.write()?;
                    }
                }
            }
        }
        None => {
            // Unborn branch — nothing in HEAD, so just remove all paths.
            for path in paths {
                index.remove_path(Path::new(path))?;
            }
            index.write()?;
        }
    }

    Ok(())
}

/// Discard working-tree changes for a single file — equivalent to
/// `git restore <path>` (or the older `git checkout -- <path>`).
///
/// Restores the file to the version recorded in the index.  If the file is
/// untracked this is a no-op.
pub fn discard(repo_path: &Path, path: &str) -> Result<(), AppError> {
    let repo = Repository::open(repo_path)?;

    let head = repo
        .head()
        .map_err(|_| AppError::msg("repository has no HEAD — cannot discard"))?;
    let head_commit = head
        .peel_to_commit()
        .map_err(|e| AppError::msg(format!("HEAD is not a commit: {e}")))?;

    // Build CheckoutBuilder scoped to the single path.
    let mut checkout = git2::build::CheckoutBuilder::new();
    checkout
        .path(path)
        .force()
        .remove_untracked(false)
        .update_index(true);

    repo.reset(
        head_commit.as_object(),
        ResetType::Mixed,
        Some(&mut checkout),
    )?;

    Ok(())
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Convert a `git2::Status` bitfield to a two-character porcelain v1 XY code.
///
/// X = index (staged), Y = working tree (unstaged).
fn status_to_xy(s: git2::Status) -> String {
    let x = if s.contains(git2::Status::INDEX_NEW) {
        'A'
    } else if s.contains(git2::Status::INDEX_MODIFIED) {
        'M'
    } else if s.contains(git2::Status::INDEX_DELETED) {
        'D'
    } else if s.contains(git2::Status::INDEX_RENAMED) {
        'R'
    } else if s.contains(git2::Status::INDEX_TYPECHANGE) {
        'T'
    } else {
        ' '
    };

    let y = if s.contains(git2::Status::WT_NEW) {
        '?'
    } else if s.contains(git2::Status::WT_MODIFIED) {
        'M'
    } else if s.contains(git2::Status::WT_DELETED) {
        'D'
    } else if s.contains(git2::Status::WT_RENAMED) {
        'R'
    } else if s.contains(git2::Status::WT_TYPECHANGE) {
        'T'
    } else if s.contains(git2::Status::CONFLICTED) {
        'U'
    } else {
        ' '
    };

    // Untracked files use "??" in porcelain format.
    if x == ' ' && y == '?' {
        return "??".to_owned();
    }

    format!("{x}{y}")
}
