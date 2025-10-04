"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type SelectContextType = {
  value?: string;
  onValueChange?: (val: string) => void;
  toggleOpen?: () => void;
  isOpen?: boolean;
};

const SelectContext = createContext<SelectContextType>({});

type SelectProps = {
  value?: string;
  onValueChange?: (val: string) => void;
  children: ReactNode;
};

export function Select({ value, onValueChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = useState<string | undefined>(value);
  const [isOpen, setIsOpen] = useState(false);

  const handleValueChange = (val: string) => {
    setInternalValue(val);
    onValueChange && onValueChange(val);
    setIsOpen(false);
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <SelectContext.Provider
      value={{ value: internalValue, onValueChange: handleValueChange, toggleOpen, isOpen }}
    >
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
}

type SelectTriggerProps = { children: ReactNode };
export function SelectTrigger({ children }: SelectTriggerProps) {
  const { toggleOpen } = useContext(SelectContext);
  return (
    <button
      type="button"
      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)]
                 bg-[var(--color-bg-card)] text-[var(--color-text)] text-left
                 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      onClick={toggleOpen}
    >
      {children}
    </button>
  );
}

type SelectValueProps = {
  placeholder?: string;
  children?: ReactNode;
};
export function SelectValue({ placeholder, children }: SelectValueProps) {
  const { value } = useContext(SelectContext);
  return <span>{children ?? value ?? placeholder}</span>;
}

type SelectContentProps = { children: ReactNode };
export function SelectContent({ children }: SelectContentProps) {
  const { isOpen } = useContext(SelectContext);
  if (!isOpen) return null;
  return (
    <div className="absolute mt-1 w-full rounded-lg border bg-gray-700 shadow z-50">
      {children}
    </div>
  );
}

type SelectItemProps = { value: string; children: ReactNode };
export function SelectItem({ value, children }: SelectItemProps) {
  const { onValueChange } = useContext(SelectContext);
  return (
    <div
      className="px-3 py-2 hover:bg-gray-600 cursor-pointer"
      onClick={() => onValueChange && onValueChange(value)}
    >
      {children}
    </div>
  );
}

export default Select;
