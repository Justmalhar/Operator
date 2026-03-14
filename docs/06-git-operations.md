# Operator — Git Operations

*Version 1.0 · March 2026*

---

## 1. Overview

All git operations use the `git2` crate (libgit2 Rust bindings). No shell-out to `git` CLI for core ops — this eliminates PATH dependency issues and improves performance.

`gh` CLI and `glab` CLI are required only for platform-specific operations: PR creation, OAuth authentication, issue fetching.

---

## 2. Worktree Management

### 2.1 Creating a Workspace (Worktree)

```rust
use git2::{Repository, WorktreeAddOptions};

pub fn create_worktree(
    repo_path: &Path,
    worktree_path: &Path,
    branch_name: &str,
    base_branch: &str,
) -> Result<(), OperatorError> {
    let repo = Repository::open(repo_path)?;

    // Create new branch from base if it doesn't exist
    let base_commit = repo
        .find_branch(base_branch, git2::BranchType::Local)?
        .get()
        .peel_to_commit()?;

    let branch = if repo.find_branch(branch_name, git2::BranchType::Local).is_err() {
        repo.branch(branch_name, &base_commit, false)?
    } else {
        repo.find_branch(branch_name, git2::BranchType::Local)?
    };

    // Create worktree at target path
    let mut opts = WorktreeAddOptions::new();
    opts.reference(Some(branch.get()));

    repo.worktree(
        &worktree_path.file_name().unwrap().to_string_lossy(),
        worktree_path,
        Some(&opts),
    )?;

    Ok(())
}
```

### 2.2 Deleting a Worktree

```rust
pub fn delete_worktree(
    repo_path: &Path,
    worktree_name: &str,
    delete_branch: bool,
) -> Result<(), OperatorError> {
    let repo = Repository::open(repo_path)?;
    let wt = repo.find_worktree(worktree_name)?;

    // Prune the worktree reference
    let mut prune_opts = git2::WorktreePruneOptions::new();
    prune_opts.valid(true);
    wt.prune(Some(&mut prune_opts))?;

    // Optionally delete the branch
    if delete_branch {
        if let Ok(mut branch) = repo.find_branch(worktree_name, git2::BranchType::Local) {
            branch.delete()?;
        }
    }

    Ok(())
}
```

---

## 3. Checkpoint System

### 3.1 Creating a Checkpoint

Checkpoints are stored in private Git refs (`refs/operator/checkpoints/...`) — completely outside the normal branch history.

```rust
pub fn create_checkpoint(
    worktree_path: &Path,
    workspace_id: &str,
    turn_id: &str,
    description: &str,
) -> Result<String, OperatorError> {
    let repo = Repository::open(worktree_path)?;

    // Stage all current changes
    let mut index = repo.index()?;
    index.add_all(["*"].iter(), git2::IndexAddOption::DEFAULT, None)?;
    index.write()?;

    // Create tree from index
    let tree_id = index.write_tree()?;
    let tree = repo.find_tree(tree_id)?;

    // Get HEAD commit as parent
    let parent_commit = repo.head()?.peel_to_commit()?;

    // Create checkpoint commit
    let sig = git2::Signature::now("Operator", "operator@local")?;
    let message = format!(
        "operator-checkpoint: {}\n\nturn_id: {}\nworkspace_id: {}",
        description, turn_id, workspace_id
    );

    let sha = repo.commit(
        None,  // don't update any ref yet
        &sig,
        &sig,
        &message,
        &tree,
        &[&parent_commit],
    )?;

    // Store in private ref
    let ref_name = format!(
        "refs/operator/checkpoints/{}/{}",
        workspace_id, turn_id
    );
    repo.reference(&ref_name, sha, true, "operator checkpoint")?;

    Ok(sha.to_string())
}
```

### 3.2 Reverting to a Checkpoint

```rust
pub fn revert_to_checkpoint(
    worktree_path: &Path,
    checkpoint_sha: &str,
) -> Result<(), OperatorError> {
    let repo = Repository::open(worktree_path)?;
    let oid = git2::Oid::from_str(checkpoint_sha)?;
    let commit = repo.find_commit(oid)?;
    let tree = commit.tree()?;

    // Hard reset to checkpoint tree
    repo.reset(
        commit.as_object(),
        git2::ResetType::Hard,
        None,
    )?;

    // Checkout the tree to working directory
    let mut checkout_opts = git2::build::CheckoutBuilder::new();
    checkout_opts.force();
    repo.checkout_tree(tree.as_object(), Some(&mut checkout_opts))?;

    Ok(())
}
```

### 3.3 Checkpoint Cleanup (Retention Policy)

