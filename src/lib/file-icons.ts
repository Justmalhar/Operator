/**
 * Material Icon Theme mapping utility.
 * Maps filenames, extensions, and folder names → icon slugs served from /material-icons/*.svg
 *
 * Lookup order for files:   exact filename → extension → "file"
 * Lookup order for folders: exact folder name → "folder" / "folder-open"
 */

const BASE = "/material-icons";

// ---------------------------------------------------------------------------
// Exact filename → icon slug
// ---------------------------------------------------------------------------
const FILE_NAME_MAP: Record<string, string> = {
  // Package managers / configs
  "package.json": "nodejs",
  "package-lock.json": "nodejs",
  "bun.lockb": "bun",
  "bun.lock": "bun",
  "yarn.lock": "yarn",
  "pnpm-lock.yaml": "pnpm",
  ".npmrc": "npm",
  ".nvmrc": "node",
  ".node-version": "node",

  // TypeScript
  "tsconfig.json": "tsconfig",
  "tsconfig.node.json": "tsconfig",
  "tsconfig.app.json": "tsconfig",
  "tsconfig.build.json": "tsconfig",
  "jsconfig.json": "jsconfig",

  // Vite / build
  "vite.config.ts": "vite",
  "vite.config.js": "vite",
  "vite.config.mts": "vite",
  "vitest.config.ts": "vitest",
  "vitest.config.js": "vitest",
  "rollup.config.js": "rollup",
  "rollup.config.ts": "rollup",
  "webpack.config.js": "webpack",
  "webpack.config.ts": "webpack",
  "esbuild.config.js": "esbuild",

  // Tailwind / PostCSS
  "tailwind.config.js": "tailwind",
  "tailwind.config.ts": "tailwind",
  "tailwind.config.mjs": "tailwind",
  "postcss.config.js": "postcss",
  "postcss.config.ts": "postcss",
  "postcss.config.cjs": "postcss",

  // Linting / formatting
  ".eslintrc": "eslint",
  ".eslintrc.js": "eslint",
  ".eslintrc.cjs": "eslint",
  ".eslintrc.json": "eslint",
  ".eslintrc.yml": "eslint",
  ".eslintrc.yaml": "eslint",
  "eslint.config.js": "eslint",
  "eslint.config.ts": "eslint",
  "eslint.config.mjs": "eslint",
  ".prettierrc": "prettier",
  ".prettierrc.js": "prettier",
  ".prettierrc.json": "prettier",
  ".prettierrc.yml": "prettier",
  ".prettierrc.yaml": "prettier",
  "prettier.config.js": "prettier",
  "prettier.config.ts": "prettier",
  ".stylelintrc": "stylelint",
  ".stylelintrc.json": "stylelint",
  "stylelint.config.js": "stylelint",
  ".biome.json": "biome",
  "biome.json": "biome",
  "biome.jsonc": "biome",
  "oxlint.json": "oxc",

  // Git
  ".gitignore": "git",
  ".gitattributes": "git",
  ".gitmodules": "git",
  ".gitkeep": "git",
  ".gitconfig": "git",

  // Docker
  "Dockerfile": "docker",
  "docker-compose.yml": "docker",
  "docker-compose.yaml": "docker",
  "docker-compose.dev.yml": "docker",
  "docker-compose.prod.yml": "docker",
  ".dockerignore": "docker",

  // CI / CD
  ".travis.yml": "travis",
  "Jenkinsfile": "jenkins",
  "appveyor.yml": "appveyor",
  ".circleci": "circleci",
  "netlify.toml": "netlify",
  "vercel.json": "vercel",
  ".vercelignore": "vercel",
  "fly.toml": "fly",
  "render.yaml": "render",
  "railway.toml": "railway",

  // Tauri
  "tauri.conf.json": "tauri",
  "Cargo.toml": "cargo",
  "Cargo.lock": "cargo",

  // Env
  ".env": "env",
  ".env.local": "env",
  ".env.development": "env",
  ".env.production": "env",
  ".env.staging": "env",
  ".env.test": "env",
  ".env.example": "env",

  // Docs
  "README.md": "readme",
  "readme.md": "readme",
  "CHANGELOG.md": "changelog",
  "changelog.md": "changelog",
  "CONTRIBUTING.md": "contributing",
  "LICENSE": "license",
  "LICENSE.md": "license",
  "license": "license",

  // Misc config
  "Makefile": "makefile",
  "makefile": "makefile",
  "GNUmakefile": "makefile",
  ".editorconfig": "editorconfig",
  ".htaccess": "htaccess",
  "robots.txt": "robot",
  "sitemap.xml": "xml",
  "favicon.ico": "favicon",
  "favicon.svg": "favicon",
  "index.html": "html",

  // AI / Claude
  "CLAUDE.md": "claude",
  "AGENTS.md": "claude",
  ".clinerules": "cline",
  ".cursorrules": "cursor",
  ".windsurfrules": "windsurf",

  // Misc
  "jest.config.js": "jest",
  "jest.config.ts": "jest",
  "jest.config.json": "jest",
  "babel.config.js": "babel",
  "babel.config.json": "babel",
  ".babelrc": "babel",
  "next.config.js": "next",
  "next.config.ts": "next",
  "next.config.mjs": "next",
  "nuxt.config.ts": "nuxt",
  "nuxt.config.js": "nuxt",
  "svelte.config.js": "svelte",
  "astro.config.mjs": "astro",
  "astro.config.ts": "astro",
  ".storybook": "storybook",
  "storybook.config.js": "storybook",
  "drizzle.config.ts": "drizzle",
  "drizzle.config.js": "drizzle",
  "prisma.schema": "prisma",
  "schema.prisma": "prisma",
  "supabase.ts": "supabase",
  "playwright.config.ts": "playwright",
  "playwright.config.js": "playwright",
  "cypress.config.ts": "cypress",
  "cypress.config.js": "cypress",
};

