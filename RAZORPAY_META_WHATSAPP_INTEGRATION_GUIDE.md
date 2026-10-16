# Razorpay Payment Links & Meta WhatsApp Cloud API Integration Guide
### Strengthway Gym CRM — Architecture, Setup & Operational Manual

This comprehensive guide details the complete configuration, security protocols, API references, and testing workflows for **Razorpay Payment Links** and **Meta's Official WhatsApp Business Platform Cloud API** in Strengthway Gym CRM.

---

## 1. End-to-End System Architecture

```
[Candidate Inquires]
       │
       ▼
 [Inquiry Logged] ─────────► [Admin Calls / Follows Up]
                                     │
                                     ▼ (Outcome: Proceed to Enrollment)
                       [Admin Opens Enrollment Form]
                                     │
                                     ├─ Selects Membership Plan & Batch
                                     ├─ Applies Authorized Concession (Fixed / %)
                                     └─ Backend validates pricing & start date
                                     │
                                     ▼
                     [Create Pending Invoice & Enrollment]
                        (Status: "Pending Payment", "PENDING")
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
 [Razorpay Payment Gateway]                   [Meta WhatsApp Cloud API]
  - Generates secure hosted link               - Uses approved template or text
  - Amount converted INR ➔ paise               - Dynamic variables (1-6)
  - Unique invoice reference_id                - Injected hosted checkout URL
             │                                               │
             │                                               ▼
             │                                   [Candidate's WhatsApp]
             │                                   - Delivery receipt (sent/delivered/read)
             │                                   - ⚠️ Delivery NEVER marks paid
             ▼                                               │
 [Customer Pays via Razorpay]                                │
  (UPI / Card / Net Banking)                                 ▼
             │                                   [Meta Status Webhook]
             ▼                                   (POST /api/v1/whatsapp/webhook)
 [Razorpay Webhook: payment_link.paid]           - HMAC-SHA256 verified
  (POST /api/v1/enrollments/webhook/razorpay)    - Updates message delivery status
  - HMAC-SHA256 signature verified
  - Matches enrollment / invoice
  - Confirms amount and currency
             │
             ▼
 [Automatic Member Conversion & Activation]
  - Invoice marked "Paid"
  - Active Member record generated (MEM-YYYY-XXXX)
  - Membership dates calculated
  - Batch capacity allocated
  - Official Receipt generated with UPI UTR
  - Originating Inquiry marked "Converted"
```

---

## 2. Environment Variables Specification

Ensure `StrengthwayBackend/.env` contains the following configuration keys:

```env
# ─── Server & Application ─────────────────────────────────────
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
GYM_NAME=Strengthway Gym

# ─── Razorpay Payment Gateway ─────────────────────────────────
# Retrieve from Razorpay Dashboard > Settings > API Keys
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_key_here
# Retrieve from Razorpay Dashboard > Settings > Webhooks
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here

# ─── Meta WhatsApp Business Cloud API ──────────────────────────
# Retrieve from Meta Developer App > WhatsApp > API Setup & Business Manager
WHATSAPP_ACCESS_TOKEN=your_system_user_permanent_token_here
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_whatsapp_business_account_id_here
# Retrieve from Meta Developer App > Settings > Basic
WHATSAPP_APP_SECRET=your_meta_app_secret_here
# Custom secret string configured in Meta Webhooks Dashboard
WHATSAPP_WEBHOOK_VERIFY_TOKEN=strengthway_meta_webhook_secret_verify_2026
WHATSAPP_GRAPH_API_VERSION=v20.0
WHATSAPP_PAYMENT_TEMPLATE_NAME=membership_payment_link
WHATSAPP_PAYMENT_TEMPLATE_LANG=en_US
```

---

## 3. Razorpay Payment Links Setup

