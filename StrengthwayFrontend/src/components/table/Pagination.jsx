import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Universal Reusable Pagination Component
 * Supports page buttons, smart ellipsis, per-page selector, and item range counters.
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize = 5,
  pageSizeOptions,
  onPageSizeChange,
  onPageChange,
  itemLabel = "entries",
  itemName,
  showItemCount = true,
  compact = false,
  variant = "transparent",
  className = "",
}) => {
  const effectiveItemLabel = itemName || itemLabel;
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

  const btnSize = compact ? "w-7.5 h-7.5 text-xs" : "w-8 h-8 text-xs sm:text-sm";

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground select-none shrink-0 bg-transparent px-1 py-2 sm:py-2.5 ${className}`}
    >
      {/* Left: Item Counter & optional Page Size Selector */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        {showItemCount && totalItems !== undefined && (
          <span className="text-xs font-normal text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">{startItem}</span> to{" "}
            <span className="font-semibold text-foreground">{endItem}</span> of{" "}
            <span className="font-semibold text-foreground">{totalItems}</span>{" "}
            {effectiveItemLabel}
          </span>
        )}

        {pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange && (
          <div className="flex items-center gap-2 pl-3 border-l border-border/60">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 px-2 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer transition-colors shadow-2xs"
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

      {/* Page Navigation Controls matching reference styling */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Previous Page Button */}
        <button
          type="button"
          disabled={safePage === 1 || totalItems === 0}
          onClick={() => onPageChange && onPageChange(safePage - 1)}
          aria-label="Previous page"
          className={`${btnSize} rounded-full border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-all shadow-2xs active:scale-95`}
        >
          <ChevronLeft size={compact ? 13 : 14} />
        </button>

        {/* Page Number Buttons */}
        {pageNumbers.map((p, idx) => {
          if (typeof p === "string") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className={`${btnSize} flex items-center justify-center text-muted-foreground text-xs select-none`}
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
              className={`${btnSize} rounded-full transition-all cursor-pointer flex items-center justify-center ${
                isActive && totalItems !== 0
                  ? "bg-[#c57463] text-white font-bold shadow-xs ring-2 ring-[#c57463]/20"
                  : "border border-border/80 hover:border-foreground/30 bg-card text-foreground hover:bg-muted font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs active:scale-95"
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
          className={`${btnSize} rounded-full border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-all shadow-2xs active:scale-95`}
        >
          <ChevronRight size={compact ? 13 : 14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
