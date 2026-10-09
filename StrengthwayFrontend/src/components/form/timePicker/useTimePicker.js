import { useState, useEffect, useRef } from "react";
import { parseTimeString } from "./timeUtils";

// --- useTimePicker -------------------------------------------------------------
// Custom hook that owns all state and handler logic for TimePickerField.
// Returns refs, state values, and event handlers ready to be spread onto inputs.

export function useTimePicker({ value, name, onChange, disabled }) {
  const initial = parseTimeString(value);

  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState(initial.period);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Clock picker internal state
  const [clockStep, setClockStep] = useState("hour");
  const [clockHour, setClockHour] = useState(parseInt(initial.hour, 10));
  const [clockMinute, setClockMinute] = useState(parseInt(initial.minute, 10));
  const [clockPeriod, setClockPeriod] = useState(initial.period);

  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const containerRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    const parsed = parseTimeString(value);
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setPeriod(parsed.period);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsPickerOpen(false);
      }
    }
    if (isPickerOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPickerOpen]);

  const triggerChange = (newHour, newMinute, newPeriod) => {
    const formatted = `${newHour}:${newMinute} ${newPeriod}`;
    if (typeof onChange === "function") {
      onChange({ target: { name, value: formatted }, currentTarget: { name, value: formatted } });
    }
  };

  // -- Text input handlers ---------------------------------------------------

  const handleHourChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length === 0) { setHour(""); return; }
    const num = parseInt(raw, 10);
    if (num > 12) {
      setHour("12"); triggerChange("12", minute, period);
      minuteRef.current?.focus(); minuteRef.current?.select(); return;
    }
    if (raw.length === 1 && num > 1) {
      const padded = `0${num}`;
      setHour(padded); triggerChange(padded, minute, period);
      minuteRef.current?.focus(); minuteRef.current?.select(); return;
    }
    if (raw.length === 2) {
      const padded = String(Math.max(1, Math.min(12, num))).padStart(2, "0");
      setHour(padded); triggerChange(padded, minute, period);
      minuteRef.current?.focus(); minuteRef.current?.select(); return;
    }
    setHour(raw);
  };

  const handleHourBlur = () => {
    const num = Math.max(1, Math.min(12, parseInt(hour, 10) || 6));
    const padded = String(num).padStart(2, "0");
    setHour(padded); triggerChange(padded, minute, period);
  };

  const handleHourKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = (parseInt(hour, 10) || 12) === 12 ? 1 : (parseInt(hour, 10) || 12) + 1;
      const padded = String(next).padStart(2, "0");
      setHour(padded); triggerChange(padded, minute, period);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (parseInt(hour, 10) || 12) === 1 ? 12 : (parseInt(hour, 10) || 12) - 1;
      const padded = String(next).padStart(2, "0");
      setHour(padded); triggerChange(padded, minute, period);
    } else if (e.key === "ArrowRight" || e.key === ":") {
      e.preventDefault();
      minuteRef.current?.focus(); minuteRef.current?.select();
    }
  };

  const handleMinuteChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length === 0) { setMinute(""); return; }
    const num = parseInt(raw, 10);
    if (num > 59) { setMinute("59"); triggerChange(hour, "59", period); return; }
    if (raw.length === 2) {
      const padded = String(Math.max(0, Math.min(59, num))).padStart(2, "0");
      setMinute(padded); triggerChange(hour, padded, period); return;
    }
    setMinute(raw);
  };

  const handleMinuteBlur = () => {
    const num = Math.max(0, Math.min(59, parseInt(minute, 10) || 0));
    const padded = String(num).padStart(2, "0");
    setMinute(padded); triggerChange(hour, padded, period);
  };

  const handleMinuteKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.shiftKey ? 15 : 5;
      const next = (Math.floor((parseInt(minute, 10) || 0) / step) * step + step) % 60;
      const padded = String(next).padStart(2, "0");
      setMinute(padded); triggerChange(hour, padded, period);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const step = e.shiftKey ? 15 : 5;
      const next = ((parseInt(minute, 10) || 0) - step + 60) % 60;
      const padded = String(next).padStart(2, "0");
      setMinute(padded); triggerChange(hour, padded, period);
    } else if (e.key === "ArrowLeft" || (e.key === "Backspace" && minute === "")) {
      e.preventDefault();
      hourRef.current?.focus(); hourRef.current?.select();
    }
  };

  const handlePeriodToggle = (newPeriod) => {
    if (disabled || period === newPeriod) return;
    setPeriod(newPeriod);
    const vh = hour ? String(parseInt(hour, 10) || 6).padStart(2, "0") : "06";
    const vm = minute ? String(parseInt(minute, 10) || 0).padStart(2, "0") : "00";
    triggerChange(vh, vm, newPeriod);
  };

  // -- Clock picker handlers -------------------------------------------------

  const openClock = () => {
    const parsed = parseTimeString(value);
    setClockHour(parseInt(parsed.hour, 10));
    setClockMinute((Math.round(parseInt(parsed.minute, 10) / 5) * 5) % 60);
    setClockPeriod(parsed.period);
    setClockStep("hour");
    setIsPickerOpen(true);
  };

  const handleClockHourClick = (h) => {
    setClockHour(h);
    setTimeout(() => setClockStep("minute"), 120);
  };

  const handleClockConfirm = () => {
    const h = String(clockHour).padStart(2, "0");
    const m = String(clockMinute).padStart(2, "0");
    setHour(h); setMinute(m); setPeriod(clockPeriod);
    triggerChange(h, m, clockPeriod);
    setIsPickerOpen(false);
  };

  return {
    // refs
    hourRef, minuteRef, containerRef,
    // text input state + handlers
    hour, minute, period,
    handleHourChange, handleHourBlur, handleHourKeyDown,
    handleMinuteChange, handleMinuteBlur, handleMinuteKeyDown,
    handlePeriodToggle,
    // clock picker state + handlers
    isPickerOpen, setIsPickerOpen,
    clockStep, setClockStep,
    clockHour, setClockHour,
    clockMinute, setClockMinute,
    clockPeriod, setClockPeriod,
    openClock, handleClockHourClick, handleClockConfirm,
  };
}
