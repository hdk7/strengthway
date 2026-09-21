import { useId } from "react";

export default function TextField({ label, error, endAdornment, className = "", ...inputProps }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={`flex flex-col gap-1.5 text-left ${className}`}>
      <label htmlFor={id} className="text-[13px] font-semibold text-foreground">
        {label}
      </label>
      <div
        className={[
          "flex items-center border rounded-lg bg-background",
          "transition-[border-color,box-shadow] duration-150 ease-[ease]",
          "focus-within:border-accent focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_10%,transparent)]",
          error
            ? "border-destructive focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-destructive)_15%,transparent)]"
            : "border-border",
        ].join(" ")}
      >
        <input
          id={id}
          className="flex-1 min-w-0 border-none outline-none bg-transparent px-3 py-2.75 text-[15px] text-foreground [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        {endAdornment}
      </div>
      {error && (
        <p id={errorId} className="m-0 text-[13px] text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
