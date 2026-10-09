import { useId, forwardRef } from "react";
import { FormLabel, FormError } from "./FormField";

const InputField = forwardRef(function InputField(
  {
    label,
    required = false,
    error,
    hint,
    id: providedId,
    name,
    type = "text",
    value,
    onChange,
    onBlur,
    onClick,
    placeholder,
    disabled = false,
    readOnly = false,
    startIcon,
    endAdornment,
    size = "md",
    className = "",
    inputClassName = "",
    labelClassName = "",
    helperText,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId || (name ? `input-${name}` : generatedId);
  const errorId = error ? `${id}-error` : undefined;

  const sizeStyles =
    size === "sm"
      ? "px-3 py-1.5 text-xs rounded-lg min-h-[36px]"
      : "px-3.5 py-2.5 text-sm rounded-lg min-h-[42px]";

  const paddingLeft = startIcon ? (size === "sm" ? "pl-9" : "pl-10") : "";
  const paddingRight = endAdornment ? (size === "sm" ? "pr-9" : "pr-10") : "";

  const stateStyles = error
    ? "border-destructive bg-destructive/5 text-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
    : "border-slate-200/90 dark:border-border hover:border-slate-300 dark:hover:border-border/80 focus:border-[#1e40af] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-card focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30";

  const handleDateClick = (e) => {
    if (type === "date" && typeof e.target.showPicker === "function") {
      try {
        e.target.showPicker();
      } catch {
        // ignore
      }
    }
    if (typeof onClick === "function") {
      onClick(e);
    }
  };

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

      <div className="relative flex items-center w-full">
        {startIcon && (
          <div className="pointer-events-none absolute left-3 flex items-center justify-center text-muted-foreground">
            {startIcon}
          </div>
        )}

        <input
          ref={ref}
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onClick={handleDateClick}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={`w-full border bg-slate-50/90 dark:bg-muted/40 text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-muted/20 disabled:hover:border-slate-200/90 ${sizeStyles} ${paddingLeft} ${paddingRight} ${stateStyles} ${inputClassName}`}
          {...props}
        />

        {endAdornment && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-1.5">
            {endAdornment}
          </div>
        )}
      </div>

      <FormError error={error} id={errorId} />
      {helperText && !error && (
        <p className="mt-1 text-[11px] text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
});

export default InputField;
