use serde::Serialize;

/// Unified application error type.
/// All Tauri command handlers return `Result<T, AppError>` so the frontend
/// receives a consistent error string on failure.
#[derive(Debug)]
pub enum AppError {
    Db(sqlx::Error),
    Git(git2::Error),
    Io(std::io::Error),
    Json(serde_json::Error),
    Other(String),
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::Db(e) => write!(f, "database error: {e}"),
            AppError::Git(e) => write!(f, "git error: {e}"),
            AppError::Io(e) => write!(f, "io error: {e}"),
            AppError::Json(e) => write!(f, "json error: {e}"),
            AppError::Other(s) => write!(f, "{s}"),
        }
    }
}

impl std::error::Error for AppError {}

impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        AppError::Db(e)
    }
}

impl From<git2::Error> for AppError {
    fn from(e: git2::Error) -> Self {
        AppError::Git(e)
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e)
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::Json(e)
    }
}

impl AppError {
    pub fn msg(s: impl Into<String>) -> Self {
        AppError::Other(s.into())
    }
}

/// Tauri requires command errors to be serializable.
impl Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}
