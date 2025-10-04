import { ReactNode } from "react";

type Card = { children: ReactNode; className?: string };
type CardProps = { children: ReactNode; className?: string };
type CardHeaderProps = { children: ReactNode; className?: string };
type CardTitleProps = { children: ReactNode; className?: string };
type CardContentProps = { children: ReactNode; className?: string };

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 shadow-md ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return <div className={`mb-2 flex items-center justify-between ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return <h2 className={`text-lg font-semibold text-[var(--color-text)] ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return <div className={`text-[var(--color-text-muted)] ${className}`}>{children}</div>;
}

// export default Card;  <- ไม่จำเป็นเพราะเรา export หลายตัว