### Step 1: Obtain API Keys
1. Log in to [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Toggle between **Test Mode** (for development/validation) and **Live Mode** (for production).
3. Navigate to **Account & Settings** > **API Keys**.
4. Click **Generate Key**; copy the **Key Id** and **Key Secret**.
5. Save in `.env` as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.

### Step 2: Configure Razorpay Webhooks
1. In the Razorpay Dashboard, go to **Account & Settings** > **Webhooks**.
2. Click **Add New Webhook**:
   - **Webhook URL**: `https://<your-public-api-domain>/api/v1/enrollments/webhook/razorpay`
   - **Secret**: Enter a strong secret string (e.g. `rzp_sec_strengthway_webhook_2026`) and copy it to `RAZORPAY_WEBHOOK_SECRET` in `.env`.
   - **Alert Email**: Enter admin email for failure alerts.
   - **Active Events**: Check the following required events:
     - `payment_link.paid` (Primary trigger when athlete completes link payment)
     - `payment.captured` (Triggered on captured transactions)
     - `payment.failed` (Updates invoice status to Failed)
     - `payment_link.expired` (Updates status when 48h validity lapses)
     - `payment_link.cancelled` (Triggered if staff voids payment link)
3. Click **Create Webhook**.

---

## 4. Meta WhatsApp Business Cloud API Setup

### Step 1: Create Meta Developer App & Add WhatsApp
1. Visit [developers.facebook.com](https://developers.facebook.com) and click **Create App**.
2. Select **Business** as the app type and link your Meta Business Manager.
3. Under **Add products to your app**, select **WhatsApp** and click **Set up**.

### Step 2: Generate Permanent System User Access Token
> [!IMPORTANT]
> The temporary token in the API Setup dashboard expires after 24 hours. For production, generate a permanent System User Token.

1. Open Meta Business Manager at [business.facebook.com/settings](https://business.facebook.com/settings).
2. Navigate to **Users** > **System Users**.
3. Create a System User with role **Admin** (e.g. `strengthway-bot`).
4. Click **Assign Assets** and grant Full Control over your Developer App and WhatsApp Business Account.
5. Click **Generate New Token**:
   - App: Select your Gym CRM App.
   - Expiration: **Never**.
   - Permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
6. Copy the generated token and save as `WHATSAPP_ACCESS_TOKEN`.

### Step 3: Register Approved Message Template
Meta requires proactive outbound messages to use pre-approved templates:
1. In WhatsApp Manager, go to **Account tools** > **Message templates** > **Create template**.
2. Configure template settings:
   - **Category**: `Utility`
   - **Template Name**: `membership_payment_link`
   - **Language**: `English (US)` (`en_US`)
3. Body text copy:
```text
Hello {{1}}, thank you for choosing {{2}} Gym.

Your membership enrollment is ready.

Membership plan: {{3}}
Amount payable: {{4}}
Invoice reference: {{5}}

Please complete your payment securely using this link:
{{6}}

Contact our gym if you need any assistance.
```
4. Parameter Mapping:
   - `{{1}}`: Candidate Full Name (e.g., `Alexander Macedon`)
   - `{{2}}`: Gym Facility Name (e.g., `Strengthway Gym`)
   - `{{3}}`: Membership Plan and Duration (e.g., `Quarterly Strength Elite (3 Mo)`)
   - `{{4}}`: Net Payable Amount (e.g., `₹13,000`)
   - `{{5}}`: Invoice Reference Number (e.g., `INV-2026-0001`)
   - `{{6}}`: Hosted Razorpay Checkout URL (e.g., `https://rzp.io/i/xyz123` or `/payment/checkout?...`)
5. Submit for approval. Utility templates are typically approved within minutes.

### Step 4: Configure Meta Webhooks
1. In Meta Developer App, navigate to **WhatsApp** > **Configuration**.
2. Under **Webhook**, click **Edit**:
   - **Callback URL**: `https://<your-public-api-domain>/api/v1/whatsapp/webhook`
   - **Verify Token**: Must match `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (default: `strengthway_meta_webhook_secret_verify_2026`).
3. Click **Verify and save**. The backend handles GET `hub.challenge` verification automatically.
4. Under **Webhook fields**, click **Manage** and subscribe to `messages`.
5. Under **Settings** > **Basic**, copy your **App Secret** to `WHATSAPP_APP_SECRET` in `.env` for HMAC-SHA256 signature verification.

---

## 5. Security Protocols & Core Business Rules

1. **Strict Backend Price Computation**:
   - Client applications never specify the final payable amount. The backend computes:
     `Final Payable = Plan Price - Authorized Concession (Fixed or %)`.
   - Percentage discounts are capped at 100%. Fixed discounts cannot exceed plan price.
2. **Amount Conversion**:
   - Razorpay Payment Links API expects amounts in paise (`Amount * 100`).
   - The backend converts INR to integer paise before dispatching to the gateway.
3. **Link Reuse & Idempotency**:
   - When Admin clicks **Generate & Send Payment Link via WhatsApp**, the backend checks if an unexpired, active link (`status: "Created"`) already exists on the invoice.
   - If active, the existing link is reused and dispatched via WhatsApp without generating duplicate links or invoices.
   - If expired or absent, a fresh link is created and saved.
4. **Decoupled Verification**:
   - WhatsApp message status changes (`sent`, `delivered`, `read`) **never** alter invoice payment status.
   - Invoices are only marked `Paid` and Members only activated upon verified cryptographic gateway signature (HMAC-SHA256) matching the exact payable amount.
5. **RBAC Protection**:
   - Enrollment creation, concession assignment, payment link generation, and offline collections require Admin role (`requireAdmin`). Member and Trainer roles receive 403 Forbidden.

---

## 6. Verification & Automated Test Suite

Run the full automated test suite covering Razorpay Payment Links, Meta WhatsApp Cloud API, and Member conversion:

```bash
# In StrengthwayBackend directory:
npm test src/modules/enrollments/enrollment.test.js src/modules/whatsapp/whatsapp.test.js
```

### Covered Test Matrix:
- Next auto-sequenced enrollment ID & invoice number generation (`ENR-YYYY-XXXX`, `INV-YYYY-XXXX`)
- Backend discount calculation & pending invoice creation without prematurely creating a Member
- Duplicate submission prevention on repeated form posts
- Admin RBAC protected action `Generate & Send Payment Link via WhatsApp` with active link reuse
- Meta WhatsApp Cloud API payload formatting, phone normalization, and simulated fallback
- GET challenge verification and POST HMAC-SHA256 signature verification for Meta webhooks
- Independent tracking of WhatsApp delivery status (`sent` ➔ `delivered` ➔ `read`)
- Razorpay Webhook processing (`payment_link.paid`) with signature verification and amount check
- Storage of UPI reference/UTR (`acquirer_data.upi_transaction_id`) and payment timestamp
- Automatic Member creation, plan date calculation, and batch capacity allocation upon verified payment
- Duplicate webhook event idempotency (prevents duplicate payment records or members)
