//! Tauri commands that expose git operations to the frontend.
//!
//! All commands are synchronous (non-async) because git2 is not async-native
//! and the operations are fast enough to not block the Tauri thread pool
//! meaningfully.  Heavy operations (push) use `std::process::Command`.

use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::{error::AppError, git};

// ── Supporting types ─────────────────────────────────────────────────────────

/// Compact commit record returned by `get_git_log`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitInfo {
    pub sha: String,
    pub message: String,
    pub author: String,
    pub timestamp: String,
}

// ── Status / diff ─────────────────────────────────────────────────────────────

/// Return the full working-tree status (equivalent to `git status --porcelain`).
#[tauri::command]
pub fn get_git_status(
    repo_path: String,
) -> Result<Vec<git::index::FileStatus>, AppError> {
    git::index::status(Path::new(&repo_path))
}

/// Return a diff of the working tree vs HEAD (staged + unstaged combined).
#[tauri::command]
pub fn get_git_diff(
    repo_path: String,
    with_patch: bool,
) -> Result<git::diff::DiffResult, AppError> {
    git::diff::working_tree_vs_head(Path::new(&repo_path), with_patch)
}

/// Return only staged changes (index vs HEAD, equivalent to `git diff --staged`).
#[tauri::command]
pub fn get_staged_diff(repo_path: String) -> Result<git::diff::DiffResult, AppError> {
    git::diff::staged_vs_head(Path::new(&repo_path), true)
}

/// Return the diff between two revision strings (sha, branch, tag, etc.).
#[tauri::command]
pub fn get_diff_between_revs(
    repo_path: String,
    rev_a: String,
    rev_b: String,
) -> Result<git::diff::DiffResult, AppError> {
    git::diff::between_revs(Path::new(&repo_path), &rev_a, &rev_b, true)
}

/// Return the unified-diff patch for a single file (working tree vs HEAD).
#[tauri::command]
pub fn get_file_diff(repo_path: String, file_path: String) -> Result<String, AppError> {
    git::diff::file_diff(Path::new(&repo_path), &file_path)
}

// ── Log ───────────────────────────────────────────────────────────────────────

/// Return the commit history for the repository.
///
/// `limit` defaults to 50 when not provided.
#[tauri::command]
pub fn get_git_log(
    repo_path: String,
    limit: Option<usize>,
) -> Result<Vec<CommitInfo>, AppError> {
    let max = limit.unwrap_or(50);
    let repo = git2::Repository::open(&repo_path)?;

    let head = match repo.head() {
        Ok(h) => h,
        // Unborn branch — no commits yet.
        Err(_) => return Ok(vec![]),
    };

    let mut commit = head.peel_to_commit()?;
    let mut commits = Vec::with_capacity(max);

    loop {
        // Collect all data while `commit` is still owned; author() borrows it.
        let sha = commit.id().to_string();
        let message = commit
            .message()
            .unwrap_or("")
            .lines()
            .next()
            .unwrap_or("")
            .to_owned();

        let (author, timestamp) = {
            let sig = commit.author();
            let name = sig.name().unwrap_or("unknown").to_owned();
            let email = sig.email().unwrap_or("").to_owned();
            let ts = chrono::DateTime::from_timestamp(sig.when().seconds(), 0)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default();
            (format!("{name} <{email}>"), ts)
        };

        commits.push(CommitInfo {
            sha,
            message,
            author,
            timestamp,
        });

        if commits.len() >= max {
            break;
        }

        // Walk to the first parent (follow main line).
        match commit.parent(0) {
            Ok(parent) => commit = parent,
            Err(_) => break,
        }
    }

    Ok(commits)
}

/// Return the short name of the currently checked-out branch.
#[tauri::command]
pub fn get_current_branch(repo_path: String) -> Result<String, AppError> {
    let repo = git2::Repository::open(&repo_path)?;
    let head = repo.head()?;
    let name = head
        .shorthand()
        .ok_or_else(|| AppError::msg("HEAD has no short name (detached?)"))?
        .to_owned();
    Ok(name)
}

// ── Index operations ──────────────────────────────────────────────────────────

/// Stage specific file paths (equivalent to `git add <paths>`).
#[tauri::command]
pub fn git_stage(repo_path: String, paths: Vec<String>) -> Result<(), AppError> {
    let refs: Vec<&str> = paths.iter().map(|s| s.as_str()).collect();
    git::index::stage(Path::new(&repo_path), &refs)
}

/// Unstage specific file paths (equivalent to `git restore --staged <paths>`).
#[tauri::command]
pub fn git_unstage(repo_path: String, paths: Vec<String>) -> Result<(), AppError> {
    let refs: Vec<&str> = paths.iter().map(|s| s.as_str()).collect();
    git::index::unstage(Path::new(&repo_path), &refs)
}

/// Discard working-tree changes for a single file (equivalent to `git restore <path>`).
#[tauri::command]
pub fn git_discard(repo_path: String, path: String) -> Result<(), AppError> {
    git::index::discard(Path::new(&repo_path), &path)
}

// ── Commit ────────────────────────────────────────────────────────────────────

/// Create a commit from the current index with `message`.
///
/// Returns the full SHA of the created commit.
/// Uses the user's configured git author name/email from the repo config.
#[tauri::command]
pub fn git_commit(repo_path: String, message: String) -> Result<String, AppError> {
    let repo = git2::Repository::open(&repo_path)?;

    // Resolve author from git config (falls back to generic values).
    let config = repo.config()?;
    let author_name = config
        .get_string("user.name")
        .unwrap_or_else(|_| "Operator".to_owned());
    let author_email = config
        .get_string("user.email")
        .unwrap_or_else(|_| "operator@local".to_owned());

    let sig = git2::Signature::now(&author_name, &author_email)?;

    let mut index = repo.index()?;
    let tree_oid = index.write_tree()?;
    let tree = repo.find_tree(tree_oid)?;

    // Determine parent commits.
    let parents: Vec<git2::Commit<'_>> = match repo.head() {
        Ok(head) => vec![head.peel_to_commit()?],
        Err(_) => vec![], // initial commit
    };
    let parent_refs: Vec<&git2::Commit<'_>> = parents.iter().collect();

    let oid = repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &message,
        &tree,
        &parent_refs,
    )?;

    Ok(oid.to_string())
}

// ── Push ──────────────────────────────────────────────────────────────────────

/// Push the current branch to a remote using the system `git` binary.
///
/// Defaults: remote = `"origin"`, branch = current HEAD branch.
#[tauri::command]
pub fn git_push(
    repo_path: String,
    remote: Option<String>,
    branch: Option<String>,
) -> Result<(), AppError> {
    let remote_name = remote.unwrap_or_else(|| "origin".to_owned());

    // Resolve branch name when not explicitly provided.
    let branch_name = match branch {
        Some(b) => b,
        None => get_current_branch(repo_path.clone())?,
    };

    let output = std::process::Command::new("git")
        .args(["push", &remote_name, &branch_name])
        .current_dir(&repo_path)
        .output()
        .map_err(|e| AppError::Io(e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::msg(format!("git push failed: {stderr}")));
    }

    Ok(())
}
