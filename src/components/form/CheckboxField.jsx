import { useId, forwardRef } from "react";
import FormError from "./FormError";

const CheckboxField = forwardRef(function CheckboxField(
  {
    id: providedId,
    name,
    checked,
    onChange,
    label,
    description,
    disabled = false,
    error,
    className = "",
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId || (name ? `checkbox-${name}` : generatedId);
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`flex flex-col text-left ${className}`}>
      <label
        htmlFor={id}
        className={`inline-flex items-start gap-2.5 cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <input
          ref={ref}
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className="mt-0.5 h-4 w-4 rounded border-border bg-background text-primary focus:ring-1 focus:ring-accent accent-accent transition-colors cursor-pointer"
          {...props}
        />
        <div className="flex flex-col">
          {label && (
            <span className="text-xs sm:text-[13.5px] font-medium text-foreground select-none">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] sm:text-xs text-muted-foreground select-none">
              {description}
            </span>
          )}
        </div>
      </label>

      <FormError error={error} id={errorId} />
    </div>
  );
});

export default CheckboxField;
