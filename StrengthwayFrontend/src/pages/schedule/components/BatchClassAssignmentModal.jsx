/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Layers,
  X,
  Check,
  Menu,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { assignClassesToBatch, getClasses } from "@/lib/classProgramService";
import { getBatches } from "@/lib/batchesService";

/**
 * Calculates sequential batch dates matching the batch operational days pattern.
 * Uses local time parsing to prevent timezone offset skew.
 */
function calculateBatchDates(batch, startDateStr, count = 1) {
  if (!batch || count <= 0) return [];

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  let scheduledDays =
    Array.isArray(batch.daysList) && batch.daysList.length > 0
      ? batch.daysList
      : [];

  if (scheduledDays.length === 0) {
    if (batch.daysPattern === "TTS") {
      scheduledDays = ["Tuesday", "Thursday", "Saturday"];
    } else if (batch.daysPattern === "MWF") {
      scheduledDays = ["Monday", "Wednesday", "Friday"];
    } else {
      scheduledDays = ["Monday", "Wednesday", "Friday"];
    }
  }

  const daysLower = scheduledDays.map((d) => d.toLowerCase());

  let start = new Date();
  if (startDateStr && /^\d{4}-\d{2}-\d{2}$/.test(startDateStr)) {
    const [y, m, d] = startDateStr.split("-").map(Number);
    start = new Date(y, m - 1, d, 0, 0, 0, 0);
  } else {
    start.setHours(0, 0, 0, 0);
  }

  const resultDates = [];
  let currentDate = new Date(start);
  let safety = 0;

  while (resultDates.length < count && safety < 180) {
    const dayName = dayNames[currentDate.getDay()];
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    if (daysLower.includes(dayName.toLowerCase())) {
      resultDates.push({
        date: dateStr,
        dayOfWeek: dayName,
        displayDate: currentDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
    safety++;
  }

  return resultDates;
}

export function BatchClassAssignmentModal({
  isOpen,
  onClose,
  batches = [],
  allClasses = [],
  initialSelectedClassIds = [],
  preselectedBatchId = "",
  onSuccess,
}) {
  const [internalBatches, setInternalBatches] = useState(batches);
  const [internalClasses, setInternalClasses] = useState(allClasses);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  const [selectedBatchId, setSelectedBatchId] = useState(preselectedBatchId || "");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [overrideExisting, setOverrideExisting] = useState(false);
  const [orderedClassIds, setOrderedClassIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalClassPicker, setAdditionalClassPicker] = useState("");

  // Drag-and-drop state & refs (supports pointer drag handle + HTML5 drag fallback)
  const dragSourceIndexRef = useRef(null);
  const dragOverIndexRef = useRef(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Sync / Load lookup data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadLookups() {
      try {
        setIsLoadingLookups(true);
        const promises = [];

        if (!batches || batches.length === 0) {
          promises.push(
            getBatches().then((b) => {
              if (isMounted) setInternalBatches(b || []);
            })
          );
        } else {
          setInternalBatches(batches);
        }

        if (!allClasses || allClasses.length === 0) {
          promises.push(
            getClasses({ limit: 100 }).then((c) => {
              if (isMounted) setInternalClasses(c || []);
            })
          );
        } else {
          setInternalClasses(allClasses);
        }

        if (promises.length > 0) {
          await Promise.all(promises);
        }
      } catch (err) {
        console.error("Failed to load lookups in BatchClassAssignmentModal:", err);
      } finally {
        if (isMounted) setIsLoadingLookups(false);
      }
    }

    loadLookups();

    if (preselectedBatchId) {
      setSelectedBatchId(preselectedBatchId);
    } else if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].id);
    }

    setOrderedClassIds(
      Array.isArray(initialSelectedClassIds) && initialSelectedClassIds.length > 0
        ? [...initialSelectedClassIds]
        : []
    );
    setStartDate(new Date().toISOString().slice(0, 10));
    setOverrideExisting(false);
    setAdditionalClassPicker("");

    return () => {
      isMounted = false;
    };
  }, [isOpen, preselectedBatchId, initialSelectedClassIds, batches, allClasses, selectedBatchId]);

  // Set default selected batch once internalBatches are available
  useEffect(() => {
    if (!selectedBatchId && internalBatches.length > 0) {
      setSelectedBatchId(preselectedBatchId || internalBatches[0].id);
    }
  }, [internalBatches, preselectedBatchId, selectedBatchId]);

  const activeBatch = useMemo(() => {
    return internalBatches.find((b) => b.id === selectedBatchId) || null;
  }, [internalBatches, selectedBatchId]);

  // Map ordered IDs to full class objects
  const classMap = useMemo(() => {
    return new Map(internalClasses.map((c) => [c.id, c]));
  }, [internalClasses]);

  const orderedClasses = useMemo(() => {
    return orderedClassIds
      .map((id) => classMap.get(id) || { id, name: `Class ${id}` });
  }, [orderedClassIds, classMap]);

  // Compute preview dates based on active batch & ordered class count
  const previewDates = useMemo(() => {
    if (!activeBatch || orderedClasses.length === 0) return [];
    return calculateBatchDates(activeBatch, startDate, orderedClasses.length);
  }, [activeBatch, startDate, orderedClasses.length]);

  const reorderClassQueue = (sourceIdx, targetIdx) => {
    if (
      sourceIdx === null ||
      sourceIdx === undefined ||
      targetIdx === null ||
      targetIdx === undefined ||
      isNaN(sourceIdx) ||
      isNaN(targetIdx) ||
      sourceIdx === targetIdx
    ) {
      return;
    }

    setOrderedClassIds((prev) => {
      const copy = [...prev];
      if (sourceIdx < 0 || sourceIdx >= copy.length || targetIdx < 0 || targetIdx >= copy.length) {
        return prev;
      }
      const [movedItem] = copy.splice(sourceIdx, 1);
      copy.splice(targetIdx, 0, movedItem);
      return copy;
    });

    const targetDateInfo = previewDates[targetIdx];
    if (targetDateInfo?.displayDate) {
      toast.info(`Moved to ${targetDateInfo.displayDate}`);
    } else {
      toast.info(`Reordered to position #${targetIdx + 1}`);
    }
  };

  // Dedicated pointer-based drag on the 3-line handle (100% reliable across browsers/touchpads/mice)
  const handleHandlePointerDown = (e, index) => {
    if (e.button !== 0) return; // Only primary mouse button or touch
    e.preventDefault();
    e.stopPropagation();

    dragSourceIndexRef.current = index;
    dragOverIndexRef.current = index;
    setDraggedIndex(index);
    setDragOverIndex(index);

    const handleElem = e.currentTarget;
    try {
      handleElem.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const onPointerMove = (moveEvt) => {
      moveEvt.preventDefault();
      const el = document.elementFromPoint(moveEvt.clientX, moveEvt.clientY);
      const row = el?.closest("[data-class-row-index]");
      if (row) {
        const hoverIdx = Number(row.getAttribute("data-class-row-index"));
        if (!isNaN(hoverIdx)) {
          dragOverIndexRef.current = hoverIdx;
          setDragOverIndex(hoverIdx);
        }
      }
    };

    const onPointerUp = (upEvt) => {
      upEvt.preventDefault();
      try {
        handleElem.releasePointerCapture(upEvt.pointerId);
      } catch {
        // ignore
      }

      handleElem.removeEventListener("pointermove", onPointerMove);
      handleElem.removeEventListener("pointerup", onPointerUp);
      handleElem.removeEventListener("pointercancel", onPointerUp);

      const sourceIndex = dragSourceIndexRef.current;
      const targetIndex = dragOverIndexRef.current;

      reorderClassQueue(sourceIndex, targetIndex);

      dragSourceIndexRef.current = null;
      dragOverIndexRef.current = null;
      setDraggedIndex(null);
      setDragOverIndex(null);
    };

    handleElem.addEventListener("pointermove", onPointerMove);
    handleElem.addEventListener("pointerup", onPointerUp);
    handleElem.addEventListener("pointercancel", onPointerUp);
  };

  // HTML5 Drag-and-Drop Handlers
  const handleDragStart = (e, index) => {
    dragSourceIndexRef.current = index;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    dragOverIndexRef.current = index;
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOverIndexRef.current = index;
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e, index) => {
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    if (dragOverIndexRef.current === index) {
      dragOverIndexRef.current = null;
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();

    let sourceIndex = dragSourceIndexRef.current;
    if (sourceIndex === null || sourceIndex === undefined) {
      const transferData = e.dataTransfer.getData("text/plain");
      if (transferData !== "") {
        sourceIndex = parseInt(transferData, 10);
      }
    }
    if (sourceIndex === null || sourceIndex === undefined) {
      sourceIndex = draggedIndex;
    }

    reorderClassQueue(sourceIndex, targetIndex);

    dragSourceIndexRef.current = null;
    dragOverIndexRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragSourceIndexRef.current = null;
    dragOverIndexRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleRemoveClass = (indexToRemove) => {
    setOrderedClassIds((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddClass = (classId) => {
    if (!classId) return;
    setOrderedClassIds((prev) => [...prev, classId]);
    setAdditionalClassPicker("");
  };

  // Submit Handler
  const handleSave = async () => {
    if (!selectedBatchId) {
      toast.error("Please select a target batch.");
      return;
    }
    if (orderedClassIds.length === 0) {
      toast.error("Please add at least one class to the schedule queue.");
      return;
    }

    try {
      setIsSubmitting(true);
      await assignClassesToBatch(selectedBatchId, {
        classIds: orderedClassIds,
        startDate,
        overrideExisting,
        reason: `Mapped ${orderedClassIds.length} classes starting from ${startDate}`,
      });

      toast.success(
        `Successfully mapped and scheduled ${orderedClassIds.length} classes for ${
          activeBatch?.name || selectedBatchId
        }!`
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Batch class assignment failed:", err);
      toast.error(err.message || "Failed to assign classes to batch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-110 flex items-center justify-center p-3 sm:p-6 bg-slate-900/35 dark:bg-black/65 backdrop-blur-[2px] animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-2xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border px-6 py-4 bg-white dark:bg-card shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-primary/10 text-blue-700 dark:text-primary">
              <Layers size={20} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-foreground">
                Reusable Classes to Batch
              </h2>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                Map selected workout classes sequentially to batch operational dates & days.
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

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Batch & Cycle Configuration */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-border/80 bg-slate-50/50 dark:bg-muted/20 p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-primary flex items-center gap-2">
              <CalendarDays size={15} />
              <span>1. Batch & Schedule Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Batch Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-foreground mb-1">
                  Target Batch *
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  disabled={Boolean(preselectedBatchId) && internalBatches.length <= 1}
                  className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:border-blue-700 dark:focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-primary/20 transition-all cursor-pointer disabled:opacity-75"
                >
                  <option value="" className="bg-white dark:bg-[#18181b] text-slate-700 dark:text-zinc-200">
                    {isLoadingLookups ? "Loading Batches…" : "Select Batch…"}
                  </option>
                  {internalBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name || b.shortName} ({b.timingLabel || `${b.startTime} - ${b.endTime}`} • {b.daysPattern})
                    </option>
                  ))}
                </select>
                {activeBatch && (
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-muted-foreground flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>
                      Runs on: <strong>{activeBatch.daysLabel || activeBatch.daysList?.join(", ") || activeBatch.daysPattern}</strong>
                    </span>
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-foreground mb-1">
                  Schedule Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:border-blue-700 dark:focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-primary/20 transition-all"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-muted-foreground">
                  The date from which the class sequence begins mapping.
                </p>
              </div>
            </div>

            {/* Override existing classes checkbox */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="overrideExisting"
                checked={overrideExisting}
                onChange={(e) => setOverrideExisting(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 dark:text-primary focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor="overrideExisting"
                className="text-xs font-medium text-slate-700 dark:text-foreground cursor-pointer select-none"
              >
                Override & replace existing upcoming scheduled classes from this start date
              </label>
            </div>
          </div>

          {/* Section 2: Selected Classes Queue & Reordering */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-primary flex items-center gap-2">
                  <Layers size={15} />
                  <span>2. Class Sequence Queue ({orderedClasses.length} Scheduled)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
                  Click and drag using the horizontal handle to reorder classes across scheduled dates & days.
                </p>
              </div>

              {/* Quick Class Picker to add more */}
              <div className="flex items-center gap-2">
                <select
                  value={additionalClassPicker}
                  onChange={(e) => handleAddClass(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-1.5 text-xs text-foreground focus:border-blue-700 dark:focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="">+ Add Class to Queue…</option>
                  {internalClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {orderedClasses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-border p-6 text-center text-xs text-slate-500 dark:text-muted-foreground">
                No classes selected. Select classes from the library or use the dropdown above.
              </div>
            ) : (
              <div className="space-y-2">
                {orderedClasses.map((cls, idx) => {
                  const isBeingDragged = draggedIndex === idx;
                  const isDropTarget = dragOverIndex === idx && draggedIndex !== idx;

                  return (
                    <div
                      key={`${cls.id}-${idx}`}
                      data-class-row-index={idx}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragEnter={(e) => handleDragEnter(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragLeave={(e) => handleDragLeave(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`relative flex items-center justify-between rounded-xl border p-3 transition-all select-none ${
                        isBeingDragged
                          ? "opacity-40 border-dashed border-blue-500 dark:border-primary scale-[0.99] bg-blue-50/20 dark:bg-primary/5 shadow-inner"
                          : isDropTarget
                          ? "border-blue-600 dark:border-primary ring-2 ring-blue-500/30 bg-blue-50/80 dark:bg-primary/10 shadow-md scale-[1.01]"
                          : "border-slate-200/90 dark:border-border bg-white dark:bg-card shadow-2xs hover:border-slate-300 dark:hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Horizontal Three-Line Drag Handle */}
                        <div
                          onPointerDown={(e) => handleHandlePointerDown(e, idx)}
                          className="flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-slate-100 dark:text-muted-foreground dark:hover:text-primary dark:hover:bg-muted cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none select-none"
                          title="Click and drag to reorder class across scheduled dates and days"
                          aria-label="Drag to reorder class"
                        >
                          <Menu size={16} strokeWidth={2.2} className="pointer-events-none" />
                        </div>

                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-primary/10 text-blue-700 dark:text-primary text-xs font-extrabold shrink-0">
                          #{idx + 1}
                        </span>

                        <div className="min-w-0 pointer-events-none">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 dark:text-foreground">
                              {cls.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-muted px-1.5 py-0.5 rounded">
                              {cls.id}
                            </span>

                            {/* Scheduled Date & Day Pill */}
                            {previewDates[idx] && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:text-primary border border-blue-200/60 dark:border-primary/20">
                                <CalendarDays size={11} />
                                <span>{previewDates[idx].displayDate}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-muted-foreground truncate max-w-md">
                            {cls.intermediateWorkouts !== "Not specified"
                              ? cls.intermediateWorkouts
                              : cls.beginnerWorkouts}
                          </p>
                        </div>
                      </div>

                      {/* Right Action: Delete */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {isDropTarget && previewDates[idx] && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-primary bg-blue-100/70 dark:bg-primary/20 px-2 py-0.5 rounded-md animate-pulse">
                            Move here: {previewDates[idx].dayOfWeek}
                          </span>
                        )}
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveClass(idx);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                          title="Remove from Assignment"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Real-Time Date & Day Mapping Preview Table */}
          {previewDates.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-primary flex items-center gap-2">
                  <Sparkles size={15} />
                  <span>3. Date-wise & Day-wise Calendar Mapping Preview</span>
                </h3>
                <span className="text-[11px] text-slate-400 dark:text-muted-foreground">
                  Exact session slots that will be created
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-muted/50 border-b border-slate-200 dark:border-border text-slate-700 dark:text-foreground font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-12">Seq</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Day of Week</th>
                      <th className="py-2.5 px-3">Assigned Class Program</th>
                      <th className="py-2.5 px-3">Workouts Plan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-border/60">
                    {previewDates.map((slot, index) => {
                      const mappedClass = orderedClasses[index];
                      return (
                        <tr
                          key={`${slot.date}-${index}`}
                          className="hover:bg-slate-50/50 dark:hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                            #{index + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-foreground whitespace-nowrap">
                            {slot.date}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="rounded-md bg-blue-50 dark:bg-primary/10 text-blue-700 dark:text-primary font-bold px-2 py-0.5 text-[11px]">
                              {slot.dayOfWeek}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-foreground whitespace-nowrap">
                            {mappedClass?.name || "Unassigned"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-muted-foreground max-w-sm">
                            <div className="space-y-0.5">
                              {mappedClass?.beginnerWorkouts && mappedClass.beginnerWorkouts !== "Not specified" && (
                                <div className="text-[11px] truncate">
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Beg: </span>
                                  {mappedClass.beginnerWorkouts}
                                </div>
                              )}
                              {mappedClass?.intermediateWorkouts && mappedClass.intermediateWorkouts !== "Not specified" && (
                                <div className="text-[11px] truncate">
                                  <span className="font-semibold text-blue-600 dark:text-blue-400">Int: </span>
                                  {mappedClass.intermediateWorkouts}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 dark:border-border p-4 px-6 bg-white dark:bg-card shrink-0 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
            {orderedClasses.length} class(es) queued for{" "}
            <strong>{activeBatch?.name || "selected batch"}</strong>
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-2 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting || orderedClasses.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 dark:bg-primary px-5 py-2 text-xs sm:text-sm font-bold text-white dark:text-primary-foreground shadow-md hover:bg-blue-800 dark:hover:bg-primary/90 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Mapping & Scheduling…</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Confirm Batch Mapping ({orderedClasses.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
