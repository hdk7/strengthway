import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import FormField from "./FormField";
import {
  useFieldId,
  getFormStateStyles,
  FORM_CONTROL_SIZES,
  FORM_CONTROL_BASE,
} from "./formStyles";

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
  const { id, errorId } = useFieldId(providedId, name, "select", error);
  const sizeStyles = FORM_CONTROL_SIZES[size] || FORM_CONTROL_SIZES.md;
  const stateStyles = getFormStateStyles(error);

  return (
    <FormField
      label={label}
      required={required}
      error={error}
      hint={hint}
      id={id}
      size={size}
      className={className}
      labelClassName={labelClassName}
      helperText={helperText}
    >
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
            FORM_CONTROL_BASE,
            "appearance-none cursor-pointer pr-10",
            sizeStyles,
            stateStyles,
            !value && "text-slate-400 dark:text-muted-foreground/60",
            selectClassName,
          )}
          {...props}
        >
          {placeholder && !options?.some((opt) => (typeof opt === "object" && opt !== null ? opt.value === "" : opt === "")) && (
            <option
              value=""
              className="bg-white dark:bg-card text-slate-700 dark:text-zinc-200 font-medium py-2"
            >
              {placeholder}
            </option>
          )}

          {options &&
            options.map((opt) => {
              if (typeof opt === "object" && opt !== null) {
                const isPlaceholder = opt.value === "";
                return (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className={cn(
                      "bg-white dark:bg-card py-2",
                      isPlaceholder
                        ? "text-slate-700 dark:text-zinc-200 font-medium"
                        : "text-slate-900 dark:text-zinc-100"
                    )}
                  >
                    {opt.label ?? opt.value}
                  </option>
                );
              }
              const isPlaceholder = opt === "";
              return (
                <option
                  key={opt}
                  value={opt}
                  className={cn(
                    "bg-white dark:bg-card py-2",
                    isPlaceholder
                      ? "text-slate-700 dark:text-zinc-200 font-medium"
                      : "text-slate-900 dark:text-zinc-100"
                  )}
                >
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
    </FormField>
  );
});

export default SelectField;
