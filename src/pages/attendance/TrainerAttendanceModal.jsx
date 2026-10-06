import { CalendarCheck, X, Loader2 } from "lucide-react";

export function TrainerAttendanceModal({
  isOpen,
  onClose,
  modalFormData,
  setModalFormData,
  handleSaveModal,
  isSubmitting,
  trainers,
  batches,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent">
              <CalendarCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Log Class Conduction
              </h3>
              <p className="text-xs text-muted-foreground">
                Record session execution and floor hours for the scheduled batch session.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
          {/* Date */}
          <div>
            <label className="font-bold text-foreground block mb-1">Session Date</label>
            <input
              type="date"
              value={modalFormData.date}
              onChange={(e) =>
                setModalFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Trainer */}
          <div>
            <label className="font-bold text-foreground block mb-1">
              Scheduled Primary Coach
            </label>
            <select
              value={modalFormData.trainerId}
              onChange={(e) =>
                setModalFormData((prev) => ({ ...prev, trainerId: e.target.value }))
              }
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
            >
              <option value="">Select Trainer</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.shift || "General Shift"})
                </option>
              ))}
            </select>
          </div>

          {/* Batch Container */}
          <div>
            <label className="font-bold text-foreground block mb-1">Batch Container</label>
            <select
              value={modalFormData.batchId}
              onChange={(e) =>
                setModalFormData((prev) => ({ ...prev, batchId: e.target.value }))
              }
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
            >
              <option value="">Select Batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.timingLabel || b.timing})
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="font-bold text-foreground block mb-1">Conduction Status</label>
            <select
              value={modalFormData.status}
              onChange={(e) =>
                setModalFormData((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer font-bold"
            >
              <option value="PRESENT">PRESENT (Checked in)</option>
              <option value="CONDUCTED">CONDUCTED (Conducted normally)</option>
              <option value="ABSENT">ABSENT (Missed class)</option>
              <option value="LEAVE">LEAVE (Approved faculty leave)</option>
            </select>
          </div>

          {/* Check-in & Check-out Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-foreground block mb-1">Check-in Time</label>
              <input
                type="text"
                value={modalFormData.checkInTime}
                onChange={(e) =>
                  setModalFormData((prev) => ({ ...prev, checkInTime: e.target.value }))
                }
                placeholder="e.g. 06:05 AM"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="font-bold text-foreground block mb-1">Check-out Time</label>
              <input
                type="text"
                value={modalFormData.checkOutTime || ""}
                onChange={(e) =>
                  setModalFormData((prev) => ({ ...prev, checkOutTime: e.target.value }))
                }
                placeholder="e.g. 02:00 PM"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-bold text-foreground block mb-1">Session Notes / Reason</label>
            <textarea
              rows="2"
              value={modalFormData.notes}
              onChange={(e) =>
                setModalFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="e.g. High intensity conditioning split, Coach stepped in due to illness..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs font-bold text-accent-foreground shadow-xs hover:bg-accent/90 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving Log…</span>
                </>
              ) : (
                <span>Save Conduction Record</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
