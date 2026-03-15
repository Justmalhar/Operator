//! Tauri commands for repository and workspace lifecycle management.
//!
//! Repositories are top-level git repos registered with Operator.
//! Workspaces are git worktrees (one per task/branch) hanging off a repository.

use std::path::PathBuf;

use tauri::State;

use crate::{db, error::AppError, ports, AppState};

// ── Repository commands ───────────────────────────────────────────────────────

/// List all registered repositories.
#[tauri::command]
pub async fn list_repositories(
    state: State<'_, AppState>,
) -> Result<Vec<db::repository::Repository>, AppError> {
    db::repository::list(&state.db)
        .await
        .map_err(Into::into)
}

/// Register a new repository (inserts DB record only — does not clone).
#[tauri::command]
pub async fn add_repository(
    state: State<'_, AppState>,
    input: db::repository::CreateRepository,
) -> Result<db::repository::Repository, AppError> {
    db::repository::create(&state.db, input)
        .await
        .map_err(Into::into)
}

/// Remove a repository record from the database.
#[tauri::command]
pub async fn remove_repository(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), AppError> {
    db::repository::delete(&state.db, &id)
        .await
        .map_err(Into::into)
}

/// Look up a repository by its filesystem path. Returns None if not registered.
#[tauri::command]
pub async fn find_repository_by_path(
    state: State<'_, AppState>,
    path: String,
) -> Result<Option<db::repository::Repository>, AppError> {
    db::repository::find_by_path(&state.db, &path)
        .await
        .map_err(Into::into)
}

/// Clone a remote git repository to destination_path using libgit2.
#[tauri::command]
pub async fn clone_repository(
    url: String,
    destination_path: String,
) -> Result<(), AppError> {
    let dest = PathBuf::from(&destination_path);
    git2::Repository::clone(&url, &dest).map_err(AppError::Git)?;
    Ok(())
}

/// Recursively copies a directory tree from source_path to destination_path.
#[tauri::command]
pub async fn copy_template(
    source_path: String,
    destination_path: String,
) -> Result<(), AppError> {
    fn copy_dir(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
        std::fs::create_dir_all(dst)?;
        for entry in std::fs::read_dir(src)? {
            let entry = entry?;
            let ty = entry.file_type()?;
            let dst_path = dst.join(entry.file_name());
            if ty.is_dir() {
                copy_dir(&entry.path(), &dst_path)?;
            } else if ty.is_file() {
                std::fs::copy(entry.path(), &dst_path)?;
            }
        }
        Ok(())
    }
    copy_dir(
        std::path::Path::new(&source_path),
        std::path::Path::new(&destination_path),
    )
    .map_err(AppError::Io)
}

/// Initializes a git repository at path if .git does not already exist.
#[tauri::command]
pub async fn init_git_repo(path: String) -> Result<(), AppError> {
    let p = std::path::Path::new(&path);
    if !p.join(".git").exists() {
        git2::Repository::init(p).map_err(AppError::Git)?;
    }
    Ok(())
}

// ── Workspace commands ────────────────────────────────────────────────────────

/// List active (non-archived) workspaces for a repository.
#[tauri::command]
pub async fn list_workspaces(
    state: State<'_, AppState>,
    repository_id: String,
) -> Result<Vec<db::workspace::Workspace>, AppError> {
    db::workspace::list_by_repo(&state.db, &repository_id)
        .await
        .map_err(Into::into)
}

/// Fetch a single workspace by ID.
#[tauri::command]
pub async fn get_workspace(
    state: State<'_, AppState>,
    id: String,
) -> Result<db::workspace::Workspace, AppError> {
    db::workspace::find_by_id(&state.db, &id)
        .await?
        .ok_or_else(|| AppError::msg(format!("workspace not found: {id}")))
}

