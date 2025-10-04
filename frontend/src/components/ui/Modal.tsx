import { ReactNode } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)]
                      rounded-xl p-6 w-96 shadow-lg">
        {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
        <div>{children}</div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 rounded-lg bg-[var(--color-danger)]
                     text-white hover:opacity-90"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}
