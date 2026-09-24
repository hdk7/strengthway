import { useId, forwardRef } from "react";
import FormLabel from "./FormLabel";
import FormError from "./FormError";

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
    size === "sm" ? "px-3 py-2 text-xs rounded-lg" : "px-3.5 py-2.5 text-sm rounded-xl";

  const paddingLeft = startIcon ? (size === "sm" ? "pl-9" : "pl-10") : "";
  const paddingRight = endAdornment ? (size === "sm" ? "pr-9" : "pr-10") : "";

  const stateStyles = error
    ? "border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive"
    : "border-border focus:border-primary focus:ring-1 focus:ring-primary/20";

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
          className={`w-full border bg-background text-foreground placeholder:text-muted-foreground/60 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles} ${paddingLeft} ${paddingRight} ${stateStyles} ${inputClassName}`}
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
