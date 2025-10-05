// ui/Input.tsx
"use client";

import React, { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const baseClass =
  "w-full px-3 py-2 rounded-lg border border-[var(--color-border)] " +
  "bg-[var(--color-bg-card)] text-[var(--color-text)] " +
  "placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 " +
  "focus:ring-[var(--color-primary)]";

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { type = "text", className, ...props },
  ref
) {
  // รวม className ภายนอก ไม่ทับของเดิม
  const cn = className ? `${baseClass} ${className}` : baseClass;
  return <input ref={ref} type={type} className={cn} {...props} />;
});

export default Input;
