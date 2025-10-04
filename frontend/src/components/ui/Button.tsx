// components/ui/Button.tsx
import { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  variant?:
    | "primary"
    | "success"
    | "danger"
    | "outline"
    | "secondary"
    | "destructive";
  size?: "sm" | "md" | "lg";
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void; // รองรับ event
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  fullWidth = false,
  type = "button",
  disabled = false,
}: ButtonProps) {
  const base = `rounded-lg font-medium transition ${
    fullWidth ? "w-full" : ""
  } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`;

  const sizeStyles: Record<string, string> = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  const variantStyles: Record<string, string> = {
    primary:
      "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
    success: "bg-[var(--color-success)] text-white hover:opacity-90",
    danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
    outline:
      "border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-bg-card)] hover:opacity-90",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300",
    destructive:
      "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${sizeStyles[size]} ${variantStyles[variant]}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
