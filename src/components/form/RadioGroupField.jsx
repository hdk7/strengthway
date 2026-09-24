import FormLabel from "./FormLabel";
import FormError from "./FormError";

export default function RadioGroupField({
  label,
  required = false,
  error,
  hint,
  name,
  value,
  onChange,
  options = [],
  direction = "horizontal",
  size = "md",
  className = "",
}) {
  const containerDir =
    direction === "horizontal"
      ? "flex flex-wrap items-center gap-4"
      : "flex flex-col gap-2.5";

  return (
    <div className={`flex flex-col text-left ${className}`}>
      {label && (
        <FormLabel required={required} hint={hint} size={size}>
          {label}
        </FormLabel>
      )}

      <div className={containerDir}>
        {options.map((opt) => {
          const optValue = typeof opt === "object" ? opt.value : opt;
          const optLabel = typeof opt === "object" ? opt.label : opt;
          const optDesc = typeof opt === "object" ? opt.description : null;
          const optDisabled = typeof opt === "object" ? opt.disabled : false;
          const isSelected = String(value) === String(optValue);

          return (
            <label
              key={optValue}
              className={`inline-flex items-center gap-2 cursor-pointer select-none ${
                optDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <input
                type="radio"
                name={name}
                value={optValue}
                checked={isSelected}
                onChange={() => onChange?.(optValue)}
                disabled={optDisabled}
                className="h-4 w-4 border-border bg-background text-primary focus:ring-1 focus:ring-accent accent-accent cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {optLabel}
              </span>
              {optDesc && (
                <span className="text-xs text-muted-foreground">({optDesc})</span>
              )}
            </label>
          );
        })}
      </div>

      <FormError error={error} />
    </div>
  );
}
