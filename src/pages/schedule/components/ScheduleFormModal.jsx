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
import { InputField } from "@/components/form";

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
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays size={18} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {editingScheduleId
                  ? "Edit Scheduled Class Program"
                  : "Create Scheduled Class Program"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Define a reusable curriculum program and assign it to multiple batches.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSaveSchedule} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1: PROGRAM INFORMATION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Sparkles size={16} />
                <span>1. Program Information</span>
              </h3>
              <span className="text-xs text-muted-foreground">
                Reusable Curriculum Details
              </span>
            </div>

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
              <label className="mb-1 text-xs font-medium text-foreground block">
                Program Curriculum Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Outline the primary objectives, athlete level, and periodization progression..."
                className="w-full rounded-xl border border-border bg-background p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 2: MULTI-BATCH ASSIGNMENT */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-2 gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Boxes size={16} />
                  <span>2. Batch Assignment</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Assign this single program across multiple batches. Each batch maintains its
                  own separate floor session tracking.
                </p>
              </div>
            </div>

            {/* Batch Selection Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {batches.map((b) => {
                const isSelected = formData.batchIds.includes(b.id);
                return (
                  <div
                    key={b.id}
                    onClick={() => handleToggleFormBatch(b.id)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-all select-none ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs"
                        : "border-border bg-card hover:border-border/80 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-colors ${
                            isSelected
                              ? "bg-primary border-primary text-background"
                              : "border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="font-bold text-sm text-foreground">
                          {b.name || b.shortName}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold rounded-md bg-muted border border-border/70 px-2 py-0.5 text-foreground">
                        {b.daysPattern || "MWF"}
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-amber-500 shrink-0" />
                        <span>{b.timingLabel || `${b.startTime} - ${b.endTime}`}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-blue-500 shrink-0" />
                        <span>
                          {b.currentPax || 0} / {b.maxPax || 28} Members
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-muted-foreground">
              * Leaving all batches unchecked saves this as an unassigned reusable program
              template.
            </p>
          </div>

          {/* SECTION 3: CURRICULUM SYLLABUS */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-2 gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Dumbbell size={16} />
                  <span>3. Program Curriculum</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The modular syllabus applies to all assigned batches.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddClassItem}
                  className="rounded-lg bg-primary/15 hover:bg-primary/25 text-primary px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                >
                  + Add Class
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-75 overflow-y-auto pr-1">
              {classesData.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center">
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
                      className="rounded-xl border border-border bg-background p-3 transition-colors"
                    >
                      <div
                        onClick={() => setExpandedAccordionIndex(isExpanded ? -1 : idx)}
                        className="flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-5.5 w-5.5 items-center justify-center rounded-md bg-primary text-background font-extrabold text-[11px]">
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
                        <div className="mt-3 space-y-2.5 pt-2 border-t border-border/60 animate-in fade-in duration-100">
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
                              className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
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
                              className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                            />
                          </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateClassItem(idx)}
                            className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClassItem(idx)}
                            className="rounded-md border border-destructive/30 px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10 cursor-pointer"
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
          <div className="border-t border-border pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-background hover:bg-primary/90 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : editingScheduleId
                  ? "Update Program"
                  : "Save Program"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
