import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Universal Reusable Pagination Component
 * Supports page buttons, smart ellipsis, per-page selector, and item range counters.
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  onPageChange,
  itemLabel = "entries",
  showItemCount = true,
  compact = false,
  className = "",
}) => {
  if (totalPages < 1 && !totalItems) return null;

  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));

  // Generate page numbers with smart ellipsis for large page counts
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages || 1 }, (_, i) => i + 1);
    }

    const pages = [];
    pages.push(1);

    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);

    if (start > 2) {
      pages.push("ellipsis-left");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push("ellipsis-right");
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Item counter range calculations
  const startItem =
    totalItems === 0
      ? 0
      : pageSize
      ? (safePage - 1) * pageSize + 1
      : 1;
  const endItem =
    pageSize && totalItems !== undefined
      ? Math.min(safePage * pageSize, totalItems)
      : totalItems || 0;

  const btnSize = compact ? "w-7 h-7 text-[11px]" : "w-8 h-8 text-xs";

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-border bg-card/60 text-xs text-muted-foreground ${className}`}
    >
      {/* Left: Item Counter & optional Page Size Selector */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        {showItemCount && totalItems !== undefined && (
          <span className="text-xs font-normal text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">{startItem}</span> to{" "}
            <span className="font-semibold text-foreground">{endItem}</span> of{" "}
            <span className="font-semibold text-foreground">{totalItems}</span>{" "}
            {itemLabel}
          </span>
        )}

        {pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-border">
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-6 px-1.5 rounded-lg border border-border bg-card text-[11px] text-foreground focus:outline-none focus:border-primary cursor-pointer transition-colors"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Controls */}
      {totalPages >= 1 && (
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Previous Page Button */}
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => onPageChange && onPageChange(safePage - 1)}
            aria-label="Previous page"
            className={`${btnSize} rounded-xl border border-border hover:border-foreground/40 bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-all`}
          >
            <ChevronLeft size={compact ? 12 : 14} />
          </button>

          {/* Page Number Buttons */}
          {pageNumbers.map((p, idx) => {
            if (typeof p === "string") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className={`${btnSize} flex items-center justify-center text-muted-foreground select-none`}
                >
                  •••
                </span>
              );
            }

            const isActive = p === safePage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange && onPageChange(p)}
                aria-current={isActive ? "page" : undefined}
                className={`${btnSize} rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "border border-border hover:border-foreground/40 bg-card text-foreground hover:bg-muted font-normal"
                }`}
              >
                {p}
              </button>
            );
          })}

          {/* Next Page Button */}
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => onPageChange && onPageChange(safePage + 1)}
            aria-label="Next page"
            className={`${btnSize} rounded-xl border border-border hover:border-foreground/40 bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-all`}
          >
            <ChevronRight size={compact ? 12 : 14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
