import { Plus, Edit3, Trash2 } from "lucide-react";

export function CurriculumSyllabusTab({
  viewingItems,
  isAddingClassInModal,
  setIsAddingClassInModal,
  setEditingClassInModalId,
  newClassForm,
  setNewClassForm,
  handleSaveNewClassInModal,
  editingClassInModalId,
  editingClassForm,
  setEditingClassForm,
  handleSaveClassInModal,
  handleDeleteClassInModal,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
            Curriculum Classes ({viewingItems.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Changes to syllabus update the workout guidance across all assigned batches.
          </p>
        </div>

        {!isAddingClassInModal && (
          <button
            type="button"
            onClick={() => {
              setIsAddingClassInModal(true);
              setEditingClassInModalId(null);
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-bold cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Class #{viewingItems.length + 1}</span>
          </button>
        )}
      </div>

      {/* Add Class Form in Modal */}
      {isAddingClassInModal && (
        <div className="rounded-lg border-2 border-dashed border-blue-600/40 dark:border-primary/50 bg-blue-50/40 dark:bg-primary/5 p-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-blue-600/20 dark:border-primary/20">
            <h4 className="text-sm font-bold text-slate-900 dark:text-foreground">
              Add Class #{viewingItems.length + 1}
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingClassInModal(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-muted-foreground dark:hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveNewClassInModal} className="mt-3 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-foreground mb-1">
                Class Subject / Focus *
              </label>
              <input
                type="text"
                required
                value={newClassForm.subject}
                onChange={(e) =>
                  setNewClassForm((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="e.g. Posterior Chain Dominance & Core Hypertrophy"
                className="w-full rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-foreground mb-1">
                Coaching Notes & Prescriptions
              </label>
              <textarea
                rows={2}
                value={newClassForm.message}
                onChange={(e) =>
                  setNewClassForm((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Coaching cues, movement drills, and progression notes..."
                className="w-full rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingClassInModal(false)}
                className="rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-900 hover:bg-blue-800 dark:bg-primary dark:hover:bg-primary/90 px-4 py-1.5 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Save Class #{viewingItems.length + 1}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Classes List */}
      <div className="grid grid-cols-1 gap-3">
        {viewingItems.map((item) => {
          const isEditing = editingClassInModalId === item.id;
          return (
            <div
              key={item.id || item.classNumber}
              className={`rounded-lg border p-4 transition-all ${
                isEditing
                  ? "border-blue-700 dark:border-primary bg-blue-50/50 dark:bg-primary/5 shadow-xs"
                  : "border-slate-200 dark:border-border bg-white dark:bg-card hover:border-slate-300 dark:hover:border-primary/30"
              }`}
            >
              {isEditing ? (
                <div className="space-y-3 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-border/60">
                    <span className="text-xs font-bold text-slate-900 dark:text-foreground">
                      Editing Class {item.classNumber}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-800 dark:text-foreground mb-1">
                      Subject / Focus
                    </label>
                    <input
                      type="text"
                      value={editingClassForm.subject}
                      onChange={(e) =>
                        setEditingClassForm((prev) => ({
                          ...prev,
                          subject: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-800 dark:text-foreground mb-1">
                      Coaching Cue / Prescriptions
                    </label>
                    <textarea
                      rows={2}
                      value={editingClassForm.message}
                      onChange={(e) =>
                        setEditingClassForm((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingClassInModalId(null)}
                      className="rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-1 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveClassInModal(item.id, item.classNumber)}
                      className="rounded-lg bg-blue-900 hover:bg-blue-800 dark:bg-primary dark:hover:bg-primary/90 px-3.5 py-1 text-xs font-bold text-white shadow-xs cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-background font-extrabold text-xs">
                        {item.classNumber}
                      </span>
                      <span className="font-bold text-sm text-foreground">
                        {item.subject}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingClassInModalId(item.id);
                          setEditingClassForm({
                            subject: item.subject,
                            message: item.message || "",
                          });
                        }}
                        className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        title={`Edit Class ${item.classNumber}`}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClassInModal(item.id, item.classNumber)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title={`Delete Class ${item.classNumber}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {item.message || "No specific coaching notes provided for this session."}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
