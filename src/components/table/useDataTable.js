import { useState, useMemo, useRef, useEffect } from "react";

export function useDataTable({
  data = [],
  columns = [],
  pageSize = 6,
  dateField,
  filterKey,
  searchFields = [],
  sortOptions = [],
  defaultSortBy = "",
  defaultSortOrder = "asc",
  searchValue: controlledSearchValue,
  onSearchChange: controlledOnSearchChange,
  filterValue: controlledFilterValue,
  onFilterChange: controlledOnFilterChange,
  dateRange: controlledDateRange,
  onDateRangeChange: controlledOnDateRangeChange,
  sortBy: controlledSortBy,
  sortOrder: controlledSortOrder,
  onSort: controlledOnSort,
  filterDropdown,
}) {
  const [internalSearch, setInternalSearch] = useState("");
  const [internalFilter, setInternalFilter] = useState("All");
  const [internalSortBy, setInternalSortBy] = useState(defaultSortBy);
  const [internalSortOrder, setInternalSortOrder] = useState(defaultSortOrder);
  const [internalDateRange, setInternalDateRange] = useState({ startDate: "", endDate: "" });
  const [currentPage, setCurrentPage] = useState(1);

  // Auto reset to page 1 when data length changes
  const prevLenRef = useRef(data.length);
  useEffect(() => {
    if (data.length > prevLenRef.current) setCurrentPage(1);
    prevLenRef.current = data.length;
  }, [data.length]);

  const searchQuery = controlledSearchValue !== undefined ? controlledSearchValue : internalSearch;
  const activeFilter = controlledFilterValue !== undefined ? controlledFilterValue : internalFilter;
  const activeDateRange = controlledDateRange !== undefined ? controlledDateRange : internalDateRange;
  const activeSortBy = controlledSortBy !== undefined ? controlledSortBy : internalSortBy;
  const activeSortOrder = controlledSortOrder !== undefined ? controlledSortOrder : internalSortOrder;

  const handleSearchChange = (val) => {
    if (controlledOnSearchChange) controlledOnSearchChange(val);
    else setInternalSearch(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (val) => {
    if (controlledOnFilterChange) controlledOnFilterChange(val);
    else setInternalFilter(val);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range) => {
    if (controlledOnDateRangeChange) controlledOnDateRangeChange(range);
    else setInternalDateRange(range);
    setCurrentPage(1);
  };

  const handleSortChange = (key, order = "asc") => {
    if (controlledOnSort) {
      controlledOnSort(key, order);
    } else {
      setInternalSortBy(key);
      setInternalSortOrder(order);
    }
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    handleSearchChange("");
    handleFilterChange("All");
    handleDateRangeChange({ startDate: "", endDate: "" });
    if (filterDropdown?.onChange) {
      filterDropdown.onChange("All");
    }
  };

  // Filter & Search Processing
  const processedData = useMemo(() => {
    let result = [...(data || [])];

    // 1. Filter Pills by filterKey
    if (filterKey && activeFilter && activeFilter !== "All") {
      result = result.filter((item) => {
        const itemVal = item[filterKey];
        if (typeof itemVal === "string") {
          return itemVal.toLowerCase() === activeFilter.toLowerCase();
        }
        return itemVal === activeFilter;
      });
    }

    // 2. Date Range Filtering
    if (dateField && (activeDateRange.startDate || activeDateRange.endDate)) {
      result = result.filter((item) => {
        const rawDate = item[dateField];
        if (!rawDate) return false;
        const dateStr = String(rawDate).split("T")[0];
        if (activeDateRange.startDate && dateStr < activeDateRange.startDate) {
          return false;
        }
        if (activeDateRange.endDate && dateStr > activeDateRange.endDate) {
          return false;
        }
        return true;
      });
    }

    // 3. Dropdown Filter
    if (
      filterDropdown &&
      filterDropdown.value &&
      filterDropdown.value !== "All" &&
      filterDropdown.value !== "All Locations"
    ) {
      const { key: fKey, value: fVal, filterFn } = filterDropdown;
      result = result.filter((item) => {
        if (typeof filterFn === "function") {
          return filterFn(item, fVal);
        }
        if (fKey) {
          const itemVal = item[fKey];
          if (itemVal === undefined || itemVal === null) return false;
          return String(itemVal).toLowerCase().includes(String(fVal).toLowerCase());
        }
        return true;
      });
    }

    // 4. Search Query
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        if (searchFields && searchFields.length > 0) {
          return searchFields.some((field) => {
            const val = item[field];
            return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
          });
        }
        return Object.values(item).some(
          (val) =>
            val !== undefined &&
            val !== null &&
            (typeof val === "string" || typeof val === "number") &&
            String(val).toLowerCase().includes(q)
        );
      });
    }

    // 5. Sorting
    if (activeSortBy) {
      const matchingOption = sortOptions.find((opt) => opt.value === activeSortBy);
      if (matchingOption && typeof matchingOption.compare === "function") {
        result.sort(matchingOption.compare);
      } else {
        const sortCol = columns.find(
          (c) => c.key === activeSortBy || c.accessorKey === activeSortBy
        );
        const accessor = sortCol?.accessorKey || activeSortBy;

        result.sort((a, b) => {
          const aVal = a[accessor];
          const bVal = b[accessor];

          if (aVal === undefined || aVal === null) return 1;
          if (bVal === undefined || bVal === null) return -1;

          let comp = 0;
          if (typeof aVal === "number" && typeof bVal === "number") {
            comp = aVal - bVal;
          } else if (aVal instanceof Date && bVal instanceof Date) {
            comp = aVal.getTime() - bVal.getTime();
          } else {
            comp = String(aVal).localeCompare(String(bVal));
          }

          return activeSortOrder === "desc" ? -comp : comp;
        });
      }
    }

    return result;
  }, [
    data,
    filterKey,
    activeFilter,
    dateField,
    activeDateRange,
    searchQuery,
    searchFields,
    activeSortBy,
    activeSortOrder,
    sortOptions,
    columns,
    filterDropdown,
  ]);

  // Pagination Slice
  const totalEntries = processedData.length;
  const totalPages = pageSize && pageSize > 0 ? Math.ceil(totalEntries / pageSize) : 1;
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  const paginatedData = useMemo(() => {
    if (!pageSize || pageSize <= 0) return processedData;
    const start = (safePage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, safePage, pageSize]);

  return {
    processedData,
    paginatedData,
    totalEntries,
    totalPages,
    safePage,
    currentPage,
    setCurrentPage,
    searchQuery,
    handleSearchChange,
    activeFilter,
    handleFilterChange,
    activeDateRange,
    handleDateRangeChange,
    activeSortBy,
    activeSortOrder,
    handleSortChange,
    resetAllFilters,
  };
}