```rust
pub fn cleanup_old_checkpoints(
    repo_path: &Path,
    retention_days: u32,
) -> Result<usize, OperatorError> {
    let repo = Repository::open(repo_path)?;
    let cutoff = chrono::Utc::now() - chrono::Duration::days(retention_days as i64);
    let mut deleted = 0;

    repo.references_glob("refs/operator/checkpoints/*/*")?.for_each(|ref_result| {
        if let Ok(reference) = ref_result {
            if let Ok(commit) = reference.peel_to_commit() {
                let commit_time = chrono::DateTime::from_timestamp(
                    commit.author().when().seconds(), 0
                ).unwrap_or_default();

                if commit_time < cutoff {
                    let _ = reference.delete();
                    deleted += 1;
                }
            }
        }
    });

    Ok(deleted)
}
```

---

## 4. Diff Generation

```rust
pub fn get_workspace_diff(
    worktree_path: &Path,
    file_path: Option<&str>,
) -> Result<WorkspaceDiff, OperatorError> {
    let repo = Repository::open(worktree_path)?;

    // Diff HEAD against working directory
    let head = repo.head()?.peel_to_tree()?;

    let mut diff_opts = git2::DiffOptions::new();
    diff_opts.include_untracked(true);

    if let Some(path) = file_path {
        diff_opts.pathspec(path);
    }

    let diff = repo.diff_tree_to_workdir_with_index(
        Some(&head),
        Some(&mut diff_opts),
    )?;

    let mut files: Vec<FileDiff> = Vec::new();
    let mut total_additions = 0i64;
    let mut total_deletions = 0i64;

    diff.foreach(
        &mut |delta, _| {
            files.push(FileDiff {
                path: delta.new_file().path().unwrap_or_default().to_string_lossy().into(),
                old_path: delta.old_file().path().map(|p| p.to_string_lossy().into()),
                status: match delta.status() {
                    git2::Delta::Added => "added".into(),
                    git2::Delta::Deleted => "deleted".into(),
                    git2::Delta::Modified => "modified".into(),
                    git2::Delta::Renamed => "renamed".into(),
                    _ => "other".into(),
                },
                additions: 0,
                deletions: 0,
                patch: String::new(),
            });
            true
        },
        None,
        Some(&mut |_delta, _hunk| true),
        Some(&mut |_delta, _hunk, line| {
            match line.origin() {
                '+' => { total_additions += 1; if let Some(f) = files.last_mut() { f.additions += 1; } }
                '-' => { total_deletions += 1; if let Some(f) = files.last_mut() { f.deletions += 1; } }
                _ => {}
            }
            true
        }),
    )?;

    // Get full unified diff patch
    let mut patch_text = Vec::new();
    diff.print(git2::DiffFormat::Patch, |_delta, _hunk, line| {
        patch_text.extend_from_slice(line.content());
        true
    })?;

    Ok(WorkspaceDiff {
        files,
        stats: DiffStats {
            additions: total_additions,
            deletions: total_deletions,
            files_changed: files.len() as i64,
        },
        patch: String::from_utf8_lossy(&patch_text).into(),
    })
}
```

---

## 5. PR Creation

PR creation uses the platform CLI to avoid re-implementing OAuth flows.

### 5.1 GitHub (via `gh` CLI)

```rust
pub async fn create_github_pr(
    worktree_path: &Path,
    title: &str,
    body: &str,
    base_branch: &str,
    draft: bool,
) -> Result<PullRequest, OperatorError> {
    let gh = which::which("gh").map_err(|_| OperatorError::AuthError("github".into()))?;

    let mut cmd = tokio::process::Command::new(gh);
    cmd.current_dir(worktree_path)
        .args(["pr", "create", "--title", title, "--body", body, "--base", base_branch])
        .args(if draft { &["--draft"][..] } else { &[][..] })
        .arg("--json").arg("url,number,title,state");

    let output = cmd.output().await?;
    if !output.status.success() {
        return Err(OperatorError::NetworkError(
            String::from_utf8_lossy(&output.stderr).into()
        ));
    }

    let pr: serde_json::Value = serde_json::from_slice(&output.stdout)?;
    Ok(PullRequest {
        url: pr["url"].as_str().unwrap_or("").into(),
        number: pr["number"].as_i64().unwrap_or(0) as i32,
        title: pr["title"].as_str().unwrap_or("").into(),
        state: pr["state"].as_str().unwrap_or("").into(),
    })
}
```

### 5.2 GitLab (via `glab` CLI)

```rust
pub async fn create_gitlab_mr(
    worktree_path: &Path,
    title: &str,
    body: &str,
    base_branch: &str,
) -> Result<PullRequest, OperatorError> {
    let glab = which::which("glab").map_err(|_| OperatorError::AuthError("gitlab".into()))?;

    let output = tokio::process::Command::new(glab)
        .current_dir(worktree_path)
        .args(["mr", "create", "--title", title, "--description", body, "--target-branch", base_branch, "--yes"])
        .output().await?;

    // Parse output for MR URL
    let stdout = String::from_utf8_lossy(&output.stdout);
    let url = stdout.lines()
        .find(|l| l.starts_with("https://"))
        .unwrap_or("").to_string();

    Ok(PullRequest { url, number: 0, title: title.into(), state: "open".into() })
}
```

