import assert from "node:assert/strict";
import {
  APP_TIMEZONE,
  getAppDateTime,
  parseTimeToMinutes,
  getSessionTimingMinutes,
  getSessionInterchangeEligibility,
  isSessionEligibleForInterchange,
  filterInterchangeEligibleSessions,
} from "./classInterchangeUtils.js";

console.log("=== Testing Class Interchange Utilities ===");

// 1. parseTimeToMinutes tests
console.log("\n1. parseTimeToMinutes tests");
assert.equal(parseTimeToMinutes("06:00 AM"), 360);
assert.equal(parseTimeToMinutes("6:00 AM"), 360);
assert.equal(parseTimeToMinutes("07:00 AM"), 420);
assert.equal(parseTimeToMinutes("12:00 PM"), 720);
assert.equal(parseTimeToMinutes("01:00 PM"), 780);
assert.equal(parseTimeToMinutes("06:00 PM"), 1080);
assert.equal(parseTimeToMinutes("18:00"), 1080);
assert.equal(parseTimeToMinutes("18:30"), 1110);
assert.equal(parseTimeToMinutes("12:00 AM"), 0);
assert.equal(parseTimeToMinutes("12:30 AM"), 30);
assert.equal(parseTimeToMinutes("06:00 AM (Morning)"), 360);
assert.equal(parseTimeToMinutes("07:00 AM (IST)"), 420);
assert.equal(parseTimeToMinutes(null), null);
assert.equal(parseTimeToMinutes(""), null);
console.log("✓ parseTimeToMinutes passed all cases");

// 2. getSessionTimingMinutes tests
console.log("\n2. getSessionTimingMinutes tests");
const timing1 = getSessionTimingMinutes(
  { startTime: "06:00 AM", endTime: "07:00 AM" },
  null
);
assert.equal(timing1.startMinutes, 360);
assert.equal(timing1.endMinutes, 420);

const timing2 = getSessionTimingMinutes(
  { timing: "06:00 AM - 07:00 AM" },
  null
);
assert.equal(timing2.startMinutes, 360);
assert.equal(timing2.endMinutes, 420);

const timing3 = getSessionTimingMinutes(
  {},
  { timingLabel: "07:00 AM – 08:00 AM" }
);
assert.equal(timing3.startMinutes, 420);
assert.equal(timing3.endMinutes, 480);
console.log("✓ getSessionTimingMinutes passed all cases");

// 3. Timezone aware getAppDateTime
console.log("\n3. getAppDateTime tests");
const appDt = getAppDateTime("Asia/Kolkata");
assert.ok(appDt.dateStr.match(/^\d{4}-\d{2}-\d{2}$/));
assert.ok(appDt.currentTimeMinutes >= 0 && appDt.currentTimeMinutes < 1440);
assert.equal(appDt.timeZone, "Asia/Kolkata");
console.log(`✓ Current App Time in Kolkata: ${appDt.dateStr} at ${Math.floor(appDt.currentTimeMinutes/60)}:${String(appDt.currentTimeMinutes%60).padStart(2, "0")} (${appDt.currentTimeMinutes}m)`);

// 4. getSessionInterchangeEligibility tests
console.log("\n4. getSessionInterchangeEligibility tests");
const mockBatch = {
  id: "BATCH-01",
  timingLabel: "06:00 AM - 07:00 AM",
  startTime: "06:00 AM",
  endTime: "07:00 AM",
};

// Simulation mock datetime: Today is 2026-10-14, 10:00 AM (600 minutes)
const simDateTime = {
  dateStr: "2026-10-14",
  currentTimeMinutes: 600, // 10:00 AM
  hour: 10,
  minute: 0,
  timeZone: "Asia/Kolkata",
};

// Test 4a: Past date class (e.g. 2026-10-12) -> Ineligible
const pastSession = {
  id: "SES-PAST",
  sessionDate: "2026-10-12",
  status: "SCHEDULED",
  timing: "06:00 AM - 07:00 AM",
};
const resPast = getSessionInterchangeEligibility(pastSession, mockBatch, simDateTime);
assert.equal(resPast.eligible, false);
assert.match(resPast.reason, /already passed/i);
console.log("✓ Past date session rejected");

// Test 4b: Explicitly COMPLETED session -> Ineligible
const completedSession = {
  id: "SES-COMP",
  sessionDate: "2026-10-15",
  status: "COMPLETED",
};
const resComp = getSessionInterchangeEligibility(completedSession, mockBatch, simDateTime);
assert.equal(resComp.eligible, false);
assert.match(resComp.reason, /already been completed/i);
console.log("✓ COMPLETED status session rejected");

