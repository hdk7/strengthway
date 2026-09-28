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
  const effectiveTotalPages = Math.max(1, totalPages || 1);
  const safePage = Math.max(1, Math.min(currentPage, effectiveTotalPages));

  // Generate page numbers with smart ellipsis for large page counts
  const getPageNumbers = () => {
    if (effectiveTotalPages <= 7) {
      return Array.from({ length: effectiveTotalPages }, (_, i) => i + 1);
    }

    const pages = [];
    pages.push(1);

    const start = Math.max(2, safePage - 1);
    const end = Math.min(effectiveTotalPages - 1, safePage + 1);

    if (start > 2) {
      pages.push("ellipsis-left");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < effectiveTotalPages - 1) {
      pages.push("ellipsis-right");
    }

    pages.push(effectiveTotalPages);
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

  const btnSize = compact ? "w-8 h-8 sm:w-8.5 sm:h-8.5 text-xs sm:text-sm" : "w-8.5 h-8.5 sm:w-9 sm:h-9 text-xs sm:text-sm";

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-2 px-1 sm:px-2 py-1 text-xs sm:text-sm text-muted-foreground select-none shrink-0 ${className}`}
    >
      {/* Left: Item Counter & optional Page Size Selector */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        {showItemCount && totalItems !== undefined && (
          <span className="text-xs sm:text-sm font-normal text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">{startItem}</span> to{" "}
            <span className="font-semibold text-foreground">{endItem}</span> of{" "}
            <span className="font-semibold text-foreground">{totalItems}</span>{" "}
            {itemLabel}
          </span>
        )}

        {pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange && (
          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7.5 px-2 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer transition-colors"
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
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Previous Page Button */}
        <button
          type="button"
          disabled={safePage === 1 || totalItems === 0}
          onClick={() => onPageChange && onPageChange(safePage - 1)}
          aria-label="Previous page"
          className={`${btnSize} rounded-xl border border-border hover:border-foreground/40 bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-all`}
        >
          <ChevronLeft size={compact ? 15 : 16} />
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
              disabled={totalItems === 0}
              onClick={() => onPageChange && onPageChange(p)}
              aria-current={isActive ? "page" : undefined}
              className={`${btnSize} rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                isActive && totalItems !== 0
                  ? "bg-primary text-background font-bold shadow-xs"
                  : "border border-border hover:border-foreground/40 bg-card text-foreground hover:bg-muted font-normal disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next Page Button */}
        <button
          type="button"
          disabled={safePage === effectiveTotalPages || totalItems === 0}
          onClick={() => onPageChange && onPageChange(safePage + 1)}
          aria-label="Next page"
          className={`${btnSize} rounded-xl border border-border hover:border-foreground/40 bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-all`}
        >
          <ChevronRight size={compact ? 15 : 16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