---

## 6. File Tree Indexing

For @ mention search — builds an in-memory file index from the worktree.

```rust
pub fn index_workspace_files(worktree_path: &Path) -> Result<Vec<String>, OperatorError> {
    let repo = Repository::open(worktree_path)?;
    let head = repo.head()?.peel_to_tree()?;

    let mut files: Vec<String> = Vec::new();

    head.walk(git2::TreeWalkMode::PreOrder, |root, entry| {
        if entry.kind() == Some(git2::ObjectType::Blob) {
            let path = if root.is_empty() {
                entry.name().unwrap_or("").to_string()
            } else {
                format!("{}/{}", root.trim_end_matches('/'), entry.name().unwrap_or(""))
            };
            files.push(path);
        }
        git2::TreeWalkResult::Ok
    })?;

    // Also include untracked files in working directory
    let statuses = repo.statuses(Some(
        git2::StatusOptions::new()
            .include_untracked(true)
            .recurse_untracked_dirs(true)
    ))?;

    for entry in statuses.iter() {
        if entry.status().contains(git2::Status::WT_NEW) {
            if let Some(path) = entry.path() {
                if !files.contains(&path.to_string()) {
                    files.push(path.to_string());
                }
            }
        }
    }

    files.sort();
    Ok(files)
}
```

---

## 7. Operator.json Parsing

```rust
#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct OperatorConfig {
    pub scripts: Option<ScriptsConfig>,
    pub agents: Option<AgentsConfig>,
    pub providers: Option<ProvidersConfig>,
    pub skills: Option<SkillsConfig>,
    pub instructions: Option<InstructionsConfig>,
    pub hooks: Option<HooksPresetConfig>,
    pub context: Option<ContextConfig>,
    pub attachments: Option<AttachmentsConfig>,
    pub enterprise_data_privacy: Option<bool>,
    pub team: Option<TeamConfig>,
}

pub fn load_operator_config(repo_path: &Path) -> Result<Option<OperatorConfig>, OperatorError> {
    let config_path = repo_path.join("operator.json");
    if !config_path.exists() {
        return Ok(None);
    }

    let content = std::fs::read_to_string(config_path)?;
    let config: OperatorConfig = serde_json::from_str(&content)
        .map_err(|e| OperatorError::InvalidConfig(format!("operator.json: {}", e)))?;

    Ok(Some(config))
}
```

---

## 8. Environment Variable Injection

When spawning agent processes, inject these variables:

```rust
pub fn build_workspace_env(
    workspace: &Workspace,
    repo: &Repository,
) -> HashMap<String, String> {
    let mut env = std::env::vars().collect::<HashMap<_, _>>();

    // Operator-specific vars
    env.insert("OPERATOR_WORKSPACE_NAME".into(), workspace.city_name.clone());
    env.insert("OPERATOR_WORKSPACE_PATH".into(), workspace.worktree_path.clone());
    env.insert("OPERATOR_ROOT_PATH".into(), repo.local_path.clone());
    env.insert("OPERATOR_DEFAULT_BRANCH".into(), repo.default_branch.clone());
    env.insert("OPERATOR_PORT".into(), workspace.port_base.to_string());
    env.insert("OPERATOR_REPO_NAME".into(), repo.name.clone());
    env.insert("OPERATOR_AGENT_BACKEND".into(), workspace.agent_backend.clone());

    // Conductor compatibility aliases
    env.insert("CONDUCTOR_WORKSPACE_NAME".into(), workspace.city_name.clone());
    env.insert("CONDUCTOR_WORKSPACE_PATH".into(), workspace.worktree_path.clone());
    env.insert("CONDUCTOR_ROOT_PATH".into(), repo.local_path.clone());
    env.insert("CONDUCTOR_DEFAULT_BRANCH".into(), repo.default_branch.clone());
    env.insert("CONDUCTOR_PORT".into(), workspace.port_base.to_string());

    env
}
```

---

## 9. Sparse Checkout (Monorepo Support)

```rust
pub fn apply_sparse_checkout(
    worktree_path: &Path,
    directories: &[String],
) -> Result<(), OperatorError> {
    let repo = Repository::open(worktree_path)?;

    // Enable sparse checkout
    let mut config = repo.config()?;
    config.set_bool("core.sparseCheckout", true)?;

    // Write sparse-checkout file
    let sparse_path = worktree_path
        .join(".git")
        .join("info")
        .join("sparse-checkout");

    let content = directories
        .iter()
        .map(|d| format!("/{}\n", d))
        .collect::<String>();

    std::fs::write(sparse_path, content)?;

    // Re-read tree
    let output = tokio::process::Command::new("git")
        .current_dir(worktree_path)
        .args(["read-tree", "-mu", "HEAD"])
        .output()
        .await?;

    if !output.status.success() {
        return Err(OperatorError::GitError(
            String::from_utf8_lossy(&output.stderr).into()
        ));
    }

    Ok(())
}
```
