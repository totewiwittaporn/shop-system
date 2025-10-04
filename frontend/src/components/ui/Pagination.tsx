type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-lg border border-[var(--color-border)] text-[var(--color-text)]
                   bg-[var(--color-bg-card)] disabled:opacity-90"
      >
        ก่อนหน้า
      </button>

      <span className="text-[var(--color-text-muted)]">
        {currentPage} / {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded-lg border border-[var(--color-border)] text-[var(--color-text)]
                   bg-[var(--color-bg-card)] disabled:opacity-90"
      >
        ถัดไป
      </button>
    </div>
  );
}
