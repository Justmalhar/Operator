//! Git checkpoint engine — native Rust port of `docs/references/checkpointer.sh`
//! and `docs/references/git-busy-check.sh`.
//!
//! # Overview
//!
//! A *checkpoint* is a lightweight orphan commit (no parents) stored at a
//! private ref `refs/operator/checkpoints/<id>`.  The commit's tree is a full
//! snapshot of the working tree (tracked + untracked files, honoring
//! `.gitignore`).  Additional metadata — the saved HEAD OID, the staged-only
//! tree, and a timestamp — are encoded in the commit message so the ref
//! itself carries everything needed for restore and diff without touching the
//! SQLite database.
//!
//! # Invariants
//! - `save` never moves HEAD, never changes files on disk, never alters the
//!   on-disk index (it restores the index after the snapshot write).
//! - `restore` performs a hard reset to the saved HEAD and then checks out
//!   the worktree snapshot.  Extra untracked files not present in the snapshot
//!   are deleted (mirrors `git clean -fd`).
//! - `diff` is read-only; building a "current" snapshot follows the same
//!   index-expand/restore cycle as `save` but discards the result.

use std::path::Path;

use chrono::Utc;
use git2::{IndexAddOption, Repository};
use serde::{Deserialize, Serialize};

use crate::error::AppError;

const REF_PREFIX: &str = "refs/operator/checkpoints/";

// ── Public types ─────────────────────────────────────────────────────────────

/// Result of a successful `save` call.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveResult {
    /// Checkpoint identifier (e.g. `cp-20260315T120000Z`).
    pub id: String,
    /// Commit OID written to the checkpoint ref.
    pub commit_sha: String,
    /// Full git ref name (e.g. `refs/operator/checkpoints/cp-…`).
    pub git_ref: String,
}

/// Whether a git operation is in progress that blocks committing.
/// Mirrors detection logic from `git-busy-check.sh`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum BusyState {
    Clean,
    Rebase,
    Merge,
    CherryPick,
    Revert,
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Return the git-operation state of the repository at `repo_path`.
pub fn busy_state(repo_path: &Path) -> Result<BusyState, AppError> {
    let repo = Repository::open(repo_path)?;
    Ok(repo_busy_state(&repo))
}

/// Save a checkpoint of the current working-tree state.
///
/// - `id` — optional identifier; defaults to `cp-<UTC-timestamp>`.
/// - `force` — overwrite an existing checkpoint with the same id.
///
/// Returns `Err` with message `"busy:<reason>"` if a git operation is in
/// progress (equivalent to exit-code 101 in `checkpointer.sh`).
pub fn save(repo_path: &Path, id: Option<&str>, force: bool) -> Result<SaveResult, AppError> {
    let repo = Repository::open(repo_path)?;

    // Abort if a merge/rebase/etc is in progress (cannot safely write-tree).
    match repo_busy_state(&repo) {
        BusyState::Clean => {}
        BusyState::Rebase => return Err(AppError::msg("busy:rebase")),
        BusyState::Merge => return Err(AppError::msg("busy:merge")),
        BusyState::CherryPick => return Err(AppError::msg("busy:cherry-pick")),
        BusyState::Revert => return Err(AppError::msg("busy:revert")),
    }

    let id = id
        .map(|s| s.to_owned())
        .unwrap_or_else(|| format!("cp-{}", Utc::now().format("%Y%m%dT%H%M%SZ")));

    let git_ref = format!("{REF_PREFIX}{id}");

    if repo.find_reference(&git_ref).is_ok() && !force {
        return Err(AppError::msg(format!(
            "checkpoint '{id}' already exists (use force=true to overwrite)"
        )));
    }

    // ── Snapshot index (staged state) ────────────────────────────────────────
    let mut idx = repo.index()?;
    // write_tree() writes a tree object to ODB; does NOT touch the on-disk index.
    let index_tree_oid = idx.write_tree()?;

    // ── Snapshot working tree (staged + untracked, honoring .gitignore) ───────
    // Temporarily expand the in-memory index with all untracked files, write a
    // tree OID, then restore the original staged state before touching disk.
    // This mirrors the temp-index technique in checkpointer.sh.
    idx.add_all(["*"].iter(), IndexAddOption::DEFAULT, None)?;
    let worktree_tree_oid = idx.write_tree()?;

    // Restore original index state (in memory first, then flush to disk).
    let orig_tree = repo.find_tree(index_tree_oid)?;
    idx.read_tree(&orig_tree)?;
    idx.write()?;

    // ── HEAD OID (handle unborn HEAD) ─────────────────────────────────────────
    let head_oid = repo
        .head()
        .ok()
        .and_then(|h| h.target())
        .map(|o| o.to_string())
        .unwrap_or_else(|| "0".repeat(40));

    // ── Build checkpoint commit ───────────────────────────────────────────────
    let now = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let msg = format!(
        "checkpoint:{id}\nhead {head_oid}\nindex-tree {index_tree_oid}\nworktree-tree {worktree_tree_oid}\ncreated {now}"
    );

    let ts = Utc::now().timestamp();
    let git_time = git2::Time::new(ts, 0);
    let sig = git2::Signature::new("Checkpointer", "checkpointer@noreply", &git_time)?;

    let worktree_tree = repo.find_tree(worktree_tree_oid)?;

    // Orphan commit — no parents, no ref update yet.
    let commit_oid = repo.commit(None, &sig, &sig, &msg, &worktree_tree, &[])?;

    // Write the private ref (force=true replaces existing).
    repo.reference(&git_ref, commit_oid, true, &format!("checkpoint: {id}"))?;

    tracing::info!(id, git_ref, commit_sha = %commit_oid, "checkpoint saved");

    Ok(SaveResult {
        id,
        commit_sha: commit_oid.to_string(),
        git_ref,
    })
}

