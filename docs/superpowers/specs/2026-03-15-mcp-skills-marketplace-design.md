# MCP Servers & Skills Marketplace — Design Spec

*Date: 2026-03-15 · Status: Approved*

---

## 1. Overview

Two separate marketplace pages within the Operator desktop app:
- **MCP Marketplace** (`src/pages/Mcp.tsx`) — browse, install, and configure MCP servers
- **Skills Marketplace** (`src/pages/Skills.tsx`) — browse and install agent skills

Both pages display a grid of cards (inspired by Codex's Skills page) with an "Installed" section at the top and a "Recommended" section below.

The backing data lives in `agents/mcp-servers.json` and `agents/skills.json`. These are **catalog files** for marketplace display — not direct DB seed inserts. When a user installs an entry, the app creates a full DB record with additional runtime fields.

---

## 2. Data Files

### `agents/mcp-servers.json`

Array of MCP server entries under the `mcp_servers` key.

**Schema per entry:**

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique slug (e.g. `"github-mcp"`) |
| `name` | `string` | Display name |
| `author` | `string` | Publisher handle (e.g. `"@modelcontextprotocol"`) |
| `description` | `string` | One-liner summary |
| `icon_url` | `string` | URL or local asset path to icon |
| `category` | `string` | One of: `DevTools`, `Data`, `Productivity`, `AI`, `Communication`, `Infrastructure` |
| `tags` | `string[]` | Searchable keyword tags |
| `transport` | `"stdio" \| "sse" \| "http"` | MCP transport protocol |
| `install_command` | `string` | Shell command to install/run the server |
| `config_schema` | `{ key, description, required }[]` | Environment variables required at runtime |
| `tools` | `string[]` | Tool names exposed by this server |
| `stars` | `number` | Community star count (catalog/display only — no DB column) |
| `is_installed` | `boolean` | Catalog default only — no DB column. At runtime the UI derives installed state from whether a matching `mcp_servers` DB row exists for this `id`. The JSON value serves as the initial display state before runtime hydration |
| `is_verified` | `boolean` | Verified publisher badge (catalog/display only — no DB column) |
| `source_url` | `string` | GitHub or docs URL (catalog/display only — no DB column) |
| `created_at` | `string` | ISO 8601 timestamp — maps to `created_at DATETIME` in DB |
| `updated_at` | `string` | ISO 8601 timestamp — maps to `updated_at DATETIME` in DB |

> **No `install_scope` field:** MCP servers are always installed globally (system-level process, not per-repo). The `mcp_servers` DB table should have no `install_scope` column. This is intentional and differs from skills, which support both global and repo-scoped installation.

### `agents/skills.json`

Array of skill entries under the `skills` key.

**Schema per entry:**

> **Note on `id` vs `name`:** `id` is a short identifier slug (e.g. `"tdd"`); `name` is the canonical SKILL.md filename slug (e.g. `"test-driven-development"`). They may differ. Both are unique. The DB `skills` table uses `name` as the `UNIQUE` business key.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Short unique slug (e.g. `"tdd"`) |
| `name` | `string` | Canonical SKILL.md filename slug — maps to `name TEXT NOT NULL UNIQUE` in DB |
| `display_name` | `string` | Human-readable title |
| `author` | `string` | Publisher handle |
| `description` | `string` | One-liner summary |
| `icon_url` | `string` | URL or local asset path to icon (catalog/display only — no DB column) |
| `category` | `string` | One of: `Code Quality`, `Testing`, `Documentation`, `Security`, `Git & PR`, `Architecture`, `DevOps`, `Frameworks` |
| `tags` | `string[]` | Searchable keyword tags (catalog/display only — no DB column) |
| `trigger_description` | `string` | When this skill activates (catalog/display only — no DB column) |
| `allowed_tools` | `string[]` | Operator tools the skill may use — maps to `allowed_tools` in DB |
| `auto_invoke` | `boolean` | Whether the skill auto-fires on trigger match — maps to `auto_invoke BOOLEAN` in DB |
| `context` | `"default" \| "fork"` | Execution context type — maps to `context` in DB |
| `install_scope` | `"global" \| "repo"` | UI display value. At install time resolved to `"global"` or `"repo:<repo_id>"` for the DB column |
| `skill_md` | `string` | Raw SKILL.md content. `""` in catalog entries; populated from source at install time. Maps to `skill_md TEXT NOT NULL` in DB |
| `is_builtin` | `boolean` | True for shipped built-in skills — maps to `is_builtin BOOLEAN` in DB |
| `is_enabled` | `boolean` | Whether active — maps to `is_enabled BOOLEAN` in DB |
| `installed_path` | `string \| null` | Filesystem path of installed SKILL.md; `null` = not installed. Maps to `installed_path TEXT` in DB. The UI derives "installed" state from `installed_path !== null` |
| `stars` | `number` | Community star count (catalog/display only — no DB column) |
| `is_verified` | `boolean` | Verified publisher badge (catalog/display only — no DB column) |
| `source_url` | `string` | GitHub or docs URL (catalog/display only — no DB column) |
| `created_at` | `string` | ISO 8601 timestamp — maps to `created_at DATETIME` in DB |
| `updated_at` | `string` | ISO 8601 timestamp — maps to `updated_at DATETIME` in DB |

---

## 3. Page Layout

Both pages share the same layout pattern (Codex-style grid):

```
┌─────────────────────────────────────────────────────────────┐
│  [Page Title]           [Refresh]  [Search...]  [+ New]     │
├─────────────────────────────────────────────────────────────┤
│  Installed                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ [icon]   │ │ [icon]   │ │ [icon]   │ │ [icon]   │       │
│  │ Name     │ │ Name     │ │ Name     │ │ Name     │       │
│  │ desc...  │ │ desc...  │ │ desc...  │ │ desc...  │  ✓    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  Recommended                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ [icon]   │ │ [icon]   │ │ [icon]   │ │ [icon]   │       │
│  │ Name     │ │ Name     │ │ Name     │ │ Name     │  +    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

- Installed items show a checkmark (✓) and muted install button
- Uninstalled items show a `+` add button
- Cards are 2-column on narrow panes, 3-4 column when space allows
- Search filters by name, description, tags in real-time

---

## 4. MCP-Specific UI Details

- **Transport badge** on each card: `stdio` | `sse` | `http` (colored pill)
- **Tools count** shown as secondary label: e.g. `8 tools`
- **Config required** indicator: lock icon if `config_schema` has required fields
- Install flow: clicking `+` opens a side drawer showing `install_command` + `config_schema` form to fill env vars before installing

---

## 5. Skills-Specific UI Details

- **Category pill** on each card (colored by category)
- **Auto-invoke badge** if `auto_invoke: true`
- **Install scope selector** on install: `Global` vs `Repo` radio (UI value `"repo"` resolves to `"repo:<repo_id>"` in the DB at install time)
- **Allowed tools** shown as small chips on hover/expand

---

## 6. DB Migration Path

The JSON files are catalog data, not direct DB inserts. Migration notes:

**`agents/skills.json` → `skills` table (existing):**
- Core fields (`name`, `display_name`, `description`, `category`, `allowed_tools`, `auto_invoke`, `context`, `skill_md`, `is_builtin`, `is_enabled`, `installed_path`, `install_scope`, `created_at`, `updated_at`) map directly to existing columns.
- Catalog-only fields (`author`, `tags`, `icon_url`, `stars`, `is_verified`, `source_url`, `trigger_description`) have no existing DB columns. A migration `0005_extend_skills_catalog.sql` must ADD these columns before seeding.

**`agents/mcp-servers.json` → new `mcp_servers` table:**
- Requires new migration `0006_add_mcp_servers.sql` with columns matching the JSON schema plus `config_schema TEXT` (JSON blob) and `tools TEXT` (JSON array).

---

## 7. Sample Data

10 entries each in:
- `agents/mcp-servers.json` — GitHub, Context7, Chrome DevTools, DB Toolbox, Filesystem, Slack, Playwright, Linear, Supabase, Vercel
- `agents/skills.json` — Code Review, TDD, Systematic Debugging, Frontend Design, Commit+PR, Writing Plans, Security Audit, Generate Docs, Docker Deploy, Next.js Feature Dev
