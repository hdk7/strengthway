"use strict";

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// ─── Required variables — app will not start without these ───────────────────
const REQUIRED_VARS = ["MONGODB_URI", "JWT_SECRET"];

REQUIRED_VARS.forEach((key) => {
  if (!process.env[key] || process.env[key].trim() === "") {
    throw new Error(
      `[Config] Missing required environment variable: "${key}". ` +
        `Copy .env.example to .env and fill in the values.`
    );
  }
});

// ─── Exported config object (frozen to prevent mutation) ─────────────────────
const config = Object.freeze({
  // Server
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_TEST: process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined,

  // Database
  MONGODB_URI: process.env.MONGODB_URI,

  // Auth
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Cloudinary (optional — only needed when upload module is active)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  // CORS
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900_000, // 15 min
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,

  // Meta WhatsApp Cloud API
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN || "",
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
  WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET || "",
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "",
  WHATSAPP_GRAPH_API_VERSION: process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0",
  WHATSAPP_PAYMENT_TEMPLATE_NAME: process.env.WHATSAPP_PAYMENT_TEMPLATE_NAME || "membership_payment_link",
  WHATSAPP_PAYMENT_TEMPLATE_LANG: process.env.WHATSAPP_PAYMENT_TEMPLATE_LANG || "en_US",
  GYM_NAME: process.env.GYM_NAME || "Strengthway Gym",

  // Razorpay Payment Gateway
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",
});

module.exports = config;
