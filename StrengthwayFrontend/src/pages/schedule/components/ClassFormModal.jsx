import { useState, useEffect } from "react";
import { Dumbbell, Plus, Trash2 } from "lucide-react";
import { InputField, TextareaField } from "@/components/form";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
} from "@/components/ui/FormModal";

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
              category: w.category || (idx % 2 === 0 ? "beginner" : "intermediate"),
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

  const handleAddWorkout = () => {
    setFormData((prev) => ({
      ...prev,
      workouts: [
        ...prev.workouts,
        {
          id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          category: prev.workouts.length % 2 === 0 ? "beginner" : "intermediate",
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
          category: w.category || "beginner",
          subject: w.subject?.trim() || "",
          message: w.message?.trim() || "",
        }))
        .filter((w) => w.subject || w.message),
    });
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="xl">
      <FormModalHeader
        icon={Dumbbell}
        title={initialData ? "Edit Reusable Class" : "Create Reusable Class"}
        subtitle="Define reusable workout curriculum independent of batches and coaches."
        onClose={onClose}
      />

      <form id="class-program-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <FormModalBody className="space-y-5">
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
          <TextareaField
            label="Beginner Workouts"
            hint='Leave empty for "Not specified"'
            rows={4}
            resize="vertical"
            value={formData.beginnerWorkouts}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, beginnerWorkouts: e.target.value }))
            }
            placeholder="e.g. 1 min Skipping; 1 min Elbow Plank; 10 Goblet Squats; 30s Ape Hops; × 3 sets"
            helperText="Prescriptions, regression movements, sets, and rep ranges suitable for beginners."
          />

          {/* Field 3: Intermediate Workouts */}
          <TextareaField
            label="Intermediate Workouts"
            hint='Leave empty for "Not specified"'
            rows={4}
            resize="vertical"
            value={formData.intermediateWorkouts}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, intermediateWorkouts: e.target.value }))
            }
            placeholder="e.g. Push: Push ups 5–10 × 3; Dips 4–10 × 3; Legs: GB Squats 8–10 × 3; Pull: Hori Pulls 6–10 × 3"
            helperText="Main lifts, progressive loading parameters, compound volume, and accessory movements."
          />

          {/* Dynamically Added Custom Workouts */}
          {formData.workouts.map((workout, index) => {
            const isInt = workout.category === "intermediate";
            return (
              <div
                key={workout.id || index}
                className={`rounded-2xl border p-4 space-y-3 relative animate-in fade-in zoom-in-98 duration-150 transition-colors ${
                  isInt
                    ? "border-blue-500/35 dark:border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20"
                    : "border-emerald-500/35 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black ${
                          isInt
                            ? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                            : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      Workout #{index + 1}
                    </span>

                    {/* Level selector */}
                    <div className="inline-flex rounded-lg border border-border bg-background p-0.5 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => handleUpdateWorkout(index, "category", "beginner")}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] transition-all cursor-pointer font-bold ${
                          !isInt
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Beginner
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateWorkout(index, "category", "intermediate")}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] transition-all cursor-pointer font-bold ${
                          isInt
                            ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Intermediate
                      </button>
                    </div>
                  </div>

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
                <InputField
                  label="Subject / Focus"
                  value={workout.subject}
                  onChange={(e) => handleUpdateWorkout(index, "subject", e.target.value)}
                  placeholder="e.g. Core Finisher, Strength Block, or Agility Drills"
                />

                {/* Message textarea field */}
                <TextareaField
                  label="Coaching Message & Prescriptions"
                  rows={4}
                  resize="vertical"
                  value={workout.message}
                  onChange={(e) => handleUpdateWorkout(index, "message", e.target.value)}
                  placeholder="Movement cues, prescribed sets, repetitions, and intensity..."
                />
              </div>
            );
          })}

          {/* Add Workouts Button */}
          <button
            type="button"
            onClick={handleAddWorkout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-border hover:border-blue-700 dark:hover:border-primary bg-slate-50/50 dark:bg-muted/20 hover:bg-blue-50/30 dark:hover:bg-primary/5 py-3 text-xs font-bold text-blue-700 dark:text-primary transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
          >
            <Plus size={15} />
            <span>Add Workouts</span>
          </button>
        </FormModalBody>

        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          submitText={initialData ? "Save Changes" : "Create Class"}
          isSubmitting={isSubmitting}
        />
      </form>
    </FormModal>
  );
}
