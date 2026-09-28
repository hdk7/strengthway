export function FormLabel({
  htmlFor,
  required = false,
  children,
  className = "",
  hint = "",
  size = "md",
}) {
  if (!children) return null;
  const sizeClasses = size === "sm" ? "text-xs mb-1" : "text-xs sm:text-[13px] mb-1.5";

  return (
    <div className="flex items-center justify-between">
      <label
        htmlFor={htmlFor}
        className={`block font-medium text-foreground ${sizeClasses} ${className}`}
      >
        {children}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function FormError({ error, id, className = "" }) {
  if (!error) return null;

  return (
    <p
      id={id}
      role="alert"
      className={`mt-1 text-[11px] sm:text-xs text-destructive animate-in fade-in-0 duration-150 ${className}`}
    >
      {error}
    </p>
  );
}

export function FormField({
  label,
  required = false,
  error,
  hint,
  id,
  children,
  className = "",
  size = "md",
}) {
  const errorId = id && error ? `${id}-error` : undefined;

  return (
    <div className={`flex flex-col text-left ${className}`}>
      {label && (
        <FormLabel htmlFor={id} required={required} hint={hint} size={size}>
          {label}
        </FormLabel>
      )}
      {children}
      <FormError error={error} id={errorId} />
    </div>
  );
}

FormField.Label = FormLabel;
FormField.Error = FormError;

export default FormField;
