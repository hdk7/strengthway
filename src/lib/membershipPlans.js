/* eslint-disable max-lines */
/**
 * Standard gym membership plans and payment configuration for The Strength Way.
 * Features localStorage persistence and dynamic master management.
 */

const STORAGE_KEY = "thestrengthway_membership_plans_v1";

export const DEFAULT_MEMBERSHIP_PLANS = [
  {
    id: "plan-monthly",
    name: "Monthly Starter",
    durationMonths: 1,
    price: 7000,
    formattedPrice: "₹7,000",
    period: "/mo",
    billing: "Billed ₹7,000 every month",
    description: "Full facility access with flexible month-to-month commitment.",
    badge: null,
    popular: false,
    status: "Active",
    features: [
      "Full access to every program — Strength, Calisthenics & Mobility",
      "Unlimited group training classes",
      "Certified coach floor supervision",
      "Locker & shower facilities",
    ],
  },
  {
    id: "plan-quarterly",
    name: "Quarterly Pro",
    durationMonths: 3,
    price: 18000,
    formattedPrice: "₹18,000",
    period: "/3mo",
    billing: "Billed ₹18,000 every 3 months",
    description:
      "Billed ₹18,000 every 3 months. Perfect balance of commitment and athletic progression.",
    badge: "MOST POPULAR",
    popular: true,
    status: "Active",
    features: [
      "All Monthly Starter tier benefits included",
      "Quarterly 1-on-1 athletic fitness assessment",
      "Customized hypertrophy & strength split",
      "Priority batch slot booking",
      "Bi-weekly body composition analysis",
    ],
  },
  {
    id: "plan-half-yearly",
    name: "Half-Yearly Elite",
    durationMonths: 6,
    price: 32000,
    formattedPrice: "₹32,000",
    period: "/6mo",
    billing: "Billed ₹32,000 every 6 months",
    description:
      "Dedicated 6-month transformational track with custom nutritional & strength roadmap.",
    badge: "BEST VALUE",
    popular: false,
    status: "Active",
    features: [
      "All Quarterly Pro tier benefits included",
      "Personalized macro & nutrition consultation",
      "1 Complimentary 1-on-1 personal training session per month",
      "Dedicated gear locker reservation",
      "Exclusive athlete community workshop access",
    ],
  },
  {
    id: "plan-annual",
    name: "Annual Champion",
    durationMonths: 12,
    price: 58000,
    formattedPrice: "₹58,000",
    period: "/yr",
    billing: "Billed ₹58,000 annually (Save 31%)",
    description:
      "Our complete 1-year athletic commitment program. Full VIP privileges across all facilities.",
    badge: "VIP ACCESS",
    popular: false,
    status: "Active",
    features: [
      "Complete VIP facility and priority rig access 365 days",
      "Quarterly personal training intensives with head coaches",
      "Unlimited guest passes (up to 4 per quarter)",
      "Complimentary gym apparel & lifting straps pack",
      "Dedicated nutrition & physique progress check-ins",
    ],
  },
];

function readStorage() {
  if (typeof window === "undefined") return DEFAULT_MEMBERSHIP_PLANS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MEMBERSHIP_PLANS));
      return DEFAULT_MEMBERSHIP_PLANS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MEMBERSHIP_PLANS));
    return DEFAULT_MEMBERSHIP_PLANS;
  } catch {
    return DEFAULT_MEMBERSHIP_PLANS;
  }
}

function writeStorage(plans) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore storage write errors
  }
}

export function getMembershipPlans(includeInactive = true, includeDeleted = false) {
  const all = readStorage();
  return all.filter((p) => {
    if (!includeDeleted && p.isDeleted) return false;
    if (!includeInactive && p.status !== "Active") return false;
    return true;
  });
}

export function getMembershipPlanById(id) {
  const all = readStorage();
  return all.find((p) => p.id === id) || null;
}

