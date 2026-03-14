//! Git worktree management.
//!
//! Uses `git2` for read-only queries (list, info) and falls back to invoking
//! the system `git` binary for the write operations (`add` / `remove`) because
//! libgit2's worktree-add API requires careful lifetime juggling around
//! `WorktreeAddOptions::reference()` that is better avoided in practice.

use std::path::{Path, PathBuf};

use git2::Repository;
use serde::{Deserialize, Serialize};

use crate::error::AppError;

// ── Public types ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeInfo {
    pub name: String,
    pub path: PathBuf,
    pub branch: Option<String>,
    pub head_sha: Option<String>,
    pub is_locked: bool,
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Create a linked worktree at `worktree_path` checked out to `branch_name`.
///
/// If `branch_name` does not exist it is created from `base_branch`.
/// Uses `git worktree add` under the hood for reliability.
pub fn create(
    repo_path: &Path,
    worktree_path: &Path,
    branch_name: &str,
    base_branch: &str,
) -> Result<WorktreeInfo, AppError> {
    // Determine whether the branch already exists.
    let repo = Repository::open(repo_path)?;
    let branch_exists = repo
        .find_branch(branch_name, git2::BranchType::Local)
        .is_ok();

    // Build git worktree add args.
    //   existing branch  →  git worktree add <path> <branch>
    //   new branch       →  git worktree add -b <branch> <path> <base>
    let worktree_path_str = worktree_path
        .to_str()
        .ok_or_else(|| AppError::msg("worktree path is not valid UTF-8"))?;

    let status = if branch_exists {
        std::process::Command::new("git")
            .args(["worktree", "add", worktree_path_str, branch_name])
            .current_dir(repo_path)
            .status()
            .map_err(AppError::Io)?
    } else {
        std::process::Command::new("git")
            .args([
                "worktree",
                "add",
                "-b",
                branch_name,
                worktree_path_str,
                base_branch,
            ])
            .current_dir(repo_path)
            .status()
            .map_err(AppError::Io)?
    };

    if !status.success() {
        return Err(AppError::msg(format!(
            "git worktree add failed (exit {})",
            status.code().unwrap_or(-1)
        )));
    }

    // Read back the resulting info from the newly created worktree.
    let wt_repo = Repository::open(worktree_path)?;
    let head_sha = wt_repo
        .head()
        .ok()
        .and_then(|h| h.target())
        .map(|o| o.to_string());

    // Derive worktree name from its path basename.
    let name = worktree_path
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_else(|| branch_name.to_owned());

    tracing::info!(name, branch = branch_name, path = %worktree_path.display(), "worktree created");

    Ok(WorktreeInfo {
        name,
        path: worktree_path.to_owned(),
        branch: Some(branch_name.to_owned()),
        head_sha,
        is_locked: false,
    })
}

/// Remove a linked worktree and delete its on-disk directory.
///
/// Equivalent to `git worktree remove --force <name>`.
pub fn remove(repo_path: &Path, worktree_path: &Path) -> Result<(), AppError> {
    let worktree_path_str = worktree_path
        .to_str()
        .ok_or_else(|| AppError::msg("worktree path is not valid UTF-8"))?;

    let status = std::process::Command::new("git")
        .args(["worktree", "remove", "--force", worktree_path_str])
        .current_dir(repo_path)
        .status()
        .map_err(AppError::Io)?;

    if !status.success() {
        // Fallback: prune admin + manual rm
        let _ = std::process::Command::new("git")
            .args(["worktree", "prune"])
            .current_dir(repo_path)
            .status();

        if worktree_path.exists() {
            std::fs::remove_dir_all(worktree_path).map_err(AppError::Io)?;
        }
    }

    tracing::info!(path = %worktree_path.display(), "worktree removed");
    Ok(())
}

/// List all linked worktrees of the repository (excludes the main worktree).
pub fn list(repo_path: &Path) -> Result<Vec<WorktreeInfo>, AppError> {
    let repo = Repository::open(repo_path)?;
    let names = repo.worktrees()?;

    let mut result = Vec::new();
    for name in names.iter().flatten() {
        if let Ok(wt) = repo.find_worktree(name) {
            let wt_path = wt.path().to_owned();
            let (head_sha, branch) = read_wt_head(&wt_path);
            result.push(WorktreeInfo {
                name: name.to_owned(),
                path: wt_path,
                branch,
                head_sha,
                is_locked: wt.is_locked().map(|s| s != git2::WorktreeLockStatus::Unlocked).unwrap_or(false),
            });
        }
    }

    Ok(result)
}

/// Return info for a single worktree by its on-disk path.
pub fn info(worktree_path: &Path) -> Result<WorktreeInfo, AppError> {
    let (head_sha, branch) = read_wt_head(worktree_path);
    let name = worktree_path
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();

    Ok(WorktreeInfo {
        name,
        path: worktree_path.to_owned(),
        branch,
        head_sha,
        is_locked: false,
    })
}

/// Delete `branch_name` from the repository (must not be currently checked out).
pub fn delete_branch(repo_path: &Path, branch_name: &str) -> Result<(), AppError> {
    let repo = Repository::open(repo_path)?;
    let mut branch = repo
        .find_branch(branch_name, git2::BranchType::Local)
        .map_err(|_| AppError::msg(format!("branch not found: {branch_name}")))?;
    branch.delete()?;
    Ok(())
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn read_wt_head(path: &Path) -> (Option<String>, Option<String>) {
    match Repository::open(path) {
        Ok(r) => {
            let sha = r.head().ok().and_then(|h| h.target()).map(|o| o.to_string());
            let branch = r
                .head()
                .ok()
                .filter(|h| h.is_branch())
                .and_then(|h| h.shorthand().map(|s| s.to_owned()));
            (sha, branch)
        }
        Err(_) => (None, None),
    }
}
