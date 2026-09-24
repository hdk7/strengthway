import { useId, forwardRef } from "react";
import FormLabel from "./FormLabel";
import FormError from "./FormError";

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

  const sizeStyles = size === "sm" ? "p-3 text-xs rounded-lg" : "p-3.5 text-sm rounded-xl";

  const stateStyles = error
    ? "border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive"
    : "border-border focus:border-primary focus:ring-1 focus:ring-primary/20";

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
          className={`w-full border bg-background text-foreground placeholder:text-muted-foreground/60 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles} ${stateStyles} ${textareaClassName}`}
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