/// Create a new workspace.
///
/// Allocates a port block, creates a git worktree at `<repo_path>/../<city_name>`,
/// then inserts the workspace row into SQLite.
#[tauri::command]
pub async fn create_workspace(
    state: State<'_, AppState>,
    repository_id: String,
    repo_path: String,
    city_name: String,
    branch_name: String,
    base_branch: String,
    agent_backend: Option<String>,
    model: Option<String>,
) -> Result<db::workspace::Workspace, AppError> {
    // Determine base port from settings (default 3000).
    let base_port_str = db::variables::setting_get(&state.db, "base_port").await?;
    let base_port: u16 = base_port_str
        .and_then(|s| s.parse::<u16>().ok())
        .unwrap_or(ports::DEFAULT_BASE_PORT);

    // Use count of all active workspaces as the unique workspace index.
    let existing = db::workspace::list_all_active(&state.db).await?;
    let workspace_index = existing.len() as u32;

    let allocated_port = ports::allocate(base_port, workspace_index);

    // Worktree lives as a sibling directory of the main repo.
    let repo_dir = PathBuf::from(&repo_path);
    let parent = repo_dir
        .parent()
        .ok_or_else(|| AppError::msg("repo_path has no parent directory"))?;
    let worktree_path = parent.join(&city_name);

    // Create the git worktree (branch is created from base_branch if needed).
    crate::git::worktree::create(&repo_dir, &worktree_path, &branch_name, &base_branch)?;

    let worktree_path_str = worktree_path
        .to_str()
        .ok_or_else(|| AppError::msg("worktree path contains non-UTF-8 characters"))?
        .to_owned();

    // Persist the workspace record.
    let workspace = db::workspace::create(
        &state.db,
        db::workspace::CreateWorkspace {
            repository_id,
            city_name,
            branch_name,
            worktree_path: worktree_path_str,
            agent_backend,
            model,
            reasoning_level: None,
            port_base: Some(allocated_port as i64),
        },
    )
    .await?;

    tracing::info!(
        workspace_id = %workspace.id,
        port = allocated_port,
        path = %worktree_path.display(),
        "workspace created"
    );

    Ok(workspace)
}

/// Delete a workspace: kills the agent, removes the git worktree, and deletes
/// the DB record.
#[tauri::command]
pub async fn delete_workspace(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), AppError> {
    let workspace = db::workspace::find_by_id(&state.db, &id)
        .await?
        .ok_or_else(|| AppError::msg(format!("workspace not found: {id}")))?;

    // Kill any running agent.
    {
        let mut mgr = state
            .pty_manager
            .lock()
            .map_err(|_| AppError::msg("pty_manager lock poisoned"))?;
        if mgr.is_running(&id) {
            let _ = mgr.kill(&id);
        }
    }

    // Remove the git worktree from disk when it exists.
    let worktree_path = PathBuf::from(&workspace.worktree_path);
    if worktree_path.exists() {
        // Infer the main repo root: scan parent dir for the sibling with a
        // real .git/ directory (worktree .git is a plain file).
        let parent = worktree_path
            .parent()
            .unwrap_or_else(|| std::path::Path::new("."));

        let repo_root = std::fs::read_dir(parent)
            .ok()
            .and_then(|entries| {
                entries.flatten().find_map(|e| {
                    let p = e.path();
                    if p.join(".git").is_dir() {
                        Some(p)
                    } else {
                        None
                    }
                })
            })
            .unwrap_or_else(|| parent.to_owned());

        let _ = crate::git::worktree::remove(&repo_root, &worktree_path);
    }

    // Delete the DB record.
    db::workspace::delete(&state.db, &id)
        .await
        .map_err(Into::into)
}

/// Archive a workspace (soft-delete — the git worktree remains on disk).
#[tauri::command]
pub async fn archive_workspace(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), AppError> {
    db::workspace::archive(&state.db, &id)
        .await
        .map_err(Into::into)
}

/// Update the `status` field of a workspace (e.g. "idle", "running", "error").
#[tauri::command]
pub async fn set_workspace_status(
    state: State<'_, AppState>,
    id: String,
    status: String,
) -> Result<(), AppError> {
    db::workspace::set_status(&state.db, &id, &status)
        .await
        .map_err(Into::into)
}
