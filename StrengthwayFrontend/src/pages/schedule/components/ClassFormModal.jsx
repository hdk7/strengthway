import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Dumbbell, X, Plus, Trash2, Check, Loader2 } from "lucide-react";
import { InputField } from "@/components/form";

/**
 * Reusable Class Form Modal.
 * Supports:
 * 1. Class Program Name
 * 2. Beginner Workouts
 * 3. Intermediate Workouts
 * 4. Dynamic Workouts (Subject textfield + Message textarea) via "Add Workouts" button
 */
export function ClassFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSubmit,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    name: "",
    beginnerWorkouts: "",
    intermediateWorkouts: "",
    workouts: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        beginnerWorkouts:
          initialData.beginnerWorkouts === "Not specified" ? "" : initialData.beginnerWorkouts || "",
        intermediateWorkouts:
          initialData.intermediateWorkouts === "Not specified" ? "" : initialData.intermediateWorkouts || "",
        workouts: Array.isArray(initialData.workouts)
          ? initialData.workouts.map((w, idx) => ({
              id: w.id || `w-${idx}-${Date.now()}`,
              subject: w.subject || "",
              message: w.message || "",
            }))
          : [],
      });
    } else {
      setFormData({
        name: "",
        beginnerWorkouts: "",
        intermediateWorkouts: "",
        workouts: [],
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleAddWorkout = () => {
    setFormData((prev) => ({
      ...prev,
      workouts: [
        ...prev.workouts,
        {
          id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          subject: "",
          message: "",
        },
      ],
    }));
  };

  const handleUpdateWorkout = (index, field, value) => {
    setFormData((prev) => {
      const nextWorkouts = [...prev.workouts];
      nextWorkouts[index] = {
        ...nextWorkouts[index],
        [field]: value,
      };
      return { ...prev, workouts: nextWorkouts };
    });
  };

  const handleRemoveWorkout = (index) => {
    setFormData((prev) => ({
      ...prev,
      workouts: prev.workouts.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Class Program Name is required.";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await onSubmit({
      name: formData.name.trim(),
      beginnerWorkouts: formData.beginnerWorkouts.trim() || "Not specified",
      intermediateWorkouts: formData.intermediateWorkouts.trim() || "Not specified",
      workouts: (formData.workouts || [])
        .map((w) => ({
          id: w.id,
          subject: w.subject?.trim() || "",
          message: w.message?.trim() || "",
        }))
        .filter((w) => w.subject || w.message),
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6 bg-slate-900/30 dark:bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl flex flex-col bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-2xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border px-6 py-4.5 bg-white dark:bg-card shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-primary/10 text-blue-700 dark:text-primary">
              <Dumbbell size={19} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-foreground">
                {initialData ? "Edit Reusable Class" : "Create Reusable Class"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                Define reusable workout curriculum independent of batches and coaches.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 max-h-[75vh]">
          {/* Field 1: Class Program Name */}
          <InputField
            label="Class Program Name"
            required
            placeholder="e.g. Push, Legs, Pull or Circuit Training"
            value={formData.name}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, name: e.target.value }));
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={errors.name}
            helperText="The unique title identifying this workout curriculum."
            autoFocus
          />

          {/* Field 2: Beginner Workouts */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 dark:text-foreground">
                Beginner Workouts
              </label>
              <span className="text-[11px] font-medium text-slate-400 dark:text-muted-foreground">
                Leave empty for "Not specified"
              </span>
            </div>
            <textarea
              rows={4}
              value={formData.beginnerWorkouts}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, beginnerWorkouts: e.target.value }))
              }
              placeholder="e.g. 1 min Skipping; 1 min Elbow Plank; 10 Goblet Squats; 30s Ape Hops; × 3 sets"
              className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-blue-700 dark:focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-primary/20 transition-all resize-y"
            />
            <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
              Prescriptions, regression movements, sets, and rep ranges suitable for beginners.
            </p>
          </div>

          {/* Field 3: Intermediate Workouts */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 dark:text-foreground">
                Intermediate Workouts
              </label>
              <span className="text-[11px] font-medium text-slate-400 dark:text-muted-foreground">
                Leave empty for "Not specified"
              </span>
            </div>
            <textarea
              rows={4}
              value={formData.intermediateWorkouts}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, intermediateWorkouts: e.target.value }))
              }
              placeholder="e.g. Push: Push ups 5–10 × 3; Dips 4–10 × 3; Legs: GB Squats 8–10 × 3; Pull: Hori Pulls 6–10 × 3"
              className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-blue-700 dark:focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-primary/20 transition-all resize-y"
            />
            <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
              Main lifts, progressive loading parameters, compound volume, and accessory movements.
            </p>
          </div>

          {/* Dynamically Added Custom Workouts */}
          {formData.workouts.map((workout, index) => (
            <div
              key={workout.id || index}
              className="rounded-2xl border border-slate-200/90 dark:border-border bg-slate-50/50 dark:bg-muted/20 p-4 space-y-3 relative animate-in fade-in zoom-in-98 duration-150"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-border/60">
                <span className="text-xs font-bold text-slate-800 dark:text-foreground flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 dark:bg-primary/10 text-blue-700 dark:text-primary text-[10px] font-black">
                    {index + 1}
                  </span>
                  Workout #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveWorkout(index)}
                  className="rounded-lg p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                  title="Remove workout"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Subject textfield */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800 dark:text-foreground">
                  Subject / Focus
                </label>
                <input
                  type="text"
                  value={workout.subject}
                  onChange={(e) => handleUpdateWorkout(index, "subject", e.target.value)}
                  placeholder="e.g. Core Finisher, Strength Block, or Agility Drills"
                  className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-blue-700 dark:focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Message textarea field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800 dark:text-foreground">
                  Coaching Message & Prescriptions
                </label>
                <textarea
                  rows={4}
                  value={workout.message}
                  onChange={(e) => handleUpdateWorkout(index, "message", e.target.value)}
                  placeholder="Movement cues, prescribed sets, repetitions, and intensity..."
                  className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-blue-700 dark:focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-primary/20 transition-all resize-y"
                />
              </div>
            </div>
          ))}

          {/* Add Workouts Button */}
          <button
            type="button"
            onClick={handleAddWorkout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-border hover:border-blue-700 dark:hover:border-primary bg-slate-50/50 dark:bg-muted/20 hover:bg-blue-50/30 dark:hover:bg-primary/5 py-3 text-xs font-bold text-blue-700 dark:text-primary transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
          >
            <Plus size={15} />
            <span>Add Workouts</span>
          </button>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 dark:bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-white dark:text-primary-foreground hover:bg-blue-800 dark:hover:bg-primary/90 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Class…</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{initialData ? "Save Changes" : "Create Class"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
