import { forwardRef } from "react";
import FormField from "./FormField";
import {
  useFieldId,
  getFormStateStyles,
  FORM_TEXTAREA_SIZES,
  FORM_CONTROL_BASE,
} from "./formStyles";

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
  const { id, errorId } = useFieldId(providedId, name, "textarea", error);
  const sizeStyles = FORM_TEXTAREA_SIZES[size] || FORM_TEXTAREA_SIZES.md;
  const stateStyles = getFormStateStyles(error);

  const currentLength = typeof value === "string" ? value.length : 0;

  const resizeStyles = {
    none: "resize-none",
    vertical: "resize-y",
    horizontal: "resize-x",
    both: "resize",
  }[resize] || "resize-none";

  const counterElement =
    showCount && maxLength ? (
      <span className="ml-auto text-[11px] text-muted-foreground pt-1">
        {currentLength} / {maxLength}
      </span>
    ) : null;

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
      footerExtra={counterElement}
    >
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
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={`${FORM_CONTROL_BASE} ${resizeStyles} ${sizeStyles} ${stateStyles} ${textareaClassName}`}
          {...props}
        />
      </div>
    </FormField>
  );
});

export default TextareaField;
