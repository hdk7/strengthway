export default function FormLabel({
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
