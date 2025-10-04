// ui/Input.tsx
import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>; // รองรับทุก prop ของ <input>

export default function Input({ type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      {...props} // ส่งต่อทุก props เช่น value, onChange, placeholder, required ฯลฯ
      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)]
                 bg-[var(--color-bg-card)] text-[var(--color-text)]
                 placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2
                 focus:ring-[var(--color-primary)]"
    />
  );
}