// Test 4c: CANCELLED session -> Ineligible
const cancelledSession = {
  id: "SES-CANC",
  sessionDate: "2026-10-15",
  status: "CANCELLED",
};
const resCanc = getSessionInterchangeEligibility(cancelledSession, mockBatch, simDateTime);
assert.equal(resCanc.eligible, false);
assert.match(resCanc.reason, /cancelled/i);
console.log("✓ CANCELLED status session rejected");

// Test 4d: Session with recorded attendance -> Ineligible
const attendedSession = {
  id: "SES-ATT",
  sessionDate: "2026-10-15",
  status: "SCHEDULED",
  attendedCount: 5,
};
const resAtt = getSessionInterchangeEligibility(attendedSession, mockBatch, simDateTime);
assert.equal(resAtt.eligible, false);
assert.match(resAtt.reason, /attendance/i);
console.log("✓ Session with attendance rejected");

// Test 4e: Today's class whose end time already passed (ended at 07:00 AM, current is 10:00 AM) -> Ineligible
const endedTodaySession = {
  id: "SES-ENDED-TODAY",
  sessionDate: "2026-10-14",
  status: "SCHEDULED",
  startTime: "06:00 AM",
  endTime: "07:00 AM",
};
const resEnded = getSessionInterchangeEligibility(endedTodaySession, mockBatch, simDateTime);
assert.equal(resEnded.eligible, false);
assert.equal(resEnded.status, "ENDED_TODAY");
assert.match(resEnded.reason, /ended today/i);
console.log("✓ Today's ended session rejected");

// Test 4f: Today's class currently in progress (sim current: 10:00 AM, class: 09:30 AM - 10:30 AM) -> Ineligible
const inProgressTodaySession = {
  id: "SES-INPROGRESS-TODAY",
  sessionDate: "2026-10-14",
  status: "SCHEDULED",
  startTime: "09:30 AM",
  endTime: "10:30 AM",
};
const resInProgress = getSessionInterchangeEligibility(inProgressTodaySession, mockBatch, simDateTime);
assert.equal(resInProgress.eligible, false);
assert.equal(resInProgress.status, "IN_PROGRESS_TODAY");
assert.match(resInProgress.reason, /in progress/i);
console.log("✓ Today's in-progress session rejected");

// Test 4g: Today's upcoming class (sim current: 10:00 AM, class: 06:00 PM - 07:00 PM) -> Eligible!
const upcomingTodaySession = {
  id: "SES-UPCOMING-TODAY",
  sessionDate: "2026-10-14",
  status: "SCHEDULED",
  startTime: "06:00 PM",
  endTime: "07:00 PM",
};
const resUpcomingToday = getSessionInterchangeEligibility(upcomingTodaySession, mockBatch, simDateTime);
assert.equal(resUpcomingToday.eligible, true);
assert.equal(resUpcomingToday.status, "UPCOMING_TODAY");
console.log("✓ Today's upcoming session accepted");

// Test 4h: Future date class (e.g. 2026-10-16) -> Eligible!
const futureSession = {
  id: "SES-FUTURE",
  sessionDate: "2026-10-16",
  status: "SCHEDULED",
  startTime: "06:00 AM",
  endTime: "07:00 AM",
};
const resFuture = getSessionInterchangeEligibility(futureSession, mockBatch, simDateTime);
assert.equal(resFuture.eligible, true);
assert.equal(resFuture.status, "UPCOMING_FUTURE");
console.log("✓ Future scheduled session accepted");

// 5. filterInterchangeEligibleSessions test
console.log("\n5. filterInterchangeEligibleSessions tests");
const allTestSessions = [
  pastSession,
  completedSession,
  cancelledSession,
  attendedSession,
  endedTodaySession,
  inProgressTodaySession,
  upcomingTodaySession,
  futureSession,
];

const filtered = filterInterchangeEligibleSessions(allTestSessions, mockBatch, simDateTime);
assert.equal(filtered.length, 2);
assert.deepEqual(filtered.map(s => s.id), ["SES-UPCOMING-TODAY", "SES-FUTURE"]);
console.log("✓ filterInterchangeEligibleSessions correctly retained only upcoming_today and future sessions!");

console.log("\nALL TESTS PASSED SUCCESSFULLY! ✓✓✓");
