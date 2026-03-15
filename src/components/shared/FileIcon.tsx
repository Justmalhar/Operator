import { memo, useState } from "react";
import { getFileIconUrl, getFolderIconUrl } from "@/lib/file-icons";

interface FileIconProps {
  filename: string;
  isDir?: boolean;
  isOpen?: boolean;
  size?: number;
  className?: string;
}

/**
 * Renders a Material Icon Theme SVG for a given file or folder name.
 * Falls back to the generic file/folder icon if the specific one fails to load.
 *
 * Uses a "failed URL" tracking pattern instead of storing `src` in state so
 * that prop changes (e.g. isOpen toggling) correctly update the displayed icon.
 */
export const FileIcon = memo(function FileIcon({
  filename,
  isDir = false,
  isOpen = false,
  size = 14,
  className,
}: FileIconProps) {
  const primaryUrl = isDir
    ? getFolderIconUrl(filename, isOpen)
    : getFileIconUrl(filename);

  const fallbackUrl = isDir
    ? isOpen
      ? "/material-icons/folder-open.svg"
      : "/material-icons/folder.svg"
    : "/material-icons/file.svg";

  // Track which URL failed rather than storing src in state.
  // This way, when primaryUrl changes (e.g. folder open ↔ closed), the new
  // URL is tried immediately instead of staying stuck on the old stale src.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const src = failedUrl === primaryUrl ? fallbackUrl : primaryUrl;

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      draggable={false}
      onError={() => setFailedUrl(primaryUrl)}
      className={className}
      style={{ flexShrink: 0 }}
    />
  );
});