export function createMembershipPlan(planData) {
  const all = readStorage();
  const priceNum = Number(planData.price) || 0;
  const durationMonths = Number(planData.durationMonths) || 1;

  const newPlan = {
    id: planData.id?.trim() || `plan-${Date.now().toString().slice(-6)}`,
    name: planData.name?.trim() || "New Plan",
    durationMonths,
    price: priceNum,
    formattedPrice: `₹${priceNum.toLocaleString("en-IN")}`,
    period: planData.period?.trim() || (durationMonths === 1 ? "/mo" : `/${durationMonths}mo`),
    billing:
      planData.billing?.trim() ||
      `Billed ₹${priceNum.toLocaleString("en-IN")} for ${durationMonths} month(s)`,
    description: planData.description?.trim() || "",
    badge: planData.badge?.trim() || null,
    popular: Boolean(planData.popular),
    status: planData.status || "Active",
    isDeleted: false,
    deletedAt: null,
    features: Array.isArray(planData.features) ? planData.features.filter(Boolean) : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [...all, newPlan];
  writeStorage(updated);
  return newPlan;
}

export function updateMembershipPlan(id, patch) {
  const all = readStorage();
  let updatedPlan = null;

  const updated = all.map((plan) => {
    if (plan.id === id) {
      const priceNum = patch.price !== undefined ? Number(patch.price) : plan.price;
      const durationMonths =
        patch.durationMonths !== undefined ? Number(patch.durationMonths) : plan.durationMonths;

      updatedPlan = {
        ...plan,
        ...patch,
        price: priceNum,
        formattedPrice: `₹${priceNum.toLocaleString("en-IN")}`,
        durationMonths,
        period: patch.period !== undefined ? patch.period : plan.period,
        billing:
          patch.billing !== undefined
            ? patch.billing
            : `Billed ₹${priceNum.toLocaleString("en-IN")} for ${durationMonths} month(s)`,
        features: Array.isArray(patch.features) ? patch.features.filter(Boolean) : plan.features,
        updatedAt: new Date().toISOString(),
      };
      return updatedPlan;
    }
    return plan;
  });

  if (updatedPlan) {
    writeStorage(updated);
  }
  return updatedPlan;
}

export function toggleMembershipPlanStatus(id) {
  const all = readStorage();
  let toggled = null;
  const updated = all.map((p) => {
    if (p.id === id) {
      toggled = {
        ...p,
        status: p.status === "Active" ? "Inactive" : "Active",
        updatedAt: new Date().toISOString(),
      };
      return toggled;
    }
    return p;
  });
  if (toggled) {
    writeStorage(updated);
  }
  return toggled;
}

export function softDeleteMembershipPlan(id) {
  const all = readStorage();
  let deletedPlan = null;
  const updated = all.map((plan) => {
    if (plan.id === id) {
      deletedPlan = {
        ...plan,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return deletedPlan;
    }
    return plan;
  });
  if (deletedPlan) {
    writeStorage(updated);
  }
  return deletedPlan;
}

export function restoreMembershipPlan(id) {
  const all = readStorage();
  let restoredPlan = null;
  const updated = all.map((plan) => {
    if (plan.id === id) {
      restoredPlan = {
        ...plan,
        isDeleted: false,
        deletedAt: null,
        status: "Active",
        updatedAt: new Date().toISOString(),
      };
      return restoredPlan;
    }
    return plan;
  });
  if (restoredPlan) {
    writeStorage(updated);
  }
  return restoredPlan;
}

export function permanentDeleteMembershipPlan(id) {
  const all = readStorage();
  const filtered = all.filter((p) => p.id !== id);
  writeStorage(filtered);
  return true;
}

export function deleteMembershipPlan(id) {
  return softDeleteMembershipPlan(id);
}

// Backward compatible static export - dynamically evaluates current storage if in browser
export const MEMBERSHIP_PLANS =
  typeof window !== "undefined" ? readStorage() : DEFAULT_MEMBERSHIP_PLANS;

export const PAYMENT_METHODS = [
  {
    id: "UPI",
    name: "UPI / QR Code",
    description: "Instant payment via Google Pay, PhonePe, Paytm, BHIM",
    icon: "QrCode",
  },
  {
    id: "Card",
    name: "Credit / Debit Card",
    description: "Visa, MasterCard, RuPay, Maestro",
    icon: "CreditCard",
  },
  {
    id: "NetBanking",
    name: "Net Banking",
    description: "Direct bank transfer from all major Indian banks",
    icon: "Building2",
  },
  {
    id: "Cash",
    name: "Cash / Front Desk POS",
    description: "Physical cash payment received at gym reception counter",
    icon: "Banknote",
  },
];

/**
 * Calculates start and expiry dates for a membership plan.
 */
export function calculateMembershipDates(durationMonths, startDate = new Date()) {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + durationMonths);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    formattedStart: start.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    formattedEnd: end.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  };
}

/**
 * Generates an official transaction reference number.
 */
export function generateTransactionId(method = "UPI") {
  const prefix = method.toUpperCase().slice(0, 3);
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TXN-${prefix}-${timestamp}-${random}`;
}

/**
 * Generates a formal membership receipt number.
 */
export function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const sequence = Math.floor(10000 + Math.random() * 90000);
  return `TSW-REC-${year}-${sequence}`;
}
