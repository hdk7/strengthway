import { forwardRef } from "react";
import FormField from "./FormField";
import {
  useFieldId,
  getFormStateStyles,
  FORM_CONTROL_SIZES,
  FORM_CONTROL_BASE,
} from "./formStyles";
import { sanitizeInputByRestriction, handleRestrictedKeyDown } from "@/lib/validation";

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
    restriction,
    ...props
  },
  ref,
) {
  const { id, errorId } = useFieldId(providedId, name, "input", error);

  const sizeStyles = FORM_CONTROL_SIZES[size] || FORM_CONTROL_SIZES.md;
  const paddingLeft = startIcon ? (size === "sm" ? "pl-9" : "pl-10") : "";
  const paddingRight = endAdornment ? (size === "sm" ? "pr-9" : "pr-10") : "";
  const stateStyles = getFormStateStyles(error);

  const handleKeyDown = (e) => {
    handleRestrictedKeyDown(e, restriction, props.onKeyDown);
  };

  const handleInputChange = (e) => {
    if (restriction) {
      const sanitized = sanitizeInputByRestriction(e.target.value, restriction);
      e.target.value = sanitized;
    }
    if (typeof onChange === "function") {
      onChange(e);
    }
  };

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
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          onClick={handleDateClick}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={`${FORM_CONTROL_BASE} ${sizeStyles} ${paddingLeft} ${paddingRight} ${stateStyles} ${inputClassName}`}
          {...props}
        />

        {endAdornment && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-1.5">
            {endAdornment}
          </div>
        )}
      </div>
    </FormField>
  );
});

export default InputField;
