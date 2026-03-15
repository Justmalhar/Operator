import { useCallback, useState } from "react";
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
 */
export function FileIcon({
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

  const [src, setSrc] = useState(primaryUrl);

  // If the primary icon fails (e.g. a specific open variant doesn't exist),
  // fall back gracefully — but only once to avoid infinite loop.
  const handleError = useCallback(() => {
    if (src !== fallbackUrl) setSrc(fallbackUrl);
  }, [src, fallbackUrl]);

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      draggable={false}
      onError={handleError}
      className={className}
      style={{ flexShrink: 0 }}
    />
  );
}
