import { useDataTable } from "./useDataTable";
import DataTableToolbar from "./DataTableToolbar";
import DataTableContent from "./DataTableContent";
import Pagination from "./Pagination";

/**
 * Universal, Reusable Standardized Data Table Component
 *
 * Requirements:
 * - Standardized floating card-row layout & styling across all modules
 * - Fixed limit of 7 rows per page by default
 * - Fixed pagination controls pinned at bottom of table container
 * - Independent vertical scrolling in content area without page-level overflow
 * - Declarative columns OR custom row rendering
 */
export default function DataTable({
  // Core Data & Columns
  columns = [],
  data = [],
  keyField = "id",
  onRowClick,
  compact = false,
  renderRow,
  children,

  // Optional Header & Primary Actions
  title,
  icon,
  badge,
  actions,
  toolbar,
  showToolbar, // true, false, or undefined (auto)

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
  filterPosition = "right",
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

  // Pagination (Fixed 7 rows per page by default)
  pageSize = 7,
  itemLabel = "records",
  showPagination = true,
  manualPagination = false,
  currentPage: controlledCurrentPage,
  totalPages: controlledTotalPages,
  totalItems: controlledTotalItems,
  onPageChange: controlledOnPageChange,

  // Loading & Empty States
  isLoading = false,
  loading = false,
  loadingRowsCount = 7,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  emptyAction,

  // Styling Customization
  className = "",
  tableClassName = "",
  theadClassName = "",
}) {
  const isDataLoading = Boolean(isLoading || loading);

  const {
    paginatedData: hookPaginatedData,
    totalEntries: hookTotalEntries,
    totalPages: hookTotalPages,
    safePage: hookSafePage,
    setCurrentPage: hookSetCurrentPage,
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
    currentPage: controlledCurrentPage,
    onPageChange: controlledOnPageChange,
  });

  const showDateFilter = Boolean(dateField || enableDateFilter);
  const hasActiveFilters = Boolean(
    searchQuery ||
    (activeFilter && activeFilter !== "All") ||
    activeDateRange.startDate ||
    activeDateRange.endDate ||
    (filterDropdown?.value && filterDropdown.value !== "All")
  );

  // Determine whether to show toolbar
  const shouldShowToolbar =
    showToolbar !== undefined
      ? Boolean(showToolbar)
      : Boolean(
          toolbar ||
          title ||
          icon ||
          badge ||
          actions ||
          (searchable && (searchPlaceholder || searchFields.length > 0)) ||
          showDateFilter ||
          (filterOptions && filterOptions.length > 0) ||
          (sortOptions && sortOptions.length > 0) ||
          filterDropdown
        );

  // Pagination resolutions
  const effectivePaginatedData = manualPagination ? data : hookPaginatedData;
  const effectiveTotalEntries = controlledTotalItems !== undefined ? controlledTotalItems : hookTotalEntries;
  const effectiveTotalPages = controlledTotalPages !== undefined ? controlledTotalPages : hookTotalPages;
  const effectiveSafePage = controlledCurrentPage !== undefined ? controlledCurrentPage : hookSafePage;
  const effectiveOnPageChange = controlledOnPageChange || hookSetCurrentPage;

  return (
    <div className={`flex-1 min-h-0 h-full flex flex-col justify-between overflow-hidden gap-2 ${className}`}>
      {/* 1. Toolbar (Optional or Custom) */}
      {shouldShowToolbar && (
        toolbar ? (
          <div className="shrink-0">{toolbar}</div>
        ) : (
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
            filterPosition={filterPosition}
            compact={compact}
          />
        )
      )}

      {/* 2. Independent Scrollable Content Area with Separated Card Rows */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <DataTableContent
          columns={columns}
          paginatedData={effectivePaginatedData}
          keyField={keyField}
          onRowClick={onRowClick}
          compact={compact}
          isLoading={isDataLoading}
          loadingRowsCount={loadingRowsCount}
          renderRow={renderRow}
          children={children}
          emptyIcon={emptyIcon}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
          emptyAction={emptyAction}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetAllFilters}
          tableClassName={tableClassName}
          theadClassName={theadClassName}
        />
      </div>

      {/* 3. Fixed Bottom Viewport Pagination */}
      {showPagination && pageSize ? (
        <div className="shrink-0 mt-auto pt-2 border-t border-border/40 bg-background/95 backdrop-blur-xs">
          <Pagination
            currentPage={effectiveSafePage}
            totalPages={effectiveTotalPages}
            totalItems={effectiveTotalEntries}
            pageSize={pageSize}
            onPageChange={effectiveOnPageChange}
            itemLabel={itemLabel}
            compact={compact}
            className="shrink-0"
          />
        </div>
      ) : null}
    </div>
  );
}
