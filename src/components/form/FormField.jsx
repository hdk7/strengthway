import FormLabel from "./FormLabel";
import FormError from "./FormError";

export default function FormField({
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
