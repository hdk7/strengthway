/* eslint-disable max-lines */
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Sparkles,
  X,
  Boxes,
  Clock,
  Users,
  Check,
  Dumbbell,
} from "lucide-react";
import { InputField, FormSectionHeader } from "@/components/form";

export function ScheduleFormModal({
  isOpen,
  onClose,
  editingScheduleId,
  formData,
  setFormData,
  batches,
  handleToggleFormBatch,
  classesData,
  expandedAccordionIndex,
  setExpandedAccordionIndex,
  handleClassItemChange,
  handleAddClassItem,
  handleDeleteClassItem,
  handleDuplicateClassItem,
  handleSaveSchedule,
  submitting,
}) {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-2xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border px-6 py-4 bg-white dark:bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-primary/10 text-blue-700 dark:text-primary">
              <CalendarDays size={18} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-foreground">
                {editingScheduleId
                  ? "Edit Scheduled Class Program"
                  : "Create Scheduled Class Program"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                Define a reusable curriculum program and assign it to multiple batches.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSaveSchedule} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1: PROGRAM INFORMATION */}
          <div className="space-y-4">
            <FormSectionHeader
              title="Program Information"
              subtitle="Reusable Curriculum Details"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                label="Program Name"
                required
                placeholder="e.g. 12-Class Functional Strength Foundations"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <InputField
                label="Cycle Start Date"
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 text-xs font-semibold text-slate-800 dark:text-foreground block">
                Program Curriculum Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Outline the primary objectives, athlete level, and periodization progression..."
                className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-muted/40 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* SECTION 2: MULTI-BATCH ASSIGNMENT */}
          <div className="space-y-3">
            <FormSectionHeader
              title="Batch Assignment"
              subtitle="Assign this single program across multiple batches. Each batch maintains its own separate floor session tracking."
            />

            {/* Batch Selection Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {batches.map((b) => {
                const isSelected = formData.batchIds.includes(b.id);
                return (
                  <div
                    key={b.id}
                    onClick={() => handleToggleFormBatch(b.id)}
                    className={`cursor-pointer rounded-lg border p-3.5 transition-all select-none ${
                      isSelected
                        ? "border-blue-700 dark:border-primary bg-blue-50/60 dark:bg-primary/10 shadow-xs"
                        : "border-slate-200 dark:border-border bg-white dark:bg-card hover:border-slate-300 dark:hover:border-border/80 hover:bg-slate-50/60 dark:hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-colors ${
                            isSelected
                              ? "bg-blue-900 dark:bg-primary border-blue-900 dark:border-primary text-white"
                              : "border-slate-300 dark:border-muted-foreground/40 bg-white dark:bg-background"
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="font-bold text-sm text-slate-900 dark:text-foreground">
                          {b.name || b.shortName}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold rounded bg-slate-100 dark:bg-muted border border-slate-200 dark:border-border/70 px-2 py-0.5 text-slate-700 dark:text-foreground">
                        {b.daysPattern || "MWF"}
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-1 text-xs text-slate-500 dark:text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-amber-500 shrink-0" />
                        <span>{b.timingLabel || `${b.startTime} - ${b.endTime}`}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-blue-600 dark:text-blue-500 shrink-0" />
                        <span>
                          {b.currentPax || 0} / {b.maxPax || 28} Members
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
              * Leaving all batches unchecked saves this as an unassigned reusable program
              template.
            </p>
          </div>

          {/* SECTION 3: CURRICULUM SYLLABUS */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-1 gap-2">
              <FormSectionHeader
                title="Program Curriculum"
                subtitle="The modular syllabus applies to all assigned batches."
                className="mb-0"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddClassItem}
                  className="rounded-lg bg-blue-50 dark:bg-primary/15 hover:bg-blue-100 dark:hover:bg-primary/25 text-blue-700 dark:text-primary px-3 py-1.5 text-xs font-bold cursor-pointer"
                >
                  + Add Class
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-75 overflow-y-auto pr-1">
              {classesData.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 dark:border-border bg-slate-50/50 dark:bg-card/40 p-6 text-center">
                  <Dumbbell size={24} className="mx-auto text-muted-foreground/60 mb-1.5" />
                  <p className="text-xs font-semibold text-foreground">No curriculum classes added yet</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Click &ldquo;+ Add Class&rdquo; above to build your modular curriculum.
                  </p>
                </div>
              ) : (
                classesData.map((cls, idx) => {
                  const isExpanded = expandedAccordionIndex === idx;
                  return (
                    <div
                      key={cls.classNumber || idx}
                      className="rounded-lg border border-slate-200 dark:border-border bg-slate-50/40 dark:bg-background p-3 transition-colors"
                    >
                      <div
                        onClick={() => setExpandedAccordionIndex(isExpanded ? -1 : idx)}
                        className="flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-5.5 w-5.5 items-center justify-center rounded bg-blue-900 dark:bg-primary text-white font-extrabold text-[11px]">
                            {cls.classNumber}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {cls.subject || `Class ${cls.classNumber} (Untitled)`}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {isExpanded ? "Collapse" : "Edit"}
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 space-y-2.5 pt-2 border-t border-slate-200 dark:border-border/60 animate-in fade-in duration-100">
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground mb-1">
                              Subject / Focus
                            </label>
                            <input
                              type="text"
                              value={cls.subject || ""}
                              onChange={(e) =>
                                handleClassItemChange(idx, "subject", e.target.value)
                              }
                              placeholder={`e.g. Class ${cls.classNumber}: Fundamental Movement & Assessment`}
                              className="w-full rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-foreground mb-1">
                              Coaching Message & Prescriptions
                            </label>
                            <textarea
                              rows={2}
                              value={cls.message || ""}
                              onChange={(e) =>
                                handleClassItemChange(idx, "message", e.target.value)
                              }
                              placeholder="Coaching focus, movement drills, and form cues..."
                              className="w-full rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateClassItem(idx)}
                            className="rounded-lg border border-slate-200 dark:border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClassItem(idx)}
                            className="rounded-lg border border-destructive/30 px-2.5 py-1 text-[11px] text-destructive hover:bg-destructive/10 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          </div>

          {/* Modal Footer inside form */}
          <div className="border-t border-slate-100 dark:border-border/60 bg-slate-50/60 dark:bg-muted/15 px-6 py-3.5 -mx-6 -mb-6 mt-4 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-card px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-foreground shadow-xs hover:bg-slate-50 dark:hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 min-h-[40px]"
            >
              {submitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{editingScheduleId ? "Update Program" : "Save Program"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
