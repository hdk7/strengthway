# Meta WhatsApp Business Cloud API Integration Guide — Strengthway Gym CRM

This document details the configuration, deployment, and operational procedures for Meta's official WhatsApp Business Platform Cloud API in the Strengthway Gym CRM.

---

## 1. Architecture & Workflow Overview

```
 [Prospective Athlete]
        │ (Inquiry logged / contacted)
        ▼
   [Admin Portal] ──────► [Enrollment Dossier & Invoice Created]
                                │ (Invoice: "Pending Payment")
                                ▼
                   [Payment Gateway Service]
                                │ Generates hosted checkout URL
                                ▼
                   [Meta WhatsApp Cloud API Service]
                                │ Dispatches approved template or text
                                ▼
                       [Meta Graph API]
                                │
             ┌──────────────────┴──────────────────┐
             ▼                                     ▼
 [Customer Receives WhatsApp Link]       [Meta Webhook Listener]
             │                            (POST /api/v1/whatsapp/webhook)
             ▼                                     │
 [Customer Completes Payment]                      ▼
             │                      [Updates Status: Delivered / Read]
             ▼                      (Does NOT mark invoice as paid)
 [Payment Gateway Webhook/Verify]
             │
             ▼
 [Invoice: "Paid" ➔ Member Record Activated]
```

### Key Principles
1. **Decoupled Fallback (Simulation Mode)**: If Meta API credentials are not yet configured in `.env`, the CRM operates in high-fidelity simulated mode (`wamid.sim_...`), logs audit trails, and provides a direct WhatsApp Web URL for manual staff dispatch.
2. **Separation of Concerns**: WhatsApp message delivery or read receipts **never** mark an invoice as paid. Only verified payment gateway callbacks or authorized admin counter payments activate member accounts.
3. **Admin Exclusivity**: Message send, resend, and diagnostic endpoints require Admin RBAC (`requireAdmin`).

---

## 2. Meta Developer Portal Setup (Step-by-Step)

