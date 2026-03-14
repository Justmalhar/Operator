import type { Repo } from "@/types/workspace";

export const mockRepos: Repo[] = [
  {
    id: "mw-academy",
    name: "mw-academy",
    avatarLetter: "M",
    workspaces: [],
    isExpanded: false,
  },
  {
    id: "mobiiworld-academy",
    name: "mobiiworld-academy",
    avatarLetter: "M",
    workspaces: [
      {
        id: "ws-dev",
        name: "Dev",
        branch: "Dev",
        status: "idle",
        agentCount: 1,
      },
    ],
    isExpanded: true,
  },
  {
    id: "mobiiworld-skills-lib",
    name: "Mobiiworld Skills Library",
    avatarLetter: "M",
    workspaces: [
      {
        id: "ws-mobii-skills",
        name: "Mobiiworld skills library",
        branch: "Mobiiworld skills library",
        status: "idle",
        agentCount: 2,
      },
    ],
    isExpanded: true,
  },
  {
    id: "operator",
    name: "Operator",
    avatarLetter: "O",
    iconVariant: "chain",
    workspaces: [
      {
        id: "ws-los-angeles",
        name: "Los angeles",
        branch: "Los angeles",
        status: "running",
        agentCount: 3,
      },
    ],
    isExpanded: true,
  },
];