// ---------------------------------------------------------------------------
// Extension → icon slug
// ---------------------------------------------------------------------------
const EXT_MAP: Record<string, string> = {
  // TypeScript / JavaScript
  ts: "typescript",
  tsx: "react",
  js: "javascript",
  jsx: "react",
  mjs: "javascript",
  cjs: "javascript",
  mts: "typescript",
  cts: "typescript",

  // Web
  html: "html",
  htm: "html",
  css: "css",
  scss: "sass",
  sass: "sass",
  less: "less",
  styl: "stylus",

  // Data / Config
  json: "json",
  jsonc: "json",
  json5: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  xml: "xml",
  csv: "table",
  tsv: "table",
  ini: "settings",
  conf: "settings",
  config: "settings",
  env: "env",

  // Markdown / Docs
  md: "markdown",
  mdx: "mdx",
  rst: "restructuredtext",
  txt: "document",
  pdf: "pdf",
  doc: "word",
  docx: "word",
  xls: "xls",
  xlsx: "xlsx",
  ppt: "ppt",
  pptx: "ppt",

  // Images
  svg: "svg",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  ico: "favicon",
  bmp: "image",
  tiff: "image",
  tif: "image",
  avif: "image",
  heic: "image",

  // Video / Audio
  mp4: "video",
  mov: "video",
  avi: "video",
  mkv: "video",
  webm: "video",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  flac: "audio",
  aac: "audio",

  // Programming languages
  py: "python",
  pyw: "python",
  rb: "ruby",
  rs: "rust",
  go: "go",
  java: "java",
  kt: "kotlin",
  kts: "kotlin",
  swift: "swift",
  c: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  h: "h",
  hpp: "hpp",
  cs: "csharp",
  fs: "fsharp",
  fsx: "fsharp",
  php: "php",
  lua: "lua",
  r: "r",
  dart: "dart",
  scala: "scala",
  groovy: "groovy",
  clj: "clojure",
  cljs: "clojure",
  ex: "elixir",
  exs: "elixir",
  erl: "erlang",
  hrl: "erlang",
  hs: "haskell",
  lhs: "haskell",
  jl: "julia",
  nim: "nim",
  zig: "zig",
  v: "vlang",
  cr: "crystal",
  pl: "perl",
  pm: "perl",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  fish: "fish",
  ps1: "powershell",
  psm1: "powershell",
  bat: "windows",
  cmd: "windows",
  asm: "assembly",
  s: "assembly",
  wasm: "wasm",
  sol: "solidity",
  tf: "terraform",
  tfvars: "terraform",

  // GraphQL
  graphql: "graphql",
  gql: "graphql",

  // Prisma / DB
  prisma: "prisma",
  sql: "database",
  sqlite: "sqlite",
  db: "database",

  // Other
  lock: "lock",
  log: "log",
  diff: "diff",
  patch: "diff",
  zip: "zip",
  tar: "zip",
  gz: "zip",
  rar: "zip",
  "7z": "zip",
  bin: "binary",
  exe: "windows",
  dmg: "macos",
  deb: "linux",
  rpm: "linux",
  cert: "certificate",
  pem: "certificate",
  crt: "certificate",
  key: "key",
  gpg: "key",
  proto: "proto",
  ipynb: "jupyter",
  vue: "vue",
  svelte: "svelte",
  astro: "astro",
  mdoc: "mdx",
  http: "http",
  rest: "http",
  hbs: "handlebars",
  mustache: "handlebars",
  ejs: "ejs",
  njk: "nunjucks",
  pug: "pug",
};