### Step 1: Create a Meta Developer App
1. Go to [developers.facebook.com](https://developers.facebook.com) and log in with your Facebook / Meta account.
2. Click **My Apps** > **Create App**.
3. Select **Other** as the use case > click **Next**.
4. Select **Business** as the app type > click **Next**.
5. Set your App Display Name (e.g., `Strengthway Gym Platform`) and link your Meta Business Account. Click **Create app**.

### Step 2: Add WhatsApp Product
1. In the App Dashboard under **Add products to your app**, locate **WhatsApp** and click **Set up**.
2. Accept the Meta WhatsApp Business Terms of Service.

### Step 3: API Setup & Identifiers
1. In the left navigation, navigate to **WhatsApp** > **API Setup**.
2. Note the following values:
   - **Phone number ID**: Numeric string identifying your sending phone number (e.g., `108249823471029`).
   - **WhatsApp Business Account ID**: Numeric string identifying your WABA.
   - **Temporary access token**: Provided for immediate sandbox testing (expires after 24 hours).

---

## 3. Production Access Token (System User)

> [!IMPORTANT]
> Never use the 24-hour temporary access token in production! Generate a permanent System User Token.

1. Open **Meta Business Manager** at [business.facebook.com/settings](https://business.facebook.com/settings).
2. Go to **Users** > **System Users**.
3. Click **Add**, name the user (e.g., `strengthway-api-bot`), and select the **Admin** system user role.
4. Under **Assigned Assets**, click **Assign Assets**:
   - Go to **Apps** > select your Developer App > enable **Full Control (Manage App)**.
   - Go to **WhatsApp Accounts** > select your gym's WhatsApp account > enable **Full Control**.
5. Click **Generate New Token**:
   - Select your Developer App.
   - Token Expiration: **Never**.
   - Select the following permissions:
     - `whatsapp_business_messaging` (Required to send templates and messages)
     - `whatsapp_business_management` (Required to manage templates and account metadata)
6. Copy the generated permanent token and save it into `StrengthwayBackend/.env` as `WHATSAPP_ACCESS_TOKEN`.

---

## 4. Message Template Creation & Approval

Meta requires messages initiated outside the 24-hour customer service window to use pre-approved templates.

1. In Meta WhatsApp Manager, navigate to **Account tools** > **Message templates**.
2. Click **Create template**:
   - **Category**: `Utility`
   - **Name**: `membership_payment_link`
   - **Language**: `English (US)` (`en_US`)
3. Template Body Copy:
```text
Hello {{1}}, thank you for choosing {{2}} Gym.

Your membership enrollment is ready.

Plan: {{3}}
Amount payable: {{4}}
Invoice reference: {{5}}

Complete your payment securely using the link below:
{{6}}

Please contact the gym if you need assistance.
```

### Parameter Mapping Reference
| Placeholder | Variable Name | Example Value |
|-------------|---------------|---------------|
| `{{1}}` | Candidate Name | `Marcus Aurelius` |
| `{{2}}` | Gym Facility Name | `Strengthway Gym` |
| `{{3}}` | Plan Name & Duration | `Quarterly Elite (3 Mo)` |
| `{{4}}` | Net Payable Amount | `₹12,000` |
| `{{5}}` | Invoice Reference | `INV-2026-0001` |
| `{{6}}` | Secure Payment URL | `https://strengthway.com/payment/checkout?link=xyz` |

4. Submit the template. Meta utility templates are typically approved within minutes.

---

## 5. Webhook Configuration (Delivery & Read Tracking)

The Gym CRM receives real-time delivery (`sent`, `delivered`, `read`, `failed`) callbacks from Meta.

### Step 1: Set Up Webhook URL & Verify Token
1. In Meta Developer App, go to **WhatsApp** > **Configuration**.
2. Under **Webhook**, click **Edit**:
   - **Callback URL**: `https://<your-public-domain>/api/v1/whatsapp/webhook`
   - **Verify token**: The value set in `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (e.g. `strengthway_meta_webhook_secret_verify_2026`).
3. Click **Verify and save**. Meta will issue a `GET` request with `hub.challenge`. The backend responds with status `200` and the challenge token.

### Step 2: Subscribe to Webhook Events
1. In the Webhook fields table, click **Manage**.
2. Check the box for **messages** and click **Done**.

### Step 3: Configure App Secret for HMAC-SHA256 Verification
1. In App Settings > **Basic**, find your **App Secret**.
2. Add this value to `StrengthwayBackend/.env` as `WHATSAPP_APP_SECRET`.
3. The backend automatically verifies the `X-Hub-Signature-256` header using HMAC-SHA256 over raw request bodies.

---

## 6. Environment Variables Reference

Add the following variables to `StrengthwayBackend/.env`:

```env
# ─── Meta WhatsApp Business Cloud API ──────────────────────────
WHATSAPP_ACCESS_TOKEN=EAAB...your_system_user_permanent_token_here
WHATSAPP_PHONE_NUMBER_ID=108249823471029
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
WHATSAPP_APP_SECRET=a1b2c3d4e5f6...your_meta_app_secret
WHATSAPP_WEBHOOK_VERIFY_TOKEN=strengthway_meta_webhook_secret_verify_2026
WHATSAPP_GRAPH_API_VERSION=v20.0
WHATSAPP_PAYMENT_TEMPLATE_NAME=membership_payment_link
WHATSAPP_PAYMENT_TEMPLATE_LANG=en_US
GYM_NAME=Strengthway Gym
```

---

## 7. Testing in Sandbox vs Production

### Sandbox Testing
- Meta provides a free test business phone number.
- In **WhatsApp** > **API Setup**, add your personal phone number to the **To** recipient list and verify it via SMS OTP.
- In Admin Settings > **WhatsApp Cloud API**, use the **Interactive Test Console** to send a test ping.

### Going Live with Production Business Phone Number
1. In Meta WhatsApp Manager, navigate to **Phone numbers** > **Add phone number**.
2. Enter your business display name and legal business phone number.
3. Verify the number via SMS or Voice OTP.
4. Replace `WHATSAPP_PHONE_NUMBER_ID` in `StrengthwayBackend/.env` with your production Phone Number ID.
5. Restart backend server (`npm run dev` or production process manager).

---

## 8. Verification & Test Suite

Run the automated WhatsApp and enrollment test suite:

```bash
# In StrengthwayBackend directory:
npx jest --silent --forceExit src/modules/whatsapp/whatsapp.test.js src/modules/enrollments/enrollment.test.js
```

### Covered Test Cases:
- Phone number normalization (E.164 without `+`, Indian default `91`)
- Meta template payload structure & text copy generation
- Decoupled simulated dispatch and DB audit logging
- GET webhook verification challenge
- POST HMAC-SHA256 signature verification & rejection of tampered payloads
- Idempotent delivery status updating (`sent` ➔ `delivered` ➔ `read`)
- Independence of payment verification from message delivery
- Admin RBAC access enforcement (403 for trainers/members)
