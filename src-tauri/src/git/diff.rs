//! Git diff utilities.
//!
//! Wraps `git2` diff operations into typed, frontend-friendly structures.

use std::path::Path;

use git2::{DiffOptions, Repository};
use serde::{Deserialize, Serialize};

use crate::error::AppError;

// ── Public types ─────────────────────────────────────────────────────────────

/// A single changed file entry in a diff.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffFileStat {
    pub path: String,
    pub old_path: Option<String>,
    /// "added" | "deleted" | "modified" | "renamed" | "copied" | "untracked"
    pub status: String,
    pub insertions: usize,
    pub deletions: usize,
}

/// Summary of a diff (file stats + optional full patch text).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffResult {
    pub files: Vec<DiffFileStat>,
    pub total_insertions: usize,
    pub total_deletions: usize,
    /// Full unified-diff patch, present when `with_patch = true`.
    pub patch: Option<String>,
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Working tree vs HEAD (unstaged + staged combined, like `git diff HEAD`).
pub fn working_tree_vs_head(
    repo_path: &Path,
    with_patch: bool,
) -> Result<DiffResult, AppError> {
    let repo = Repository::open(repo_path)?;

    // Use HEAD tree as baseline (handle unborn HEAD gracefully).
    let head_tree = repo
        .head()
        .ok()
        .and_then(|h| h.peel_to_tree().ok());

    let mut opts = DiffOptions::new();
    opts.include_untracked(true)
        .recurse_untracked_dirs(true)
        .ignore_submodules(true);

    let diff = repo.diff_tree_to_workdir_with_index(
        head_tree.as_ref(),
        Some(&mut opts),
    )?;

    build_result(diff, with_patch)
}

/// Staged changes only (index vs HEAD, like `git diff --staged`).
pub fn staged_vs_head(repo_path: &Path, with_patch: bool) -> Result<DiffResult, AppError> {
    let repo = Repository::open(repo_path)?;

    let head_tree = repo
        .head()
        .ok()
        .and_then(|h| h.peel_to_tree().ok());

    let diff = repo.diff_tree_to_index(head_tree.as_ref(), None, None)?;

    build_result(diff, with_patch)
}

/// Unstaged changes only (working tree vs index, like `git diff`).
pub fn unstaged_vs_index(repo_path: &Path, with_patch: bool) -> Result<DiffResult, AppError> {
    let repo = Repository::open(repo_path)?;
    let diff = repo.diff_index_to_workdir(None, None)?;
    build_result(diff, with_patch)
}

/// Diff between two commits/branches (like `git diff <a>..<b>`).
///
/// `a` and `b` are revision strings (sha, branch name, tag, etc.).
pub fn between_revs(
    repo_path: &Path,
    rev_a: &str,
    rev_b: &str,
    with_patch: bool,
) -> Result<DiffResult, AppError> {
    let repo = Repository::open(repo_path)?;

    let tree_a = repo.revparse_single(rev_a)?.peel_to_tree()?;
    let tree_b = repo.revparse_single(rev_b)?.peel_to_tree()?;

    let diff = repo.diff_tree_to_tree(Some(&tree_a), Some(&tree_b), None)?;
    build_result(diff, with_patch)
}

/// Patch for a single file path relative to the worktree root.
/// Shows working-tree vs HEAD for that file only.
pub fn file_diff(repo_path: &Path, file_path: &str) -> Result<String, AppError> {
    let repo = Repository::open(repo_path)?;

    let head_tree = repo
        .head()
        .ok()
        .and_then(|h| h.peel_to_tree().ok());

    let mut opts = DiffOptions::new();
    opts.pathspec(file_path);

    let diff =
        repo.diff_tree_to_workdir_with_index(head_tree.as_ref(), Some(&mut opts))?;

    patch_string(&diff)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn build_result(diff: git2::Diff<'_>, with_patch: bool) -> Result<DiffResult, AppError> {
    let stats = diff.stats()?;
    let total_insertions = stats.insertions();
    let total_deletions = stats.deletions();

    let mut files = Vec::new();
    diff.foreach(
        &mut |delta, _| {
            let status = delta_status_str(delta.status());
            let path = delta
                .new_file()
                .path()
                .map(|p| p.to_string_lossy().into_owned())
                .unwrap_or_default();
            let old_path = delta
                .old_file()
                .path()
                .map(|p| p.to_string_lossy().into_owned())
                .filter(|p| *p != path);

            files.push(DiffFileStat {
                path,
                old_path,
                status,
                insertions: 0, // filled below
                deletions: 0,
            });
            true
        },
        None,
        None,
        None,
    )?;

    // Get per-file line counts via diff stats iteration.
    if let Ok(stats_buf) = diff.stats()?.to_buf(git2::DiffStatsFormat::FULL, 80) {
        // stats_buf is a text summary; per-file counts come from the delta/hunk callbacks.
        // For simplicity we'll populate via a second pass using diff.print.
        let _ = stats_buf; // suppress unused warning
    }

    // Second pass: count per-file insertions/deletions.
    {
        let mut idx = 0usize;
        let _ = diff.foreach(
            &mut |_, _| {
                idx += 1;
                true
            },
            None,
            None,
            Some(&mut |delta, _, line| {
                let path = delta
                    .new_file()
                    .path()
                    .map(|p| p.to_string_lossy().into_owned())
                    .unwrap_or_default();
                if let Some(f) = files.iter_mut().find(|f| f.path == path) {
                    match line.origin() {
                        '+' => f.insertions += 1,
                        '-' => f.deletions += 1,
                        _ => {}
                    }
                }
                true
            }),
        );
    }

    let patch = if with_patch { Some(patch_string(&diff)?) } else { None };

    Ok(DiffResult {
        files,
        total_insertions,
        total_deletions,
        patch,
    })
}

fn patch_string(diff: &git2::Diff<'_>) -> Result<String, AppError> {
    let mut out = Vec::new();
    diff.print(git2::DiffFormat::Patch, |_, _, line| {
        out.extend_from_slice(line.content());
        true
    })?;
    String::from_utf8(out).map_err(|_| AppError::msg("diff contains non-UTF-8 bytes"))
}

fn delta_status_str(status: git2::Delta) -> String {
    match status {
        git2::Delta::Added => "added",
        git2::Delta::Deleted => "deleted",
        git2::Delta::Modified => "modified",
        git2::Delta::Renamed => "renamed",
        git2::Delta::Copied => "copied",
        git2::Delta::Untracked => "untracked",
        git2::Delta::Ignored => "ignored",
        git2::Delta::Conflicted => "conflicted",
        _ => "unknown",
    }
    .to_owned()
}
