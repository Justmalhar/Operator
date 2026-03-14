//! Port allocator for Operator workspaces.
//!
//! Design: `OPERATOR_PORT = BASE_PORT + (workspace_index * PORTS_PER_WORKSPACE)`
//!
//! Each workspace owns a contiguous range of `PORTS_PER_WORKSPACE` ports so
//! that multiple services (dev server, API proxy, debug adapter, etc.) can all
//! be derived deterministically from a single base allocation.
//!
//! Example with default base port 3000:
//!   workspace 0 → ports 3000..3010
//!   workspace 1 → ports 3010..3020
//!   workspace 2 → ports 3020..3030

use std::net::TcpListener;
use std::ops::Range;

use serde::{Deserialize, Serialize};

// ── Constants ─────────────────────────────────────────────────────────────────

/// Default base port used when no explicit override is configured.
pub const DEFAULT_BASE_PORT: u16 = 3000;

/// Number of ports reserved per workspace.
pub const PORTS_PER_WORKSPACE: u16 = 10;

// ── Public types ─────────────────────────────────────────────────────────────

/// The resolved port allocation for a single workspace.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct WorkspacePortAlloc {
    /// First port in the allocated range (primary port).
    pub base: u16,
    /// Exclusive upper bound of the range.
    pub end: u16,
    /// Zero-based index of the workspace this allocation belongs to.
    pub workspace_index: u32,
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Return the primary (base) port for a workspace.
///
/// Formula: `base_port + workspace_index * PORTS_PER_WORKSPACE`
///
/// # Panics
/// Panics on `u16` overflow — callers should validate inputs first.
pub fn allocate(base_port: u16, workspace_index: u32) -> u16 {
    base_port
        .checked_add(
            (workspace_index as u16)
                .checked_mul(PORTS_PER_WORKSPACE)
                .expect("workspace_index overflows u16 when multiplied by PORTS_PER_WORKSPACE"),
        )
        .expect("port allocation overflows u16")
}

/// Return the full `Range<u16>` of ports reserved for a workspace.
///
/// The range is `[base_port + idx*10, base_port + idx*10 + 10)`.
pub fn ports_for_workspace(base_port: u16, workspace_index: u32) -> Range<u16> {
    let start = allocate(base_port, workspace_index);
    let end = start
        .checked_add(PORTS_PER_WORKSPACE)
        .expect("port range end overflows u16");
    start..end
}

/// Return `true` if a TCP listener can be bound to `port` on localhost.
///
/// Uses `SO_REUSEADDR` semantics as provided by the standard library.
/// Returns `false` on any bind error (port in use, permission denied, etc.).
pub fn is_port_available(port: u16) -> bool {
    TcpListener::bind(("127.0.0.1", port)).is_ok()
}

/// Find the first `base_port` (aligned to `PORTS_PER_WORKSPACE`) such that
/// all 10 ports in the first `num_workspaces` allocations are available.
///
/// Starts searching from `starting_base` and steps by `PORTS_PER_WORKSPACE`
/// until it finds a block where every port in the range is available, or
/// until `u16` space is exhausted.
///
/// Returns `None` if no suitable base is found.
pub fn find_free_base(starting_base: u16, num_workspaces: u32) -> Option<u16> {
    let total_ports = (num_workspaces as u16)
        .checked_mul(PORTS_PER_WORKSPACE)?;

    let mut candidate = starting_base;

    loop {
        let end = candidate.checked_add(total_ports)?;

        let all_free = (candidate..end).all(is_port_available);

        if all_free {
            return Some(candidate);
        }

        // Advance by one full workspace block.
        candidate = candidate.checked_add(PORTS_PER_WORKSPACE)?;
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allocate_workspace_0() {
        assert_eq!(allocate(3000, 0), 3000);
    }

    #[test]
    fn allocate_workspace_1() {
        assert_eq!(allocate(3000, 1), 3010);
    }

    #[test]
    fn allocate_workspace_5() {
        assert_eq!(allocate(3000, 5), 3050);
    }

    #[test]
    fn ports_for_workspace_range() {
        let range = ports_for_workspace(3000, 2);
        assert_eq!(range, 3020..3030);
    }

    #[test]
    fn find_free_base_returns_some() {
        // Very low port numbers are unlikely to be free; use a high range.
        // This is a best-effort smoke test.
        let result = find_free_base(49152, 1);
        assert!(result.is_some());
    }
}