/// Restore working tree, index, and HEAD to a previously saved checkpoint.
///
/// Equivalent to the `restore` subcommand of `checkpointer.sh`.
pub fn restore(repo_path: &Path, id: &str) -> Result<(), AppError> {
    let repo = Repository::open(repo_path)?;
    let git_ref = format!("{REF_PREFIX}{id}");

    let reference = repo
        .find_reference(&git_ref)
        .map_err(|_| AppError::msg(format!("checkpoint not found: {id}")))?;

    let commit_oid = reference
        .target()
        .ok_or_else(|| AppError::msg("checkpoint ref is not a direct ref"))?;

    let commit = repo.find_commit(commit_oid)?;
    let msg = commit
        .message()
        .ok_or_else(|| AppError::msg("checkpoint commit has no message"))?;

    // Parse metadata from commit message.
    let head_oid_str = extract_meta(msg, "head")
        .ok_or_else(|| AppError::msg(format!("checkpoint '{id}' missing 'head' metadata")))?;
    let index_tree_str = extract_meta(msg, "index-tree")
        .ok_or_else(|| AppError::msg(format!("checkpoint '{id}' missing 'index-tree' metadata")))?;
    let worktree_tree_str = extract_meta(msg, "worktree-tree")
        .ok_or_else(|| AppError::msg(format!("checkpoint '{id}' missing 'worktree-tree' metadata")))?;

    let head_oid = git2::Oid::from_str(&head_oid_str)?;
    let index_tree_oid = git2::Oid::from_str(&index_tree_str)?;
    let worktree_tree_oid = git2::Oid::from_str(&worktree_tree_str)?;

    if head_oid.is_zero() {
        return Err(AppError::msg(
            "cannot restore: checkpoint was saved with unborn HEAD (no commits)",
        ));
    }

    // 1. Hard-reset HEAD to the saved commit (moves HEAD, updates index + workdir
    //    to match that commit — a clean baseline to build on).
    let head_commit = repo.find_commit(head_oid)?;
    repo.reset(head_commit.as_object(), git2::ResetType::Hard, None)?;

    // 2. Overlay the full worktree snapshot (includes files that were untracked
    //    at checkpoint time).  Force-checkout overwrites everything.
    let worktree_tree = repo.find_tree(worktree_tree_oid)?;
    let mut co_opts = git2::build::CheckoutBuilder::new();
    co_opts.force();
    repo.checkout_tree(worktree_tree.as_object(), Some(&mut co_opts))?;

    // 3. Remove files that exist on disk now but were NOT in the worktree
    //    snapshot (mirrors `git clean -fd`).
    remove_untracked_absent_from_tree(&repo, &worktree_tree)?;

    // 4. Restore the precise staged state (index) WITHOUT re-writing files.
    let index_tree = repo.find_tree(index_tree_oid)?;
    let mut idx = repo.index()?;
    idx.read_tree(&index_tree)?;
    idx.write()?;

    tracing::info!(id, "checkpoint restored");
    Ok(())
}

