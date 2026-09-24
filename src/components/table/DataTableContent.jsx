import { Inbox } from "lucide-react";

export default function DataTableContent({
  columns = [],
  paginatedData = [],
  keyField = "id",
  onRowClick,
  compact = false,
  isLoading = false,
  loadingRowsCount = 6,
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = "No records found",
  emptyMessage = "Try adjusting your search query or filters.",
  emptyAction,
  hasActiveFilters = false,
  onResetFilters,
  tableClassName = "",
}) {
  const cellPadding = compact ? "py-2 px-3" : "py-3.5 px-4";
  const headerPadding = compact ? "py-2 px-3" : "py-3 px-4";

  const getAlignmentClass = (align) => {
    if (align === "right") return "text-right";
    if (align === "center") return "text-center";
    return "text-left";
  };

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto no-scrollbar">
          <table className={`w-full text-left border-collapse ${tableClassName}`}>
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {columns.map((col) => (
                  <th
                    key={col.key || col.accessorKey}
                    className={`${headerPadding} ${getAlignmentClass(col.align)} ${col.width || ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {Array.from({ length: loadingRowsCount }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={`sk-${col.key || col.accessorKey}-${rIdx}`} className={`${cellPadding} align-middle`}>
                      <div className="h-4 bg-muted rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 2. Empty State
  if (paginatedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-2xl text-center shadow-xs flex-1">
        <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
          <EmptyIcon size={24} />
        </div>
        <h3 className="text-base font-bold text-foreground">{emptyTitle}</h3>
        {emptyMessage && (
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {emptyMessage}
          </p>
        )}
        {emptyAction ? (
          <div className="mt-4">{emptyAction}</div>
        ) : (
          hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/80 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )
        )}
      </div>
    );
  }

  // 3. Render Table
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <div className="overflow-x-auto no-scrollbar">
        <table className={`w-full text-left border-collapse ${tableClassName}`}>
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {columns.map((col) => {
                const colKey = col.key || col.accessorKey;
                return (
                  <th
                    key={colKey}
                    className={`${headerPadding} ${getAlignmentClass(col.align)} ${
                      col.width || ""
                    } ${col.headerClassName || ""}`}
                  >
                    <span>{col.header}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {paginatedData.map((row, rowIdx) => {
              const rowKey = row[keyField] || `row-${rowIdx}`;

              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row, rowIdx)}
                  className={`hover:bg-muted/40 transition-colors ${
                    onRowClick ? "cursor-pointer group" : ""
                  }`}
                >
                  {columns.map((col) => {
                    const cellContent = col.cell
                      ? col.cell(row, rowIdx)
                      : col.accessorKey
                      ? row[col.accessorKey]
                      : null;

                    return (
                      <td
                        key={`cell-${col.key || col.accessorKey}-${rowKey}`}
                        className={`${cellPadding} align-middle ${getAlignmentClass(
                          col.align
                        )} ${col.className || ""}`}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
