import { useId, forwardRef } from "react";
import { FormLabel, FormError } from "./FormField";

const TextareaField = forwardRef(function TextareaField(
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
    placeholder,
    rows = 3,
    maxLength,
    showCount = false,
    disabled = false,
    readOnly = false,
    size = "md",
    resize = "none",
    className = "",
    textareaClassName = "",
    labelClassName = "",
    helperText,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId || (name ? `textarea-${name}` : generatedId);
  const errorId = error ? `${id}-error` : undefined;

  const sizeStyles = size === "sm" ? "p-3 text-xs rounded-lg" : "p-3.5 text-sm rounded-lg";

  const stateStyles = error
    ? "border-destructive bg-destructive/5 text-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
    : "border-slate-200/90 dark:border-border hover:border-slate-300 dark:hover:border-border/80 focus:border-[#1e40af] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-card focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30";

  const currentLength = typeof value === "string" ? value.length : 0;

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
        <textarea
          ref={ref}
          id={id}
          name={name}
          rows={rows}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          style={{ resize }}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={`w-full border bg-slate-50/90 dark:bg-muted/40 text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-muted/20 disabled:hover:border-slate-200/90 ${sizeStyles} ${stateStyles} ${textareaClassName}`}
          {...props}
        />
      </div>

      <div className="flex items-center justify-between">
        <FormError error={error} id={errorId} />
        {helperText && !error && (
          <p className="mt-1 text-[11px] text-muted-foreground">{helperText}</p>
        )}
        {showCount && maxLength && (
          <span className="ml-auto text-[11px] text-muted-foreground pt-1">
            {currentLength} / {maxLength}
          </span>
        )}
      </div>
    </div>
  );
});

export default TextareaField;
