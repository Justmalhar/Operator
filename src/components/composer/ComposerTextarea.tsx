import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ComposerTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSlashCommand?: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ComposerTextarea({
  value,
  onChange,
  onSubmit,
  onSlashCommand,
  placeholder = "Ask Operator anything, @ to add files, / for commands...",
  disabled,
  className,
}: ComposerTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
      return;
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    onChange(v);
    if (onSlashCommand && v.startsWith("/")) {
      onSlashCommand(v.slice(1));
    }
  }

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      rows={1}
      className={cn(
        "w-full resize-none bg-transparent text-[13px] leading-relaxed placeholder:opacity-40 focus:outline-none disabled:opacity-50",
        className,
      )}
      style={{
        color: "var(--vscode-editor-foreground)",
        minHeight: "22px",
        maxHeight: "240px",
        overflowY: "auto",
      }}
    />
  );
}
