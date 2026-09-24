import { useDataTable } from "./useDataTable";
import DataTableToolbar from "./DataTableToolbar";
import DataTableContent from "./DataTableContent";
import Pagination from "./Pagination";

/**
 * Universal, Reusable Data Table Component
 *
 * Features:
 * - Declarative Column Definitions (`columns`)
 * - Built-in Search across specified or all string/numeric fields
 * - Built-in Date Range Picker
 * - Built-in Category/Status Filter Pills & Dropdown
 * - Built-in Sort Dropdown + Column Sorting
 * - Built-in Pagination with page size and item counter
 * - Built-in Empty State with automatic "Reset Filters" action
 * - Shimmer Skeleton Loading State
 * - Interactive Row Click handling
 */
export default function DataTable({
  // Core Data & Columns
  columns = [],
  data = [],
  keyField = "id",
  onRowClick,
  compact = false,

  // Optional Header & Primary Actions
  title,
  icon,
  badge,
  actions,

  // Built-in Search
  searchable = true,
  searchPlaceholder = "Search records...",
  searchFields = [],
  searchValue,
  onSearchChange,

  // Built-in Date Range Filter
  dateField,
  enableDateFilter = false,
  dateRange,
  onDateRangeChange,

  // Built-in Filter Pills / Dropdown
  filterKey,
  filterOptions = [],
  filterMode = "pills",
  filterLabel = "Filter",
  filterValue,
  onFilterChange,

  // Built-in Dropdown Filter Popover
  filterDropdown,

  // Built-in Sort Dropdown
  sortOptions = [],
  defaultSortBy = "",
  defaultSortOrder = "asc",
  sortBy,
  sortOrder,
  onSort,

  // Built-in Pagination
  pageSize = 6,
  itemLabel = "entries",

  // Loading & Empty States
  isLoading = false,
  loadingRowsCount = 6,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  emptyAction,

  // Styling Customization
  className = "",
  tableClassName = "",
}) {
  const {
    paginatedData,
    totalEntries,
    totalPages,
    safePage,
    setCurrentPage,
    searchQuery,
    handleSearchChange,
    activeFilter,
    handleFilterChange,
    activeDateRange,
    handleDateRangeChange,
    activeSortBy,
    handleSortChange,
    resetAllFilters,
  } = useDataTable({
    data,
    columns,
    pageSize,
    dateField,
    filterKey,
    searchFields,
    sortOptions,
    defaultSortBy,
    defaultSortOrder,
    searchValue,
    onSearchChange,
    filterValue,
    onFilterChange,
    dateRange,
    onDateRangeChange,
    sortBy,
    sortOrder,
    onSort,
    filterDropdown,
  });

  const showDateFilter = Boolean(dateField || enableDateFilter);
  const hasActiveFilters = Boolean(
    searchQuery ||
    (activeFilter && activeFilter !== "All") ||
    activeDateRange.startDate ||
    activeDateRange.endDate ||
    (filterDropdown?.value && filterDropdown.value !== "All")
  );

  return (
    <div className={`flex-1 flex flex-col min-h-0 space-y-3 ${className}`}>
      {/* 1. Unified Toolbar */}
      <DataTableToolbar
        title={title}
        icon={icon}
        badge={badge}
        actions={actions}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        showDateFilter={showDateFilter}
        activeDateRange={activeDateRange}
        onDateRangeChange={handleDateRangeChange}
        sortOptions={sortOptions}
        activeSortBy={activeSortBy}
        onSortChange={handleSortChange}
        filterDropdown={filterDropdown}
        filterOptions={filterOptions}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        filterMode={filterMode}
        filterLabel={filterLabel}
        compact={compact}
      />

      {/* 2. Content & States */}
      <DataTableContent
        columns={columns}
        paginatedData={paginatedData}
        keyField={keyField}
        onRowClick={onRowClick}
        compact={compact}
        isLoading={isLoading}
        loadingRowsCount={loadingRowsCount}
        emptyIcon={emptyIcon}
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
        emptyAction={emptyAction}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetAllFilters}
        tableClassName={tableClassName}
      />

      {/* 3. Pagination */}
      {pageSize && totalEntries > 0 && (
        <div className="shrink-0">
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={totalEntries}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            itemLabel={itemLabel}
            compact={compact}
          />
        </div>
      )}
    </div>
  );
}
