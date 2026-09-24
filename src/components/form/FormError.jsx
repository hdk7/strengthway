export default function FormError({ error, id, className = "" }) {
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
