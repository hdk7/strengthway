/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import {
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Copy,
  ExternalLink,
  RefreshCw,
  Phone,
  ShieldCheck,
  FileCode,
  Info,
  Clock,
  Check,
  Zap,
  Globe,
  HelpCircle,
  X,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import {
  getWhatsAppConfig,
  sendWhatsAppTestMessage,
  getWhatsAppLogs,
} from "@/lib/whatsappService";

export default function WhatsAppIntegrationSection() {
  const [config, setConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Test Console State
  const [testPhone, setTestPhone] = useState("");
  const [useTemplate, setUseTemplate] = useState(true);
  const [testCustomText, setTestCustomText] = useState("");
  const [lastTestResult, setLastTestResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [cfg, logsRes] = await Promise.all([
        getWhatsAppConfig().catch((err) => {
          console.warn("Could not load config:", err);
          return null;
        }),
        getWhatsAppLogs({ limit: 10 }).catch(() => ({ data: [], total: 0 })),
      ]);
      setConfig(cfg);
      setLogs(logsRes?.data || []);
      setTotalLogs(logsRes?.total || 0);
    } catch (err) {
      toast.error("Failed to load WhatsApp integration data.");
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshLogs() {
    setIsRefreshingLogs(true);
    try {
      const logsRes = await getWhatsAppLogs({ limit: 10 });
      setLogs(logsRes?.data || []);
      setTotalLogs(logsRes?.total || 0);
      toast.success("Delivery logs refreshed.");
    } catch {
      toast.error("Could not refresh logs.");
    } finally {
      setIsRefreshingLogs(false);
    }
  }

  async function handleSendTestPing(e) {
    e.preventDefault();
    if (!testPhone.trim()) {
      toast.error("Please enter a valid recipient phone number.");
      return;
    }

    setIsSendingTest(true);
    setLastTestResult(null);

    try {
      const res = await sendWhatsAppTestMessage({
        toPhone: testPhone.trim(),
        messageText: testCustomText.trim(),
        useTemplate,
      });

      setLastTestResult(res);
      toast.success("Test message dispatched successfully!");
      refreshLogs();
    } catch (err) {
      toast.error(err?.message || "Failed to dispatch test message.");
      setLastTestResult({
        success: false,
        error: err?.message || "Dispatch failed",
      });
    } finally {
      setIsSendingTest(false);
    }
  }

  function handleCopy(text, key) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const webhookPublicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/v1/whatsapp/webhook`
    : "https://your-domain.com/api/v1/whatsapp/webhook";

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "read":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "sent":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "simulated":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "failed":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8">
        <Loader2 size={24} className="animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-medium">
          Loading Meta WhatsApp Cloud API status...
        </span>
      </div>
    );
  }

  const isConfigured = config?.configured;

  return (
    <div className="space-y-6">
      {/* ── Top Overview Banner ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/20 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <MessageSquare size={17} />
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-display text-foreground tracking-tight">
                Official Meta WhatsApp Cloud API
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  isConfigured
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                    isConfigured ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span>{isConfigured ? "Production Cloud API Active" : "Simulated Mode Active"}</span>
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Official WhatsApp Business Platform Cloud API engine. Membership payment links are automatically sent to prospective athletes upon enrollment invoice creation. Deliveries and read receipts synchronize via webhook.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowSetupModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer shadow-xs hover:border-foreground/20"
            >
              <HelpCircle size={14} className="text-primary" />
              <span>Setup Guide & Docs</span>
            </button>
          </div>
        </div>

        {/* Informational banner if not yet connected to production API */}
        {!isConfigured && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-xs text-amber-300">
            <Info size={16} className="shrink-0 mt-0.5 text-amber-400" />
            <div className="space-y-1">
              <span className="font-bold">Decoupled Simulation Mode Active</span>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Backend environment variables <code className="font-mono bg-amber-500/20 px-1 py-0.5 rounded">WHATSAPP_ACCESS_TOKEN</code> and <code className="font-mono bg-amber-500/20 px-1 py-0.5 rounded">WHATSAPP_PHONE_NUMBER_ID</code> are not configured yet. The CRM is safely generating simulated delivery tokens (<code className="font-mono">wamid.sim_...</code>) and direct WhatsApp Web link dispatches.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Metadata Cards Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Phone Number ID */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Phone Number ID</span>
            <Phone size={14} className="text-primary" />
          </div>
          <div className="flex items-center justify-between font-mono text-sm font-semibold text-foreground">
            <span>{config?.phoneNumberId || "Not Connected"}</span>
            {config?.rawPhoneNumberId && (
              <button
                type="button"
                onClick={() => handleCopy(config.rawPhoneNumberId, "phoneId")}
                className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                title="Copy full Phone ID"
              >
                {copiedKey === "phoneId" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">Meta Business Cloud sender identity</p>
        </div>

        {/* Card 2: Business Account ID */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">WABA Account ID</span>
            <Globe size={14} className="text-emerald-400" />
          </div>
          <div className="flex items-center justify-between font-mono text-sm font-semibold text-foreground">
            <span>{config?.businessAccountId || "Not Connected"}</span>
            {config?.rawBusinessAccountId && (
              <button
                type="button"
                onClick={() => handleCopy(config.rawBusinessAccountId, "wabaId")}
                className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                title="Copy WABA ID"
              >
                {copiedKey === "wabaId" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">WhatsApp Business Account reference</p>
        </div>

        {/* Card 3: Graph API Version */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Graph API Version</span>
            <FileCode size={14} className="text-blue-400" />
          </div>
          <div className="font-mono text-sm font-semibold text-foreground">
            {config?.graphApiVersion || "v20.0"}
          </div>
          <p className="text-[10px] text-muted-foreground">Current verified Meta endpoint</p>
        </div>

        {/* Card 4: Webhook Security */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Webhook Security</span>
            <ShieldCheck size={14} className="text-emerald-400" />
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span
              className={`h-2 w-2 rounded-full ${
                config?.hasAppSecret ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span>{config?.hasAppSecret ? "HMAC-SHA256 Active" : "Signature Optional"}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {config?.hasVerifyToken ? "Verify token protected" : "Default verify token"}
          </p>
        </div>
      </div>

      {/* ── Main Content Grid: Template Spec & Test Console ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Approved Message Template Specification */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileCode size={14} />
              </span>
              <h3 className="text-sm font-bold text-foreground">Payment Link Template Structure</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
              Category: UTILITY
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border/60">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Template Name
                </span>
                <span className="font-mono text-foreground font-semibold">
                  {config?.templateName || "membership_payment_link"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Language Code
                </span>
                <span className="font-mono text-foreground font-semibold">
                  {config?.templateLang || "en_US"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Dynamic Parameter Mapping
              </span>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="p-2 rounded-lg bg-card border border-border/80 flex items-center justify-between">
                  <span className="text-primary font-bold">{"{{1}}"}</span>
                  <span className="text-muted-foreground">Candidate Full Name</span>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border/80 flex items-center justify-between">
                  <span className="text-primary font-bold">{"{{2}}"}</span>
                  <span className="text-muted-foreground">Gym Facility Name ({config?.gymName})</span>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border/80 flex items-center justify-between">
                  <span className="text-primary font-bold">{"{{3}}"}</span>
                  <span className="text-muted-foreground">Selected Membership Plan</span>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border/80 flex items-center justify-between">
                  <span className="text-primary font-bold">{"{{4}}"}</span>
                  <span className="text-muted-foreground">Net Payable Amount (₹)</span>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border/80 flex items-center justify-between">
                  <span className="text-primary font-bold">{"{{5}}"}</span>
                  <span className="text-muted-foreground">Invoice Reference Number</span>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border/80 flex items-center justify-between">
                  <span className="text-primary font-bold">{"{{6}}"}</span>
                  <span className="text-muted-foreground">Hosted Payment Gateway URL</span>
                </div>
              </div>
            </div>

            {/* Chat Bubble Simulation Preview */}
            <div className="mt-4 pt-3 border-t border-border/60">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Live Chat Bubble Preview
              </span>
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] leading-relaxed text-foreground/90 space-y-2 relative">
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <span>🏋️ {config?.gymName || "Strengthway Gym"}</span>
                </div>
                <p>Hello <strong>Rahul Sharma</strong>, thank you for choosing <strong>{config?.gymName}</strong>.</p>
                <p>Your membership enrollment is ready.</p>
                <div className="p-2 rounded-lg bg-black/30 font-mono text-[10px] space-y-0.5">
                  <div>Plan: <strong>Quarterly Elite (3 Mo)</strong></div>
                  <div>Amount payable: <strong className="text-emerald-400">₹12,000</strong></div>
                  <div>Invoice reference: <strong>INV-2026-0042</strong></div>
                </div>
                <p>Complete your payment securely using the link below:</p>
                <div className="text-primary underline truncate font-mono text-[10px]">
                  https://strengthway.com/payment/checkout?link=xyz
                </div>
                <div className="text-[9px] text-muted-foreground text-right pt-1 flex items-center justify-end gap-1">
                  <span>10:42 AM</span>
                  <span className="text-emerald-400 font-bold">✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Test Dispatch Console */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Send size={14} />
                </span>
                <h3 className="text-sm font-bold text-foreground">Interactive Test Console</h3>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold">
                Admin Diagnostic Tool
              </span>
            </div>

            <form onSubmit={handleSendTestPing} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1">
                  Recipient Phone Number <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210 or 9876543210"
                    className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                    required
                  />
                  <Phone size={14} className="absolute right-3 top-2.5 text-muted-foreground pointer-events-none" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Indian 10-digit numbers automatically normalize with 91 prefix.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1.5">
                  Dispatch Format
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setUseTemplate(true)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      useTemplate
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <Radio size={14} className={useTemplate ? "text-primary" : "text-muted-foreground"} />
                    <div>
                      <div className="text-[11px]">Approved Template</div>
                      <div className="text-[9px] opacity-80">membership_payment_link</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUseTemplate(false)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      !useTemplate
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <Radio size={14} className={!useTemplate ? "text-primary" : "text-muted-foreground"} />
                    <div>
                      <div className="text-[11px]">Direct Text Message</div>
                      <div className="text-[9px] opacity-80">Within 24h window</div>
                    </div>
                  </button>
                </div>
              </div>

              {!useTemplate && (
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    Custom Message Text (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={testCustomText}
                    onChange={(e) => setTestCustomText(e.target.value)}
                    placeholder="Enter custom test ping message..."
                    className="w-full rounded-xl border border-border bg-muted/30 p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSendingTest}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {isSendingTest ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Transmitting to WhatsApp Cloud...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Test WhatsApp Ping</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Test Dispatch Result Card */}
          {lastTestResult && (
            <div className="mt-3 p-3.5 rounded-xl border border-border/80 bg-muted/20 text-xs space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-foreground flex items-center gap-1.5">
                  {lastTestResult.success !== false ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      <span>Ping Response: Success</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={13} className="text-rose-400" />
                      <span>Ping Response: Encountered Issue</span>
                    </>
                  )}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {lastTestResult.mode}
                </span>
              </div>

              {lastTestResult.messageId && (
                <div className="font-mono text-[10px] text-muted-foreground break-all">
                  Meta WAMID: <span className="text-foreground">{lastTestResult.messageId}</span>
                </div>
              )}

              {lastTestResult.note && (
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {lastTestResult.note}
                </p>
              )}

              {lastTestResult.error && (
                <p className="text-[11px] text-rose-400 font-mono">
                  Error: {lastTestResult.error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Webhook Endpoint Diagnostics ──────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border/70">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Zap size={14} />
            </span>
            <h3 className="text-sm font-bold text-foreground">Webhook Endpoint Diagnostics</h3>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground font-semibold">
            Status: Listening on /api/v1/whatsapp/webhook
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Callback URL (Configure in Meta Developer App)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookPublicUrl}
                className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopy(webhookPublicUrl, "webhookUrl")}
                className="shrink-0 p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Copy Webhook URL"
              >
                {copiedKey === "webhookUrl" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Webhook Verification Token
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={config?.hasVerifyToken ? "••••••••••••••••••••" : "strengthway_meta_webhook_secret_verify_2026"}
                className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopy("strengthway_meta_webhook_secret_verify_2026", "verifyToken")}
                className="shrink-0 p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Copy Verify Token"
              >
                {copiedKey === "verifyToken" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Meta automatically delivers <strong className="text-foreground">sent</strong>, <strong className="text-foreground">delivered</strong>, <strong className="text-foreground">read</strong>, and <strong className="text-foreground">failed</strong> callbacks to this endpoint. The backend validates the <code className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">X-Hub-Signature-256</code> header before processing.
        </p>
      </div>

      {/* ── Delivery Logs & Message History ─────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock size={14} />
            </span>
            <h3 className="text-sm font-bold text-foreground">Recent WhatsApp Message Dispatches</h3>
            <span className="text-[11px] font-mono font-bold text-muted-foreground">
              ({totalLogs} logged)
            </span>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
            <MessageSquare size={24} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="font-semibold text-foreground">No WhatsApp messages dispatched yet.</p>
            <p className="text-[11px]">Send a test ping above or create a new member enrollment dossier to begin tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/70 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Candidate / Context</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Delivery Status</th>
                  <th className="py-2.5 px-3">Dispatched At</th>
                  <th className="py-2.5 px-3">Message ID (WAMID)</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log._id || log.messageId} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {log.recipientPhone}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-foreground">{log.candidateName || "—"}</div>
                      {log.invoiceNumber && (
                        <div className="text-[10px] text-muted-foreground font-mono">
                          Ref: {log.invoiceNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="capitalize text-muted-foreground">{log.messageType}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getStatusBadge(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-sans text-[11px]">
                      {new Date(log.sentAt || log.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[150px]" title={log.messageId}>
                      {log.messageId}
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      {log.whatsappWebUrl && (
                        <a
                          href={log.whatsappWebUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                        >
                          <span>Direct Chat</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Setup Instructions Modal (Phase 2 & 10 Documentation) ────────────── */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between shrink-0 bg-card">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HelpCircle size={16} />
                </span>
                <h3 className="font-bold text-base text-foreground">
                  Meta WhatsApp Cloud API Configuration Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-muted-foreground leading-relaxed">
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <span className="font-bold text-foreground block">Overview</span>
                <p>
                  To switch from Simulated Mode to Official Meta Production Cloud API, complete the following steps in Meta for Developers (<a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">developers.facebook.com</a>).
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1">
                  <strong className="text-foreground text-xs block">1. Create or Select a Meta Developer App</strong>
                  <p>Create an app with type <strong className="text-foreground">Business</strong>. Under Add Products, select <strong className="text-foreground">WhatsApp</strong>.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1">
                  <strong className="text-foreground text-xs block">2. Obtain Phone Number ID & Access Token</strong>
                  <p>In the WhatsApp &gt; API Setup tab, copy your <strong className="text-foreground">Phone Number ID</strong> and <strong className="text-foreground">WhatsApp Business Account ID</strong>.</p>
                  <p>For production, create a System User in Meta Business Manager and generate a permanent token with <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">whatsapp_business_messaging</code> and <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">whatsapp_business_management</code> permissions.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1">
                  <strong className="text-foreground text-xs block">3. Configure Public HTTPS Webhook</strong>
                  <p>Configure the Webhook URL: <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">{webhookPublicUrl}</code></p>
                  <p>Verification Token: <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">strengthway_meta_webhook_secret_verify_2026</code> (or your custom value set in <code className="font-mono">WHATSAPP_WEBHOOK_VERIFY_TOKEN</code>).</p>
                  <p>Under Webhook Fields, subscribe to <strong className="text-foreground">messages</strong>.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1">
                  <strong className="text-foreground text-xs block">4. Submit Message Template for Approval</strong>
                  <p>In WhatsApp Manager &gt; Message Templates, create template <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">membership_payment_link</code> with category <strong className="text-foreground">UTILITY</strong> and 6 placeholders as documented on this screen.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1">
                  <strong className="text-foreground text-xs block">5. Backend Environment Variables</strong>
                  <p>Fill into <code className="font-mono text-foreground">StrengthwayBackend/.env</code>:</p>
                  <pre className="p-2.5 rounded-lg bg-black/40 text-[10px] font-mono text-emerald-400 overflow-x-auto mt-1">
WHATSAPP_ACCESS_TOKEN=EAAB...
WHATSAPP_PHONE_NUMBER_ID=1092837465...
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321...
WHATSAPP_APP_SECRET=a1b2c3d4...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=strengthway_meta_webhook_secret_verify_2026
                  </pre>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-border/80 bg-card flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