// ---------------------------------------------------------------------------
// Folder name → icon slug (without "folder-" prefix — added automatically)
// ---------------------------------------------------------------------------
const FOLDER_NAME_MAP: Record<string, string> = {
  // Common source folders
  src: "src",
  source: "src",
  lib: "lib",
  libs: "lib",
  library: "lib",
  dist: "dist",
  build: "dist",
  out: "dist",
  output: "dist",
  bin: "dist",
  release: "dist",

  // UI / Frontend
  components: "components",
  component: "components",
  ui: "ui",
  views: "views",
  view: "views",
  pages: "app",
  page: "app",
  layouts: "layout",
  layout: "layout",
  screens: "views",
  widgets: "components",
  atoms: "components",
  molecules: "components",
  organisms: "organism",
  templates: "template",
  partials: "template",
  shared: "shared",

  // Styles
  styles: "css",
  style: "css",
  css: "css",
  scss: "sass",
  sass: "sass",
  less: "less",
  themes: "theme",
  theme: "theme",
  fonts: "font",
  font: "font",

  // Assets
  assets: "images",
  images: "images",
  img: "images",
  icons: "svg",
  icon: "svg",
  svg: "svg",
  media: "video",
  videos: "video",
  audio: "audio",
  sounds: "audio",
  public: "public",
  static: "public",

  // Logic / Backend
  hooks: "hook",
  hook: "hook",
  store: "store",
  stores: "store",
  state: "store",
  redux: "store",
  context: "context",
  contexts: "context",
  providers: "context",
  utils: "utils",
  util: "utils",
  helpers: "helper",
  helper: "helper",
  services: "server",
  service: "server",
  api: "api",
  apis: "api",
  routes: "routes",
  route: "routes",
  router: "routes",
  middleware: "middleware",
  middlewares: "middleware",
  controllers: "controller",
  controller: "controller",
  models: "database",
  model: "database",
  entities: "database",
  migrations: "migrations",
  seeders: "seeders",
  repositories: "repository",
  repository: "repository",
  resolvers: "resolver",
  resolver: "resolver",
  guards: "guard",
  interceptors: "interceptor",
  decorators: "decorators",
  pipes: "pipe",
  filters: "filter",
  validators: "contract",
  interfaces: "interface",
  types: "typescript",
  type: "typescript",

  // Config / Meta
  config: "config",
  configs: "config",
  configuration: "config",
  settings: "config",
  env: "environment",
  envs: "environment",
  environments: "environment",
  scripts: "scripts",
  script: "scripts",
  tools: "tools",
  tasks: "tasks",
  jobs: "job",
  cron: "job",
  workers: "server",
  functions: "functions",
  lambda: "functions",
  serverless: "serverless",

  // Testing
  tests: "test",
  test: "test",
  __tests__: "test",
  specs: "test",
  spec: "test",
  e2e: "test",
  mocks: "mock",
  mock: "mock",
  fixtures: "mock",
  stubs: "mock",
  coverage: "coverage",
  snapshots: "mock",

  // Documentation
  docs: "docs",
  doc: "docs",
  documentation: "docs",
  wiki: "docs",
  guides: "docs",
  notebooks: "jupyter",
  examples: "examples",
  demos: "examples",
  samples: "examples",
  playground: "sandbox",
  sandbox: "sandbox",

  // Tooling
  ".github": "github",
  ".gitlab": "gitlab",
  ".git": "git",
  ".husky": "husky",
  ".vscode": "vscode",
  ".idea": "intellij",
  ".storybook": "storybook",
  ".next": "next",
  ".nuxt": "nuxt",
  ".svelte-kit": "svelte",
  ".expo": "expo",
  node_modules: "node",
  ".node_modules": "node",
  packages: "packages",
  plugins: "plugin",
  extensions: "plugin",
  addons: "plugin",

  // Infrastructure
  docker: "docker",
  kubernetes: "kubernetes",
  k8s: "kubernetes",
  terraform: "terraform",
  ansible: "ansible",
  helm: "helm",
  ci: "ci",
  ".ci": "ci",
  ".circleci": "circleci",
  ".github/workflows": "gh-workflows",
  workflows: "gh-workflows",
  pipeline: "ci",

  // Cloud
  aws: "aws",
  gcp: "cloud-functions",
  azure: "azure-pipelines",
  cloudflare: "cloudflare",
  firebase: "firebase",
  supabase: "supabase",
  vercel: "vercel",
  netlify: "netlify",

  // Lang-specific
  python: "python",
  java: "java",
  kotlin: "dart",
  rust: "rust",
  go: "godot",
  ruby: "root",
  php: "php",
  scala: "scala",
  graphql: "graphql",
  prisma: "prisma",
  drizzle: "drizzle",

  // Misc
  logs: "log",
  log: "log",
  tmp: "temp",
  temp: "temp",
  cache: "temp",
  backup: "backup",
  backups: "backup",
  archive: "archive",
  archives: "archive",
  download: "download",
  downloads: "download",
  upload: "upload",
  uploads: "upload",
  keys: "keys",
  secrets: "secure",
  certs: "secure",
  ssl: "secure",
  security: "secure",
  reports: "pdf",
  analytics: "benchmark",
  metrics: "benchmark",
  monitoring: "benchmark",
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function getExtension(filename: string): string {
  const dotIdx = filename.lastIndexOf(".");
  if (dotIdx === -1 || dotIdx === 0) return "";
  return filename.slice(dotIdx + 1).toLowerCase();
}

/**
 * Returns the URL for a file icon, e.g. `/material-icons/typescript.svg`
 */
export function getFileIconUrl(filename: string): string {
  const lower = filename.toLowerCase();

  // 1. Exact filename match
  const byName = FILE_NAME_MAP[filename] ?? FILE_NAME_MAP[lower];
  if (byName) return `${BASE}/${byName}.svg`;

  // 2. Extension match
  const ext = getExtension(filename);
  const byExt = ext ? EXT_MAP[ext] : undefined;
  if (byExt) return `${BASE}/${byExt}.svg`;

  // 3. Fallback
  return `${BASE}/file.svg`;
}

/**
 * Returns the URL for a folder icon, e.g. `/material-icons/folder-src.svg`
 * Handles open/closed state automatically.
 */
export function getFolderIconUrl(name: string, isOpen: boolean): string {
  const lower = name.toLowerCase();
  const slug = FOLDER_NAME_MAP[name] ?? FOLDER_NAME_MAP[lower];

  if (slug) {
    const openSuffix = isOpen ? "-open" : "";
    return `${BASE}/folder-${slug}${openSuffix}.svg`;
  }

  return isOpen ? `${BASE}/folder-open.svg` : `${BASE}/folder.svg`;
}