/// Diff two checkpoints.  Pass `"current"` for `id2` to compare against the
/// live working tree (equivalent to `checkpointer diff <id1> current`).
///
/// Returns a unified-diff string.
pub fn diff(repo_path: &Path, id1: &str, id2: &str) -> Result<String, AppError> {
    let repo = Repository::open(repo_path)?;

    let tree_a = checkpoint_tree(&repo, id1)?;

    let tree_b_owned;
    let tree_b = if id2 == "current" {
        tree_b_owned = current_worktree_tree(&repo)?;
        &tree_b_owned
    } else {
        tree_b_owned = checkpoint_tree(&repo, id2)?;
        &tree_b_owned
    };

    let git_diff = repo.diff_tree_to_tree(Some(&tree_a), Some(tree_b), None)?;

    let mut output = Vec::new();
    git_diff.print(git2::DiffFormat::Patch, |_, _, line| {
        output.extend_from_slice(line.content());
        true
    })?;

    String::from_utf8(output)
        .map_err(|_| AppError::msg("diff output contains non-UTF-8 bytes"))
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/// Check whether the repo has an in-progress git operation that prevents
/// committing.  Mirrors `git-busy-check.sh` detection logic.
fn repo_busy_state(repo: &Repository) -> BusyState {
    let git_dir = repo.path(); // path to .git/ (or the git dir for a worktree)

    if git_dir.join("rebase-merge").is_dir() || git_dir.join("rebase-apply").is_dir() {
        return BusyState::Rebase;
    }
    if git_dir.join("MERGE_HEAD").exists() {
        return BusyState::Merge;
    }
    if git_dir.join("CHERRY_PICK_HEAD").exists() {
        return BusyState::CherryPick;
    }
    if git_dir.join("REVERT_HEAD").exists() {
        return BusyState::Revert;
    }
    BusyState::Clean
}

/// Parse `"<key> <value>"` lines from a checkpoint commit message.
fn extract_meta(msg: &str, key: &str) -> Option<String> {
    let prefix = format!("{key} ");
    msg.lines()
        .find(|l| l.starts_with(&prefix))
        .map(|l| l[prefix.len()..].to_owned())
}

/// Resolve a checkpoint id → the worktree tree stored in the checkpoint commit.
fn checkpoint_tree<'r>(repo: &'r Repository, id: &str) -> Result<git2::Tree<'r>, AppError> {
    let git_ref = format!("{REF_PREFIX}{id}");
    let reference = repo
        .find_reference(&git_ref)
        .map_err(|_| AppError::msg(format!("unknown checkpoint: {id}")))?;
    let commit_oid = reference
        .target()
        .ok_or_else(|| AppError::msg("checkpoint ref is not a direct ref"))?;
    let commit = repo.find_commit(commit_oid)?;
    Ok(commit.tree()?)
}

/// Build a transient worktree-tree OID for the current state (same logic as
/// `save` but does NOT write a ref).  Restores the on-disk index afterward.
fn current_worktree_tree(repo: &Repository) -> Result<git2::Tree<'_>, AppError> {
    let mut idx = repo.index()?;
    let index_tree_oid = idx.write_tree()?;

    idx.add_all(["*"].iter(), IndexAddOption::DEFAULT, None)?;
    let worktree_tree_oid = idx.write_tree()?;

    // Restore original staged state.
    let orig = repo.find_tree(index_tree_oid)?;
    idx.read_tree(&orig)?;
    idx.write()?;

    Ok(repo.find_tree(worktree_tree_oid)?)
}

/// Delete untracked files in the workdir that are not present in `tree`.
/// This mirrors `git clean -fd` in `checkpointer.sh restore`.
fn remove_untracked_absent_from_tree(
    repo: &Repository,
    tree: &git2::Tree<'_>,
) -> Result<(), AppError> {
    let workdir = repo
        .workdir()
        .ok_or_else(|| AppError::msg("bare repository has no workdir"))?
        .to_owned();

    let mut opts = git2::StatusOptions::new();
    opts.include_untracked(true)
        .recurse_untracked_dirs(true)
        .include_ignored(false);

    let statuses = repo.statuses(Some(&mut opts))?;

    for entry in statuses.iter() {
        if entry.status().intersects(git2::Status::WT_NEW) {
            if let Some(rel) = entry.path() {
                // Keep the file if it exists in the saved worktree snapshot.
                if tree.get_path(Path::new(rel)).is_ok() {
                    continue;
                }
                let full = workdir.join(rel);
                if full.is_dir() {
                    let _ = std::fs::remove_dir_all(&full);
                } else if full.is_file() || full.is_symlink() {
                    let _ = std::fs::remove_file(&full);
                }
            }
        }
    }
    Ok(())
}
