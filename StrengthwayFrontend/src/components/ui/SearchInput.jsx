import { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SEARCH_SIZES = {
  sm: "h-9 pl-8 pr-7 text-xs",
  md: "h-10 pl-9 pr-8 text-xs sm:text-sm",
};

const ICON_SIZES = {
  sm: 14,
  md: 16,
};

export const SearchInput = forwardRef(function SearchInput(
  {
    value = "",
    onChange,
    onClear,
    placeholder = "Search...",
    size = "md",
    className = "",
    inputClassName = "",
    disabled = false,
    ...props
  },
  ref,
) {
  const iconSize = ICON_SIZES[size] || ICON_SIZES.md;
  const sizeStyles = SEARCH_SIZES[size] || SEARCH_SIZES.md;

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: "" } });
    }
  };

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <Search
        size={iconSize}
        className="pointer-events-none absolute left-3 text-muted-foreground shrink-0"
      />

      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border border-slate-200/90 dark:border-border bg-slate-50/90 dark:bg-muted/40 text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground/60 outline-none transition-all hover:border-slate-300 dark:hover:border-border/80 focus:border-blue-800 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-card focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed",
          sizeStyles,
          inputClassName,
        )}
        {...props}
      />

      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          title="Clear search"
        >
          <X size={iconSize - 2} />
        </button>
      )}
    </div>
  );
});

export default SearchInput;
