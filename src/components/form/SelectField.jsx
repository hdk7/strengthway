import { useId, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import FormLabel from "./FormLabel";
import FormError from "./FormError";

const SelectField = forwardRef(function SelectField(
  {
    label,
    required = false,
    error,
    hint,
    id: providedId,
    name,
    value,
    onChange,
    onBlur,
    options,
    placeholder,
    disabled = false,
    size = "md",
    className = "",
    selectClassName = "",
    labelClassName = "",
    helperText,
    children,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId || (name ? `select-${name}` : generatedId);
  const errorId = error ? `${id}-error` : undefined;

  const sizeStyles =
    size === "sm" ? "px-3 py-2 text-xs rounded-lg" : "px-3.5 py-2.5 text-sm rounded-xl";

  const stateStyles = error
    ? "border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive"
    : "border-border focus:border-accent focus:ring-1 focus:ring-accent";

  return (
    <div className={`flex flex-col text-left ${className}`}>
      {label && (
        <FormLabel
          htmlFor={id}
          required={required}
          hint={hint}
          size={size}
          className={labelClassName}
        >
          {label}
        </FormLabel>
      )}

      <div className="relative w-full">
        <select
          ref={ref}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={cn(
            "w-full appearance-none border bg-background text-foreground outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
            sizeStyles,
            stateStyles,
            !value && "text-muted-foreground",
            selectClassName,
            "pr-10",
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-card text-muted-foreground">
              {placeholder}
            </option>
          )}

          {options &&
            options.map((opt) => {
              if (typeof opt === "object" && opt !== null) {
                return (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="bg-card text-foreground py-2"
                  >
                    {opt.label ?? opt.value}
                  </option>
                );
              }
              return (
                <option key={opt} value={opt} className="bg-card text-foreground py-2">
                  {opt}
                </option>
              );
            })}

          {children}
        </select>

        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform"
        />
      </div>

      <FormError error={error} id={errorId} />
      {helperText && !error && (
        <p className="mt-1 text-[11px] text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
});

export default SelectField;
