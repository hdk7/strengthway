import { LayoutGrid, List, Plus } from "lucide-react";
import { SearchInput } from "@/components/ui";

export function PortfolioToolbar({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  placeholder = "Search title, tag...",
  onAddItem,
  addItemLabel = "Add Item",
  children,
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
      {/* Search Bar */}
      <SearchInput
        placeholder={placeholder}
        value={searchQuery || ""}
        onChange={(e) => setSearchQuery?.(e.target.value)}
        className="w-full sm:w-56 md:w-64"
      />

      {/* View Mode Toggle */}
      <div className="flex items-center border border-border rounded-xl p-0.5 bg-background shrink-0">
        <button
          type="button"
          onClick={() => setViewMode?.("grid")}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            viewMode === "grid"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Grid View"
        >
          <LayoutGrid size={15} />
        </button>
        <button
          type="button"
          onClick={() => setViewMode?.("table")}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            viewMode === "table"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Table View"
        >
          <List size={15} />
        </button>
      </div>

      {/* Add Button or Children (placed after toggle button) */}
      {children}

      {!children && onAddItem && (
        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-xs hover:bg-primary/90 transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus size={15} />
          <span>{addItemLabel}</span>
        </button>
      )}
    </div>
  );
}

export default PortfolioToolbar;
