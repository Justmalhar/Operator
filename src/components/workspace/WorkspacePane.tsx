import type { ReactNode } from "react";
import { WorkspaceTabs, type WorkspaceFileTab } from "./WorkspaceTabs";

export interface WorkspacePaneProps {
  tabs: WorkspaceFileTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  emptyState?: ReactNode;
  className?: string;
}

export function WorkspacePane(props: WorkspacePaneProps) {
  return <WorkspaceTabs {...props} />;
}
