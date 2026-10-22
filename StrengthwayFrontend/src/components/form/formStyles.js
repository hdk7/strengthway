import { useId } from "react";

/**
 * Standardized dynamic ID & errorId generator for all form fields.
 * Reconciles explicit providedId, name-derived ID, and fallback React useId().
 */
export function useFieldId(providedId, name, prefix = "field", error) {
  const generatedId = useId();
  const id = providedId || (name ? `${prefix}-${name}` : generatedId);
  const errorId = error ? `${id}-error` : undefined;
  return { id, errorId };
}

/**
 * Standardized form control state styling (normal vs error)
 */
export const FORM_STATE_STYLES = {
  error:
    "border-destructive bg-destructive/5 text-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20",
  normal:
    "border-slate-200/90 dark:border-border hover:border-slate-300 dark:hover:border-border/80 focus:border-blue-800 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-card focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30",
};

export function getFormStateStyles(error) {
  return error ? FORM_STATE_STYLES.error : FORM_STATE_STYLES.normal;
}

/**
 * Standardized form control sizing tokens
 */
export const FORM_CONTROL_SIZES = {
  sm: "px-3 py-1.5 text-xs rounded-lg min-h-[36px]",
  md: "px-3.5 py-2.5 text-sm rounded-lg min-h-[42px]",
};

export const FORM_TEXTAREA_SIZES = {
  sm: "p-3 text-xs rounded-lg",
  md: "p-3.5 text-sm rounded-lg",
};

/**
 * Standardized base input/select styles
 */
export const FORM_CONTROL_BASE =
  "w-full border bg-slate-50/90 dark:bg-muted/40 text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-muted/20 disabled:hover:border-slate-200/90";
