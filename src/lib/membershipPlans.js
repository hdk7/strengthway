/**
 * Standard gym membership plans and payment configuration for The Strength Way.
 */

export const MEMBERSHIP_PLANS = [
  {
    id: "plan-monthly",
    name: "Monthly",
    durationMonths: 1,
    price: 7000,
    formattedPrice: "₹7,000",
    period: "/month",
    description: "Full facility access with flexible month-to-month commitment.",
    badge: null,
    popular: false,
    features: [
      "Full gym & functional floor access",
      "Unlimited group training classes",
      "Certified coach floor supervision",
      "Locker & shower facilities",
    ],
  },
  {
    id: "plan-quarterly",
    name: "Quarterly",
    durationMonths: 3,
    price: 18000,
    formattedPrice: "₹18,000",
    period: "/3 months",
    description: "Billed ₹18,000 every 3 months. Perfect balance of commitment and results.",
    badge: "MOST POPULAR",
    popular: true,
    features: [
      "All Monthly tier benefits included",
      "Quarterly 1-on-1 athletic fitness assessment",
      "Customized hypertrophy & strength split",
      "Priority batch slot booking",
    ],
  },
];

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
