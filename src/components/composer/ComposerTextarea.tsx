import { useRef, useEffect } from "react";

interface ComposerTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ComposerTextarea({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask Operator anything, @ to add files, / for commands...",
  disabled = false,
}: ComposerTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  }

  return (
    <textarea
      ref={ref}
      className="vscode-scrollable w-full resize-none bg-transparent px-3 py-2.5 text-[13px] leading-relaxed focus:outline-none"
      style={{
        color: "var(--vscode-sidebar-foreground)",
        minHeight: "44px",
        maxHeight: "200px",
      }}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      rows={1}
    />
  );
}
