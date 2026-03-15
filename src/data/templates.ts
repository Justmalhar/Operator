import {
  Globe,
  Code2,
  BarChart2,
  Zap,
  FileCode2,
  type LucideIcon,
} from "lucide-react";

export interface HardcodedTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  sourcePath?: never;
}

export const HARDCODED_TEMPLATES: HardcodedTemplate[] = [
  { id: "nextjs",  name: "Next.js",  description: "App Router, TypeScript, Tailwind", icon: Globe },
  { id: "python",  name: "Python",   description: "uv, Flask, .env setup",            icon: Code2 },
  { id: "gradio",  name: "Gradio",   description: "ML demo UI with Python backend",   icon: BarChart2 },
  { id: "fastapi", name: "FastAPI",  description: "Async REST API with Pydantic",     icon: Zap },
  { id: "blank",   name: "Blank",    description: "Empty folder with git init",       icon: FileCode2 },
];
